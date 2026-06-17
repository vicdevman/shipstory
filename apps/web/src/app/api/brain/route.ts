import { NextResponse } from 'next/server';
import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { connectMongoose, CompanyBrain, saveLocalFallback } from '@/lib/mongodb';

const defaultState = {
  "company_metadata": {
    "name": "Nexus Labs",
    "value_proposition": "Local-first, AI-powered knowledge management tool with peer-to-peer sync.",
    "target_persona": "Developers, technical founders, power note-takers",
    "style_guide": {
      "tone": "Minimalist, professional, developer-focused",
      "restrictions": [
        "Max 2 emojis per post",
        "Avoid marketing jargon like 'revolutionizing'"
      ]
    },
    "security_filters": {
      "restricted_keywords": [
        "auth_key",
        "password",
        "vulnerability",
        "leak_test",
        "private_beta_v1"
      ],
      "allow_public_roadmap": false
    }
  },
  "operational_assets": {
    "pitch_deck_summary": "Nexus Labs is solving decentralized data latency. Our MVP uses PouchDB sharding to achieve sub-10ms query syncing.",
    "active_milestones": [
      "Launch real-time peer-to-peer syncing gateway"
    ],
    "epic_progress_percentages": {
      "Epic-P2P": 40,
      "Epic-Cache": 90,
      "Epic-Auth": 10
    }
  },
  "current_session": {
    "session_id": "sess_1781525856044",
    "trigger_source": "GITHUB_COMMIT",
    "status": "PROCESSING",
    "raw_inputs": {
      "commit_message": "perf(db): implement connection pooling and redis caching layer",
      "changed_files": [
        "db.go",
        "cache.go",
        "main.go"
      ]
    },
    "agent_outputs": {
      "devin_technical_summary": null,
      "priscilla_importance_score": null,
      "gigi_content_drafts": {
        "twitter": null,
        "changelog": null,
        "newsletter": null
      },
      "approval_status": "PENDING"
    },
    "rejections_and_memos": [],
    "chat_history": [
      {
        "id": "welcome",
        "sender": "connie",
        "message": "GitHub webhook triggered a new session! I am Connie, your Chief of Staff. Devin, Priscilla, and Gigi have entered the war room.",
        "timestamp": "1:17:36 p.m."
      }
    ]
  },
  "evolutionary_feedback_loop": {
    "incoming_community_signals": [
      {
        "source": "Connie_Public_X_Reply",
        "raw_text": "I love the P2P sync, but does this work offline? Or will I lose my notes?",
        "sentiment": "Neutral-Concerned"
      }
    ],
    "active_recommendations": [
      {
        "recommendation_id": "rec_001",
        "originator": "Marshall_Research_Agent",
        "type": "ROADMAP_PIVOT",
        "summary": "Implement highly visible offline-status indicators in UI.",
        "rationale": "Competitor X does not clearly indicate offline sync states, causing user trust issues. Showing this prominently gives us a massive marketing advantage.",
        "strategic_impact_score": 8,
        "audit_status": "PENDING_HUMAN_APPROVAL"
      }
    ]
  }
};

let cachedState: any = defaultState;

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
    } catch (e) {
      console.warn(`Failed checking path existence for ${p}:`, e);
    }
  }
  return paths[0]; // fallback
}

async function readJsonFileWithRetry(filePath: string, retries = 3, delayMs = 50): Promise<any> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      if (data && data.trim()) {
        const json = JSON.parse(data);
        // Basic schema verification: must have company_metadata
        if (json && json.company_metadata) {
          return json;
        }
      }
    } catch (e) {
      lastError = e;
    }
    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw lastError || new Error(`Failed to read valid JSON from ${filePath} after ${retries} retries`);
}

export async function GET() {
  try {
    const dbPath = getDbPath();
    await connectMongoose();
    let state = await CompanyBrain.findOne({ _id: "nexus_labs_brain" }).lean();
    if (state) {
      cachedState = state; // Update cache on success
      // Keep local JSON in sync
      await saveLocalFallback(dbPath, state);
      return NextResponse.json(state);
    }

    state = await readJsonFileWithRetry(dbPath);
    cachedState = state; // Update cache on success
    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to read database state in GET /api/brain:', error);
    
    // Return cached state if we have one, to prevent breaking the frontend polling loop
    if (cachedState) {
      console.log('Returning cached company brain state.');
      return NextResponse.json(cachedState);
    }
    
    return NextResponse.json(
      { error: 'Failed to read database state', details: String(error) },
      { status: 500 }
    );
  }
}

