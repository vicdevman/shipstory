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
    const repoUrl = body.repository?.html_url || body.repository?.url || '';
    const companyIdFromPayload = body.company_id || '';

    try {
      await connectMongoose();
      if (repoUrl) {
        const normalize = (u: string) => u.toLowerCase().replace(/\/$/, '').replace(/\.git$/, '');
        const normalizedUrl = normalize(repoUrl);
        const allBrains = await CompanyBrain.find({}).lean();
        for (const brain of allBrains) {
          const repos = brain.company_metadata?.connected_repos || [];
          const matched = repos.some((r: any) => normalize(r.url) === normalizedUrl);
          if (matched) {
            state = brain;
            break;
          }
        }
      }
      
      if (!state && companyIdFromPayload) {
        const docId = companyIdFromPayload === 'nexus_labs' ? 'nexus_labs_brain' : `company_brain_${companyIdFromPayload}`;
        state = await CompanyBrain.findOne({ _id: docId }).lean();
      }

      if (!state) {
        state = await CompanyBrain.findOne({ _id: "nexus_labs_brain" }).lean();
      }
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

    // Upsert the active context mapping
    const stateDocId = state._id || 'nexus_labs_brain';
    const companyId = stateDocId === 'nexus_labs_brain' ? 'nexus_labs' : stateDocId.replace('company_brain_', '');
    try {
      await CompanyBrain.updateOne(
        { _id: `active_context_${state.room_id}` },
        { $set: { company_id: companyId } },
        { upsert: true }
      );
    } catch (err) {
      console.error('[Webhook API] Error saving active context mapping to MongoDB:', err);
    }

    const sessionId = body.session_id || `sess_${Date.now()}`;
    
    // Check if it's a GitHub push webhook payload
    const isGitHubPush = !!(body.repository && body.head_commit);
    
    let commitMessage = body.commit_message || '';
    let changedFiles: string[] = body.changed_files || [];
    let commitSha = body.commit_sha || null;
    let commitAuthor = body.commit_author || null;
    let commitUrl = body.commit_url || null;
    let diffSummary = body.diff_summary || null;
    let triggerSource = body.source || 'MANUAL';

    if (isGitHubPush) {
      triggerSource = 'GITHUB_COMMIT';
      const repoUrl = body.repository.html_url || body.repository.url || '';
      
      // Verification: Check if the repository is connected in our project workspace
      const connectedRepos = state.company_metadata?.connected_repos || [];
      const isConnected = connectedRepos.some((r: any) => {
        const normalize = (u: string) => u.toLowerCase().replace(/\/$/, '').replace(/\.git$/, '');
        return normalize(r.url) === normalize(repoUrl);
      });

      if (!isConnected) {
        console.warn(`[Webhook API] Ignored push webhook: Repository ${repoUrl} is not connected to this workspace.`);
        return NextResponse.json({ 
          success: false, 
          message: `Repository ${repoUrl} is not connected to this workspace.` 
        }, { status: 200 }); // Return 200 so GitHub doesn't fail
      }

      // Check if it is the main/master branch push
      const ref = body.ref || '';
      const isMainBranch = ref === 'refs/heads/main' || ref === 'refs/heads/master' || ref.endsWith('/main') || ref.endsWith('/master');
      if (!isMainBranch) {
        console.log(`[Webhook API] Ignored push on branch ${ref}. Only main/master branch pushes trigger the pipeline.`);
        return NextResponse.json({ 
          success: false, 
          message: `Ignored branch push. Only main/master branch updates trigger the analysis pipeline.` 
        }, { status: 200 });
      }

      // Extract GitHub webhook details
      commitMessage = body.head_commit.message || '';
      const fullCommitSha = body.head_commit.id || '';
      commitSha = fullCommitSha.slice(0, 7) || null;
      commitAuthor = body.head_commit.author?.name || body.head_commit.committer?.name || 'GitHub Webhook';
      commitUrl = body.head_commit.url || null;

      // Fetch the detailed commit patches from GitHub API
      const repoFullName = body.repository.full_name || '';
      if (repoFullName && fullCommitSha) {
        try {
          const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
          const githubToken = process.env.GITHUB_TOKEN || '';
          if (githubToken) {
            headers['Authorization'] = `Bearer ${githubToken}`;
          }

          const githubApiUrl = `https://api.github.com/repos/${repoFullName}/commits/${fullCommitSha}`;
          const res = await fetch(githubApiUrl, { headers });
          if (res.ok) {
            const commitDetail = await res.json();
            const files = commitDetail.files || [];
            changedFiles = files.map((f: any) => f.filename);

            // Generate diff summary for the first 3 files
            const patches = files.slice(0, 3).map((f: any) => {
              const patch = f.patch ? f.patch.slice(0, 400) : '';
              return patch ? `--- ${f.filename}\n${patch}` : '';
            }).filter(Boolean).join('\n\n');

            if (patches) {
              diffSummary = `\n\nCode Diff (first 3 files):\n${patches}`;
            }
          }
        } catch (e) {
          console.error(`[Webhook API] Failed to fetch commit details from GitHub API:`, e);
        }
      }

      // Fallback: Extract changed files from the webhook commits array directly
      if (changedFiles.length === 0) {
        const filesSet = new Set<string>();
        if (Array.isArray(body.commits)) {
          for (const c of body.commits) {
            if (Array.isArray(c.added)) c.added.forEach((f: string) => filesSet.add(f));
            if (Array.isArray(c.modified)) c.modified.forEach((f: string) => filesSet.add(f));
            if (Array.isArray(c.removed)) c.removed.forEach((f: string) => filesSet.add(f));
          }
        }
        changedFiles = Array.from(filesSet);
      }

      if (changedFiles.length === 0) {
        changedFiles = ['codebase'];
      }
    }

    let rawInputs: any = {};
    if (triggerSource === 'MANUAL_CAMPAIGN') {
      const conceptPrompt = body.concept_prompt || 'Custom Campaign Concept';
      rawInputs = {
        concept_prompt: conceptPrompt,
        commit_message: `Concept: ${conceptPrompt.slice(0, 80)}${conceptPrompt.length > 80 ? '...' : ''}`,
        changed_files: [],
        commit_author: 'Marketing Manager',
        commit_sha: 'concept',
      };
    } else {
      rawInputs = {
        commit_message: commitMessage || 'Manual Trigger Executed',
        changed_files: changedFiles,
        commit_sha: commitSha,
        commit_author: commitAuthor,
        commit_url: commitUrl,
        diff_summary: diffSummary,
      };
    }

    // Archive previous session to session_history if it exists
    if (state.current_session && state.current_session.session_id) {
      if (!state.session_history) {
        state.session_history = [];
      }
      const existingIds = new Set(state.session_history.map((s: any) => s.session_id));
      if (!existingIds.has(state.current_session.session_id)) {
        state.session_history.push(state.current_session);
        console.log(`[Webhook API] Archived session ${state.current_session.session_id} to history.`);
      }
    }

    // Initialize the session state
    const commitAuthorStr = rawInputs.commit_author ? ` by ${rawInputs.commit_author}` : '';
    const commitShaStr = rawInputs.commit_sha ? ` (${rawInputs.commit_sha})` : '';
    const welcomeMsg = triggerSource === 'MANUAL_CAMPAIGN'
      ? `New manual campaign concept triggered: "${rawInputs.concept_prompt}"! Marshall has entered the war room to scan strategic pivots.`
      : `GitHub commit detected${commitAuthorStr}${commitShaStr}! Devin, Priscilla, Marshall, and Gigi have entered the war room to analyze: "${(rawInputs.commit_message || '').slice(0, 80)}"`;

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
          linkedin: null,
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
          message: welcomeMsg,
          timestamp: new Date().toLocaleTimeString(),
        }
      ],
    };

    // Save updated state
    const docId = state._id || 'nexus_labs_brain';
    try {
      state._id = docId;
      await CompanyBrain.replaceOne({ _id: docId }, state, { upsert: true });
    } catch (err) {
      console.error('[Webhook API] Error saving state to MongoDB:', err);
    }
    if (docId === 'nexus_labs_brain') {
      await saveLocalFallback(dbPath, state);
    }

    // Send direct HTTP call to Band room API for commit trigger
    // Send direct HTTP call to Band room API for trigger
    let connieApiKey = process.env.CONNIE_API_KEY || process.env.DEVIN_API_KEY || '';
    let devinId = process.env.DEVIN_AGENT_ID || '782a7cd4-849e-447f-898c-459cb8f20248';
    let marshallId = process.env.MARSHALL_AGENT_ID || '5a9397ba-8c1d-4548-89e1-0839e4d70e49';

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
      if (agentConfig.marshall_research) {
        marshallId = agentConfig.marshall_research.agent_id || marshallId;
      }
    }

    const restUrl = process.env.BAND_REST_URL || process.env.THENVOI_REST_URL || 'https://app.band.ai/';

    let targetAgentId = devinId;
    let targetHandle = 'vicdevman/devin';
    let targetName = 'Devin';

    if (triggerSource === 'MANUAL_CAMPAIGN') {
      targetAgentId = marshallId;
      targetHandle = 'vicdevman/marshall';
      targetName = 'Marshall';
    }

    if (connieApiKey && state.room_id && targetAgentId) {
      const url = `${restUrl.replace(/\/$/, '')}/api/v1/agent/chats/${state.room_id}/messages`;
      
      let content = '';
      if (triggerSource === 'MANUAL_CAMPAIGN') {
        content = `[MANUAL_CAMPAIGN] New campaign concept triggered:\nConcept: ${rawInputs.concept_prompt}\n\n@vicdevman/marshall please research this concept.`;
      } else {
        const commitMsg = rawInputs.commit_message || 'Manual Trigger Executed';
        const filesList = rawInputs.changed_files || [];
        const authorStr = rawInputs.commit_author ? `\nAuthor: ${rawInputs.commit_author}` : '';
        const shaStr = rawInputs.commit_sha ? `\nSHA: ${rawInputs.commit_sha}` : '';
        const urlStr = rawInputs.commit_url ? `\nURL: ${rawInputs.commit_url}` : '';
        const diffStr = rawInputs.diff_summary ? `\n${rawInputs.diff_summary}` : '';
        content = `[GITHUB_COMMIT] New commit triggered:\nMessage: ${commitMsg}\nFiles: ${filesList.join(', ')}${authorStr}${shaStr}${urlStr}${diffStr}\n\n@vicdevman/devin please review.`;
      }

      const bodyPayload = {
        message: {
          content: content,
          mentions: [
            {
              id: targetAgentId,
              handle: targetHandle,
              name: targetName
            }
          ]
        }
      };

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': connieApiKey
          },
          body: JSON.stringify(bodyPayload)
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`[Band API] Failed to post trigger to Band room: ${res.status} ${text}`);
        } else {
          console.log(`[Band API] Successfully posted trigger to Band room.`);
        }
      } catch (err) {
        console.error(`[Band API] Fetch error posting trigger to Band room:`, err);
      }
    } else {
      console.warn(`[Band API] Cannot send trigger directly: missing keys or room_id. Spawning trigger_commit.py fallback.`);
      const { exec } = require('child_process');
      const agentsDir = path.join(path.dirname(dbPath), '..');
      exec('uv run python trigger_commit.py', { 
        cwd: agentsDir,
        env: { ...process.env, PYTHONPATH: '.', PYTHONUTF8: '1' }
      }, (err: any, stdout: string, stderr: string) => {
        if (err) {
          console.error(`Failed to run trigger_commit.py: ${err.message}`);
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

