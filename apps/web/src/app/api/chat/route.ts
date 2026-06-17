import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
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
      if (require('fs').existsSync(p)) {
        return p;
      }
    } catch (e) {}
  }
  return paths[0]; // fallback
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const dbPath = getDbPath();
    let state: any = null;
    try {
      await connectMongoose();
      state = await CompanyBrain.findOne({ _id: "nexus_labs_brain" }).lean();
    } catch (err) {
      console.error('[Chat API] Error loading state from MongoDB:', err);
    }

    if (!state) {
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        state = JSON.parse(data);
      } catch (err) {
        return NextResponse.json({ error: 'Database file not initialized' }, { status: 500 });
      }
    }

    // Initialize chat history if not exists
    if (!state.current_session.chat_history) {
      state.current_session.chat_history = [
        {
          id: 'welcome',
          sender: 'connie',
          message: 'Hello! I am Connie, your Chief of Staff. How can I help you manage the autonomous growth department today?',
          timestamp: new Date().toLocaleTimeString(),
        }
      ];
    }

    // Check if room_id is set
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
        { error: 'No active Band room ID found. Please make sure the Connie agent process is running and connected first.' },
        { status: 400 }
      );
    }

    const userMessageObj = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      message: message,
      timestamp: new Date().toLocaleTimeString(),
    };

    state.current_session.chat_history.push(userMessageObj);
    const initialLength = state.current_session.chat_history.length;

    try {
      state._id = "nexus_labs_brain";
      await CompanyBrain.replaceOne({ _id: "nexus_labs_brain" }, state, { upsert: true });
    } catch (err) {
      console.error('[Chat API] Error saving state to MongoDB:', err);
    }
    await saveLocalFallback(dbPath, state);

    // Send direct HTTP call to Band room API
    let connieId = process.env.CONNIE_AGENT_ID || '';
    let devinApiKey = process.env.DEVIN_API_KEY || '';

    const agentConfig = getAgentConfig();
    if (agentConfig) {
      if (agentConfig.connie_assistant) {
        connieId = agentConfig.connie_assistant.agent_id || connieId;
      }
      if (agentConfig.devin_eng) {
        devinApiKey = agentConfig.devin_eng.api_key || devinApiKey;
      }
    }

    const restUrl = process.env.BAND_REST_URL || process.env.THENVOI_REST_URL || 'https://app.band.ai/';

    if (devinApiKey && state.room_id && connieId) {
      const url = `${restUrl.replace(/\/$/, '')}/api/v1/agent/chats/${state.room_id}/messages`;
      const bodyPayload = {
        message: {
          content: `vicdevman/connie ${message}`,
          mentions: [
            {
              id: connieId,
              handle: 'vicdevman/connie',
              name: 'Connie'
            }
          ]
        }
      };

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': devinApiKey
        },
        body: JSON.stringify(bodyPayload)
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error(`[Band API] Failed to post message to Band room: ${res.status} ${text}`);
        } else {
          console.log(`[Band API] Successfully posted message to Band room.`);
        }
      }).catch((err) => {
        console.error(`[Band API] Fetch error posting message to Band room:`, err);
      });
    } else {
      console.warn(`[Band API] Cannot send chat message directly: missing devinApiKey (${!!devinApiKey}), room_id (${!!state.room_id}), or connieId (${!!connieId}). Spawning trigger_chat.py fallback.`);
      const { exec } = require('child_process');
      const agentsDir = path.join(path.dirname(dbPath), '..');
      exec('uv run python trigger_chat.py', { 
        cwd: agentsDir,
        env: { ...process.env, PYTHONPATH: '.', PYTHONUTF8: '1' }
      }, (err: any, stdout: string, stderr: string) => {
        if (err) {
          console.error(`Failed to run trigger_chat.py: ${err.message}`);
          console.error(`stderr: ${stderr}`);
        } else {
          console.log(`trigger_chat.py success: ${stdout}`);
        }
      });
    }

    // Poll DB for Connie's response
    const maxPollTime = 12000; // 12 seconds max polling time
    const pollInterval = 200; // 200ms interval
    let elapsed = 0;
    let connieReplied = false;

    while (elapsed < maxPollTime) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      elapsed += pollInterval;

      try {
        let updatedState: any = null;
        try {
          updatedState = await CompanyBrain.findOne({ _id: "nexus_labs_brain" }).lean();
        } catch (pollErr) {
          console.error('[Chat API] Error polling state from MongoDB:', pollErr);
        }
        if (!updatedState) {
          const fileContent = await fs.readFile(dbPath, 'utf8');
          updatedState = JSON.parse(fileContent);
        }
        
        const history = updatedState.current_session?.chat_history || [];
        
        // Find if there is a connie message appended after our user message
        const newConnieMsg = history.slice(initialLength).find((msg: any) => msg.sender === 'connie');
        if (newConnieMsg) {
          state = updatedState;
          connieReplied = true;
          break;
        }
      } catch (pollErr) {
        console.error('Polling error:', pollErr);
      }
    }

    if (!connieReplied) {
      // If Connie timed out, add a fallback message so the UI is not stuck
      const timeoutMsg = {
        id: `msg_connie_timeout_${Date.now()}`,
        sender: 'connie',
        message: "I am currently processing requests on the Band network. Please check the Band room or try again in a moment.",
        timestamp: new Date().toLocaleTimeString(),
      };
      state.current_session.chat_history.push(timeoutMsg);
      
      try {
        state._id = "nexus_labs_brain";
        await CompanyBrain.replaceOne({ _id: "nexus_labs_brain" }, state, { upsert: true });
      } catch (err) {
        console.error('[Chat API] Error saving timeout state to MongoDB:', err);
      }
      await saveLocalFallback(dbPath, state);
    }

    return NextResponse.json({ success: true, chat_history: state.current_session.chat_history });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error in chat API' }, { status: 500 });
  }
}
