import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { connectMongoose, CompanyBrain, saveLocalFallback } from '@/lib/mongodb';

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
    const { action, company_id } = body;
    const companyId = company_id || 'nexus_labs';
    const docId = companyId === 'nexus_labs' ? 'nexus_labs_brain' : `company_brain_${companyId}`;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const dbPath = getDbPath();
    let state: any = null;
    try {
      await connectMongoose();
      state = await CompanyBrain.findOne({ _id: docId }).lean();
    } catch (err) {
      console.error('[Approve API] Error loading state from MongoDB:', err);
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

      try {
        state._id = docId;
        await CompanyBrain.replaceOne({ _id: docId }, state, { upsert: true });
      } catch (err) {
        console.error('[Approve API] Error saving state to MongoDB:', err);
      }
      if (companyId === 'nexus_labs') {
        await saveLocalFallback(dbPath, state);
      }
      return NextResponse.json({ success: true, message: 'Recommendation approved and milestone added.', state });
    }

    if (action === 'reject_recommendation') {
      const { recommendation_id } = body;
      if (!recommendation_id) {
        return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
      }

      const recommendations = state.evolutionary_feedback_loop?.active_recommendations || [];
      state.evolutionary_feedback_loop.active_recommendations = recommendations.filter(
        (r: any) => r.recommendation_id !== recommendation_id
      );

      // Also clean up from active session output if it matches
      if (state.current_session?.agent_outputs?.marshall_recommendation?.recommendation_id === recommendation_id) {
        state.current_session.agent_outputs.marshall_recommendation = null;
      }

      try {
        state._id = docId;
        await CompanyBrain.replaceOne({ _id: docId }, state, { upsert: true });
      } catch (err) {
        console.error('[Approve API] Error saving state to MongoDB:', err);
      }
      if (companyId === 'nexus_labs') {
        await saveLocalFallback(dbPath, state);
      }
      return NextResponse.json({ success: true, message: 'Recommendation rejected and removed.', state });
    }

    if (action === 'update_drafts') {
      const { drafts } = body;
      if (!drafts) {
        return NextResponse.json({ error: 'Drafts object is required' }, { status: 400 });
      }

      if (!state.current_session || !state.current_session.agent_outputs) {
        return NextResponse.json({ error: 'No active session output to update' }, { status: 400 });
      }

      state.current_session.agent_outputs.gigi_content_drafts = {
        ...state.current_session.agent_outputs.gigi_content_drafts,
        ...drafts
      };

      try {
        state._id = docId;
        await CompanyBrain.replaceOne({ _id: docId }, state, { upsert: true });
      } catch (err) {
        console.error('[Approve API] Error saving state to MongoDB:', err);
      }
      if (companyId === 'nexus_labs') {
        await saveLocalFallback(dbPath, state);
      }
      return NextResponse.json({ success: true, message: 'Drafts updated successfully.', state });
    }

    if (action === 'ship_marketing') {
      if (!state.current_session || !state.current_session.agent_outputs) {
        return NextResponse.json({ error: 'No active session output to ship' }, { status: 400 });
      }

      state.current_session.agent_outputs.approval_status = 'SHIPPED';

      try {
        state._id = docId;
        await CompanyBrain.replaceOne({ _id: docId }, state, { upsert: true });
      } catch (err) {
        console.error('[Approve API] Error saving state to MongoDB:', err);
      }
      if (companyId === 'nexus_labs') {
        await saveLocalFallback(dbPath, state);
      }
      return NextResponse.json({ success: true, message: 'Campaign shipped and status updated.', state });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error in approval API' }, { status: 500 });
  }
}
