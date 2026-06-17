import { NextResponse } from 'next/server';
import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { connectMongoose, CompanyBrain, saveLocalFallback, getAgentConfig } from '@/lib/mongodb';

function getDbPath() {
  const cwd = process.cwd();
  const paths = [
    path.join(cwd, '../../agents/shared/company_brain_db.json'),
    path.join(cwd, 'agents/shared/company_brain_db.json'),
    path.join(cwd, '../agents/shared/company_brain_db.json'),
    path.join(cwd, 'apps/web/../../agents/shared/company_brain_db.json'),
    'C:/Users/User/OneDrive/Desktop/projects/shipstory/agents/shared/company_brain_db.json'
  ];

  for (const p of paths) {
    try {
      if (existsSync(p)) {
        return p;
      }
    } catch (e) {}
  }
  return paths[0]; // fallback
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dbPath = getDbPath();

    // Load current state from MongoDB or fallback to file
    let state: any = null;
    try {
      await connectMongoose();
      state = await CompanyBrain.findOne({ _id: "nexus_labs_brain" }).lean();
    } catch (err) {
      console.error('[Webhook API] Error loading state from MongoDB:', err);
    }

    if (!state) {
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        state = JSON.parse(data);
      } catch (err) {
        return NextResponse.json({ error: 'Database file not initialized or missing' }, { status: 500 });
      }
    }

    // Check if room_id is set. If not, check if it exists in local file.
    if (!state.room_id) {
      try {
        const localData = await fs.readFile(dbPath, 'utf8');
        const localState = JSON.parse(localData);
        if (localState.room_id) {
          state.room_id = localState.room_id;
        }
      } catch (e) {}
    }

    if (!state.room_id) {
      return NextResponse.json(
        { error: 'No active Band room ID found. Please start the agent processes first so they can connect and sync the room ID.' },
        { status: 400 }
      );
    }

    const sessionId = body.session_id || `sess_${Date.now()}`;
    const triggerSource = body.source || 'MANUAL';
    const rawInputs = body.raw_inputs || {
      commit_message: body.commit_message || 'Manual Trigger Executed',
      changed_files: body.changed_files || [],
    };

    // Initialize the session state
    state.current_session = {
      session_id: sessionId,
      created_at: new Date().toISOString(),
      trigger_source: triggerSource,
      status: 'PROCESSING',
      raw_inputs: rawInputs,
      agent_outputs: {
        devin_technical_summary: null,
        priscilla_importance_score: null,
        gigi_content_drafts: {
          twitter: null,
          changelog: null,
          newsletter: null,
        },
        approval_status: 'PENDING',
      },
      rejections_and_memos: [],
      chat_history: [
        {
          id: 'welcome',
          sender: 'connie',
          message: 'GitHub webhook triggered a new session! I am Connie, your Chief of Staff. Devin, Priscilla, and Gigi have entered the war room.',
          timestamp: new Date().toLocaleTimeString(),
        }
      ],
    };

    // Save updated state
    try {
      state._id = "nexus_labs_brain";
      await CompanyBrain.replaceOne({ _id: "nexus_labs_brain" }, state, { upsert: true });
    } catch (err) {
      console.error('[Webhook API] Error saving state to MongoDB:', err);
    }
    await saveLocalFallback(dbPath, state);

    // Send direct HTTP call to Band room API for commit trigger
    let connieApiKey = process.env.CONNIE_API_KEY || '';
    let devinId = process.env.DEVIN_AGENT_ID || '';

    const agentConfig = getAgentConfig();
    if (agentConfig) {
      if (agentConfig.connie_assistant) {
        connieApiKey = agentConfig.connie_assistant.api_key || connieApiKey;
      } else if (agentConfig.devin_eng) {
        connieApiKey = agentConfig.devin_eng.api_key || connieApiKey;
      }
      if (agentConfig.devin_eng) {
        devinId = agentConfig.devin_eng.agent_id || devinId;
      }
    }

    const restUrl = process.env.BAND_REST_URL || process.env.THENVOI_REST_URL || 'https://app.band.ai/';

    if (connieApiKey && state.room_id && devinId) {
      const url = `${restUrl.replace(/\/$/, '')}/api/v1/agent/chats/${state.room_id}/messages`;
      const commitMsg = rawInputs.commit_message || 'Manual Trigger Executed';
      const filesList = rawInputs.changed_files || [];
      const content = `[GITHUB_COMMIT] New commit triggered:\nMessage: ${commitMsg}\nFiles: ${filesList.join(', ')}\n\n@vicdevman/devin please review.`;

      const bodyPayload = {
        message: {
          content: content,
          mentions: [
            {
              id: devinId,
              handle: 'vicdevman/devin',
              name: 'Devin'
            }
          ]
        }
      };

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': connieApiKey
        },
        body: JSON.stringify(bodyPayload)
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`[Band API] Failed to post commit trigger to Band room: ${res.status} ${text}`);
        } else {
          console.log(`[Band API] Successfully posted commit trigger to Band room.`);
        }
      }).catch((err) => {
        console.error(`[Band API] Fetch error posting commit trigger to Band room:`, err);
      });
    } else {
      console.warn(`[Band API] Cannot send commit trigger directly: missing connieApiKey (${!!connieApiKey}), room_id (${!!state.room_id}), or devinId (${!!devinId}). Spawning trigger_commit.py fallback.`);
      const { exec } = require('child_process');
      const agentsDir = path.join(path.dirname(dbPath), '..');
      exec('uv run python trigger_commit.py', { 
        cwd: agentsDir,
        env: { ...process.env, PYTHONPATH: '.', PYTHONUTF8: '1' }
      }, (err: any, stdout: string, stderr: string) => {
        if (err) {
          console.error(`Failed to run trigger_commit.py: ${err.message}`);
          console.error(`stderr: ${stderr}`);
        } else {
          console.log(`trigger_commit.py success: ${stdout}`);
        }
      });
    }

    return NextResponse.json({ success: true, session_id: sessionId, state });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid body or internal server error' }, { status: 400 });
  }
}

