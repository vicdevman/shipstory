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
    'C:/Users/User/OneDrive/Desktop/projects/shipstory/agents/shared/company_brain_db.json',
  ];
  for (const p of paths) {
    try {
      if (require('fs').existsSync(p)) return p;
    } catch (e) {}
  }
  return paths[0];
}

async function loadState(dbPath: string): Promise<any> {
  try {
    await connectMongoose();
    const s = await CompanyBrain.findOne({ _id: 'nexus_labs_brain' }).lean();
    if (s) return s;
  } catch (err) {
    console.error('[Settings API] MongoDB error:', err);
  }
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

async function persistState(dbPath: string, state: any): Promise<void> {
  try {
    state._id = 'nexus_labs_brain';
    await CompanyBrain.replaceOne({ _id: 'nexus_labs_brain' }, state, { upsert: true });
  } catch (err) {
    console.error('[Settings API] MongoDB save error:', err);
  }
  await saveLocalFallback(dbPath, state);
}

// GET — return company_metadata + operational_assets for the brand editor
export async function GET() {
  try {
    const dbPath = getDbPath();
    const state = await loadState(dbPath);
    if (!state) {
      return NextResponse.json({ error: 'Company Brain not found' }, { status: 404 });
    }
    return NextResponse.json({
      company_metadata: state.company_metadata || {},
      operational_assets: {
        active_milestones: state.operational_assets?.active_milestones || [],
        epic_progress_percentages: state.operational_assets?.epic_progress_percentages || {},
        pitch_deck_summary: state.operational_assets?.pitch_deck_summary || '',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — update brand context or operational assets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const dbPath = getDbPath();
    const state = await loadState(dbPath);
    if (!state) {
      return NextResponse.json({ error: 'Company Brain not found' }, { status: 404 });
    }

    // ── Action: update_brand ──────────────────────────────────────────────────
    if (action === 'update_brand') {
      const {
        name,
        value_proposition,
        target_persona,
        tone,
        restricted_keywords, // string or string[]
        raw_brand_voice_constraints,
      } = body;

      if (!state.company_metadata) state.company_metadata = {};
      if (!state.company_metadata.style_guide) state.company_metadata.style_guide = {};
      if (!state.company_metadata.security_filters) state.company_metadata.security_filters = {};

      if (name !== undefined) state.company_metadata.name = name;
      if (value_proposition !== undefined) state.company_metadata.value_proposition = value_proposition;
      if (target_persona !== undefined) state.company_metadata.target_persona = target_persona;
      if (tone !== undefined) state.company_metadata.style_guide.tone = tone;
      if (raw_brand_voice_constraints !== undefined) {
        state.company_metadata.raw_brand_voice_constraints = raw_brand_voice_constraints;
      }

      if (restricted_keywords !== undefined) {
        const keywords = Array.isArray(restricted_keywords)
          ? restricted_keywords
          : String(restricted_keywords)
              .split(',')
              .map((k: string) => k.trim())
              .filter(Boolean);
        state.company_metadata.security_filters.restricted_keywords = keywords;
      }

      await persistState(dbPath, state);
      console.log(`[Settings API] Brand context updated → company: "${state.company_metadata.name}"`);
      return NextResponse.json({
        success: true,
        message: 'Brand context updated. All future pipeline runs will use the new settings.',
        company_metadata: state.company_metadata,
      });
    }

    // ── Action: update_milestones ─────────────────────────────────────────────
    if (action === 'update_milestones') {
      const { active_milestones } = body;
      if (!Array.isArray(active_milestones)) {
        return NextResponse.json({ error: 'active_milestones must be an array' }, { status: 400 });
      }
      if (!state.operational_assets) state.operational_assets = {};
      state.operational_assets.active_milestones = active_milestones;
      await persistState(dbPath, state);
      return NextResponse.json({ success: true, message: 'Milestones updated.' });
    }

    // ── Action: update_pitch_deck ─────────────────────────────────────────────
    if (action === 'update_pitch_deck') {
      const { pitch_deck_summary } = body;
      if (!state.operational_assets) state.operational_assets = {};
      state.operational_assets.pitch_deck_summary = pitch_deck_summary || '';
      await persistState(dbPath, state);
      return NextResponse.json({ success: true, message: 'Pitch deck updated.' });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
