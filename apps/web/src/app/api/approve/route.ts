import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getMongoCollection, saveLocalFallback } from '@/lib/mongodb';

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
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const dbPath = getDbPath();
    let state: any = null;
    const collection = await getMongoCollection();

    if (collection) {
      try {
        state = await collection.findOne({ _id: "nexus_labs_brain" });
      } catch (err) {
        console.error('[Approve API] Error loading state from MongoDB:', err);
      }
    }

    if (!state) {
      try {
        const data = await fs.readFile(dbPath, 'utf8');
        state = JSON.parse(data);
      } catch (err) {
        return NextResponse.json({ error: 'Database file not initialized' }, { status: 500 });
      }
    }

    if (action === 'approve_recommendation') {
      const { recommendation_id } = body;
      if (!recommendation_id) {
        return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
      }

      const recommendations = state.evolutionary_feedback_loop?.active_recommendations || [];
      const rec = recommendations.find((r: any) => r.recommendation_id === recommendation_id);

      if (!rec) {
        return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
      }

      rec.audit_status = 'APPROVED';

      if (!state.operational_assets.active_milestones) {
        state.operational_assets.active_milestones = [];
      }

      if (!state.operational_assets.active_milestones.includes(rec.summary)) {
        state.operational_assets.active_milestones.push(rec.summary);
      }

      if (collection) {
        try {
          state._id = "nexus_labs_brain";
          await collection.replaceOne({ _id: "nexus_labs_brain" }, state, { upsert: true });
        } catch (err) {
          console.error('[Approve API] Error saving state to MongoDB:', err);
        }
      }
      await saveLocalFallback(dbPath, state);
      return NextResponse.json({ success: true, message: 'Recommendation approved and milestone added.', state });
    }

    if (action === 'ship_marketing') {
      if (!state.current_session || !state.current_session.agent_outputs) {
        return NextResponse.json({ error: 'No active session output to ship' }, { status: 400 });
      }

      state.current_session.agent_outputs.approval_status = 'SHIPPED';

      if (collection) {
        try {
          state._id = "nexus_labs_brain";
          await collection.replaceOne({ _id: "nexus_labs_brain" }, state, { upsert: true });
        } catch (err) {
          console.error('[Approve API] Error saving state to MongoDB:', err);
        }
      }
      await saveLocalFallback(dbPath, state);
      return NextResponse.json({ success: true, message: 'Campaign shipped and status updated.', state });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error in approval API' }, { status: 500 });
  }
}
