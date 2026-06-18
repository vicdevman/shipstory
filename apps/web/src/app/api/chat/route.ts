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
    let roomId = state.room_id || '';
    if (!roomId) {
      try {
        const localData = await fs.readFile(dbPath, 'utf8');
        const localState = JSON.parse(localData);
        if (localState.room_id) {
          roomId = localState.room_id;
          state.room_id = roomId;
        }
      } catch (e) {}
    }

    if (!roomId && process.env.BAND_ROOM_ID) {
      roomId = process.env.BAND_ROOM_ID;
      state.room_id = roomId;
    }

    if (!roomId) {
      return NextResponse.json(
        { error: 'No active Band room ID found. Please make sure the Connie agent process is running or set the BAND_ROOM_ID environment variable.' },
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

    if (devinApiKey && roomId && connieId) {
      const url = `${restUrl.replace(/\/$/, '')}/api/v1/agent/chats/${roomId}/messages`;
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
      console.error(`[Band API] Cannot send chat message: missing devinApiKey (${!!devinApiKey}), roomId (${!!roomId}), or connieId (${!!connieId}).`);
      return NextResponse.json(
        { error: 'Cannot contact Connie: Chat credentials/IDs are not configured on the server.' },
        { status: 500 }
      );
    }

    // FIRE-AND-RETURN: Do NOT poll. Return immediately.
    // The frontend polls /api/brain every 1.5s and picks up Connie's reply
    // when the Band agent writes it to chat_history in MongoDB.
    return NextResponse.json({ success: true, chat_history: state.current_session.chat_history });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error in chat API' }, { status: 500 });
  }
}
