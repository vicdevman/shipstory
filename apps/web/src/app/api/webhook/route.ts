import { NextResponse } from 'next/server';
import { promises as fs, existsSync } from 'fs';
import path from 'path';

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

    // Load current state
    let state: any;
    try {
      const data = await fs.readFile(dbPath, 'utf8');
      state = JSON.parse(data);
    } catch (err) {
      return NextResponse.json({ error: 'Database file not initialized or missing' }, { status: 500 });
    }

    // Check if room_id is set. If not, wait/let frontend know.
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
    await fs.writeFile(dbPath, JSON.stringify(state, null, 2), 'utf8');

    // Spawn the trigger script asynchronously
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

    return NextResponse.json({ success: true, session_id: sessionId, state });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid body or internal server error' }, { status: 400 });
  }
}

