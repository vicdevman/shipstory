Technical & Internal PRD: ShipStory
1. System Architecture Diagram
[GitHub Commit] ────┐
[Sentry Alert]  ────┼─> (Ingress Webhook Router)
[Manual Trigger] ───┘             │
                                  ▼
┌────────────────────────────────────────────────────────────────┐
│                   BAND SHARED SESSION RUNTIME                 │
│            (Holds: Company Brain State & Daily Log)            │
├────────────────────────────────────────────────────────────────┤
│  [1. Devin (Engineering)] ──> Parses technical diffs           │
│  [2. Priscilla (Product)] ──> Scores impact & Audits Security  │
│  [3. Marshall (Research)] ──> Competitor gaps & Recommendations│
│  [4. Gigi (Marketer)]     ──> Writes copywriting drafts        │
│  [5. Vinci (Designer)]    ──> Synthesizes image prompts        │
│                                                                │
│  [6. Connie (The Dual-Facing Assistant)]                       │
│    ├── Connie-Internal   ──> Chats with dev on full state      │
│    └── Connie-Public     ──> External Q&A (Sanitized by        │
│                              Priscilla to prevent IP leaks)    │
└────────────────────────────────────────────────────────────────┘
            ▲                     │
            │ (Human Approval     ▼
            │  Updates Roadmap) [Interactive Next.js UI]
            └───────────────────├── Live Agent Debate Log
                                └── "Approve & Ship" Portal ──> (X, LinkedIn, Slack)


2. Shared Memory State Schema (The "Company Brain")
This JSON object is stored in our database and loaded into the Band Session State during every execution cycle. We have added the system_recommendations and feedback_loops objects to support self-improvement.
{
  "company_metadata": {
    "name": "Nexus Labs",
    "value_proposition": "Local-first, AI-powered knowledge management tool with peer-to-peer sync.",
    "target_persona": "Developers, technical founders, power note-takers",
    "style_guide": {
      "tone": "Minimalist, professional, developer-focused",
      "restrictions": ["Max 2 emojis per post", "Avoid marketing jargon like 'revolutionizing'"]
    },
    "security_filters": {
      "restricted_keywords": ["auth_key", "password", "vulnerability", "leak_test", "private_beta_v1"],
      "allow_public_roadmap": false
    }
  },
  "operational_assets": {
    "pitch_deck_summary": "Nexus Labs is solving decentralized data latency. Our MVP uses PouchDB sharding to achieve sub-10ms query syncing.",
    "active_milestones": ["P2P Gateway Syncing", "Vector Search Node Integration"],
    "content_plan": {
      "topics": ["Data Security", "Local-first Speed", "Database Performance Tips"],
      "schedule_frequency_per_day": 2
    }
  },
  "current_session": {
    "session_id": "sess_2026_06_13_001",
    "trigger_source": "GITHUB_COMMIT",
    "status": "PROCESSING",
    "raw_inputs": {
      "commit_message": "perf(db): implement connection pooling and redis caching layer",
      "changed_files": ["db.go", "cache.go", "main.go"]
    },
    "agent_outputs": {
      "devin_technical_summary": null,
      "priscilla_importance_score": null,
      "marshall_competitor_context": null,
      "gigi_content_drafts": {
        "twitter": null,
        "changelog": null,
        "newsletter": null
      },
      "vinci_image_prompt": null,
      "approval_status": "PENDING"
    },
    "rejections_and_memos": []
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
}

3. The 6 Specialized Departments (Agent Definitions)
1. Devin (Engineering Agent)
Framework: CrewAI (Python)
Role: Lead Software Engineer.
Purpose: Monitors code changes, commits, PRs, and Sentry errors. It compiles an accurate, un-hyped explanation of what changed at the functional level.
2. Priscilla (Product Strategist & Compliance Gatekeeper)
Framework: LangGraph (Python)
Role: Head of Product & Compliance.
Purpose: Reviews Devin's summary against PRDs and style guides. Calculates Importance Scores. Crucially, Priscilla acts as the Security Compliance Gatekeeper, auditing all drafts written by Gigi and all outbound customer responses drafted by Connie-Public to ensure they contain absolutely zero internal IP, proprietary secrets, or vulnerable code specifics.
3. Marshall (Market Researcher)
Framework: Custom/Pydantic-AI Adapter (Python)
Role: VP of Growth & Intelligence.
Purpose: Monitors competitors and trends. Generates strategic recommendations based on competitor pricing shifts or service outages and logs them directly to the evolutionary_feedback_loop inside Band.
4. Gigi (Growth Marketer)
Framework: CrewAI (Python)
Role: Creative Copywriter.
Purpose: Translates technical summaries and competitor context into high-performing, clean marketing copy for multiple media channels.
5. Vinci (Graphic Designer)
Framework: CrewAI (Integrated with DALL-E 3)
Role: Art Director.
Purpose: Extracts metaphors from Gigi's approved copy and generates clean, professional schematic graphic prompts or SVGs that align with the brand’s minimalist styling.
6. Connie (Chief of Staff & Assistant)
Framework: LangGraph (Python)
Role: Dual-Facing Operations Assistant.
Purpose:
Connie-Internal: Lives in your secure dashboard. She has full access to the Company Brain and acts as your conversational Chief of Staff. You can chat with her to query system progress, ask for product recommendations, or request newsletter compilations.
Connie-Public: Lives on public channels (X, Slack, Reddit). She handles customer Q&As and answers product queries. Strict Isolation: To prevent data leaks, Connie-Public can only access a heavily sanitized, public-facing database slice. Every outward response she drafts must be evaluated and approved by Priscilla before dispatch.
4. Multi-Agent Disagreement Scenarios (Band in Action)
These specific scenarios are built into the state machine. If an agent writes a validation failure to the Band state, the state transitions backward, forcing the offending agent to rewrite.
Scenario A: Product Quality Gate (Priscilla vs. Gigi)
Devin notes a performance refactor.
Gigi writes a tweet: "Our app is now $100\%$ bug-free! No more crashes forever! 🚀🚀🚀"
Priscilla reads the draft from the Band state and writes a rejection:
Status: REJECTED
Target: Gigi
Reasoning: '100% bug-free' is false advertising. The code only optimized PouchDB connection caching. Also, 3 emojis violate our style guide (max 2). Re-draft immediately.
Gigi receives this block, updates its prompt weight, and rewrites: "We just optimized our local synchronization nodes. Database query speed is now up to $40\%$ faster."
Scenario B: Data Leak Security Gate (Priscilla vs. Connie-Public)
Connie-Public is asked on Twitter: "Why are you guys working on local-first sharding? Is the current database structure insecure?"
Connie-Public drafts an answer pulling from internal notes: "We are building this because our raw connection pool in db.go currently hits high latency bottlenecks which could fail under heavy load, so we're fixing it."
Priscilla reviews Connie-Public’s draft and writes an intervention:
Status: BLOCKED
Target: Connie_Public
Reasoning: Revealing underlying backend file names (db.go) and explicit engineering bottlenecks exposes system architecture vulnerabilities. Redact architectural specifics and explain only the customer-facing performance gains.
Connie-Public processes Priscilla's security block and rewrites: "We are building this to keep your local load times under $10\text{ ms}$ as our active user base continues to scale."
Scenario C: Design Tone Gate (Priscilla vs. Vinci)
Vinci generates a graphic prompt: "A cartoon astronaut riding a rocket ship holding a database engine."
Priscilla reviews the prompt against the company metadata style guide (Minimalist, professional, developer-focused).
Priscilla writes an event to Band:
Status: REJECTED
Target: Vinci
Reasoning: Astronaut graphics are cheesy and do not align with our professional, minimalist brand. Change to a clean, schematic design showing two data nodes syncing directly.
Vinci refines the prompt structure and reconstructs a clean architectural layout.
5. Monorepo Folder Structure
shipstory-monorepo/
├── apps/
│   └── web/                      # Next.js Frontend (Deployed on Vercel)
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx      # Main Dashboard View
│       │   │   ├── layout.tsx
│       │   │   └── api/          # Webhook receivers (Github / Sentry / Manual)
│       │   │       ├── github/route.ts
│       │   │       └── sync/route.ts
│       │   ├── components/       # UI Elements
│       │   │   ├── BrainViewer.tsx # Visualizes current Company Brain JSON state
│       │   │   ├── LiveFeed.tsx  # Dynamic list tracking Band events live
│       │   │   └── ApprovalCard.tsx # Approve & ship drafted marketing posts
│       │   └── hooks/
│       │       └── useBandSocket.ts # Directly streams Band room WebSockets to UI
│       ├── package.json
│       ├── tailwind.config.js
│       └── tsconfig.json
├── agents/                       # Python Backend (Deployed on VPS)
│   ├── shared/                   # Common python models and state parsers
│   │   ├── __init__.py
│   │   └── state_manager.py      # Methods to update & read the Shared State JSON
│   ├── devin_eng/                # Devin (CrewAI framework)
│   │   ├── agent.py
│   │   └── pyproject.toml
│   ├── priscilla_product/        # Priscilla (LangGraph framework)
│   │   ├── agent.py
│   │   └── pyproject.toml
│   ├── marshall_research/        # Marshall (Custom / Pydantic-AI)
│   │   ├── agent.py
│   │   └── pyproject.toml
│   ├── gigi_marketing/           # Gigi (CrewAI framework)
│   │   ├── agent.py
│   │   └── pyproject.toml
│   ├── vinci_design/             # Vinci (CrewAI framework)
│   │   ├── agent.py
│   │   └── pyproject.toml
│   ├── connie_assistant/         # Connie (LangGraph framework)
│   │   ├── agent.py
│   │   └── pyproject.toml
│   ├── .env                      # Unified local keys (gitignore!)
│   ├── agent_config.yaml         # Band registration mapping for all 6 agents
│   └── pyproject.toml            # Workspace-level pyproject configuration (uv)
├── pnpm-workspace.yaml           # Frontend Workspace definitions
├── package.json                  # Monorepo root configuration
└── .gitignore

6. Local Setup and Initialization
To establish this monorepo cleanly, run the following command sequence in your terminal. We are utilizing pnpm for Node workspaces and uv (the ultra-fast Rust-based Python package manager) for our Python environments.
Step 1: Initialize Monorepo Core
# Create directory structure
mkdir -p shipstory-monorepo/apps/web shipstory-monorepo/agents/shared
cd shipstory-monorepo

# Create workspace configuration file
cat <<EOF > pnpm-workspace.yaml
packages:
  - "apps/*"
EOF

# Create standard package.json in root
cat <<EOF > package.json
{
  "name": "shipstory-monorepo",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter web dev"
  }
}
EOF

Step 2: Set Up Python Workspace (under agents/ folder)
cd agents

# Initialize high-speed python workspace with uv
uv init --workspace

# Configure parent pyproject.toml to discover all sub-agents
cat <<EOF > pyproject.toml
[tool.uv]
workspace = { members = ["devin_eng", "priscilla_product", "marshall_research", "gigi_marketing", "vinci_design", "connie_assistant"] }
EOF

# Build sub-agents directories & add dependencies
for agent in devin_eng priscilla_product marshall_research gigi_marketing vinci_design connie_assistant; do
  mkdir -p $agent
  cd $agent
  uv init --lib
  # Add core Band Python SDK with specific adapter configuration
  if [[ "$agent" == "priscilla_product" || "$agent" == "connie_assistant" ]]; then
    uv add "band-sdk[langgraph]"
  elif [[ "$agent" == "marshall_research" ]]; then
    uv add "band-sdk[pydantic-ai]"
  else
    uv add "band-sdk[crewai]"
  fi
  # Add other critical libraries
  uv add langchain-openai python-dotenv
  cd ..
done

Step 3: Configure Environment Variables & Credentials
Create a shared .env file in agents/.env:
# Platform connections
THENVOI_REST_URL=[https://app.band.ai/](https://app.band.ai/)
THENVOI_WS_URL=wss://app.band.ai/api/v1/socket/websocket

# LLM Providers (Featherless / AI/ML API prioritised for the Hackathon)
AIML_API_KEY=your_aiml_api_key
FEATHERLESS_API_KEY=your_featherless_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_or_compatible_key

Create agents/agent_config.yaml to map each agent's credentials on the Band Platform:
devin_agent:
  agent_id: "<devin-uuid>"
  api_key: "<devin-api-key>"
priscilla_agent:
  agent_id: "<priscilla-uuid>"
  api_key: "<priscilla-api-key>"
marshall_agent:
  agent_id: "<marshall-uuid>"
  api_key: "<marshall-api-key>"
gigi_agent:
  agent_id: "<gigi-uuid>"
  api_key: "<gigi-api-key>"
vinci_agent:
  agent_id: "<vinci-uuid>"
  api_key: "<vinci-api-key>"
connie_agent:
  agent_id: "<connie-uuid>"
  api_key: "<connie-api-key>"

7. VPS Deployment Guide for Python Agents
Since our Python agents run background tasks and long-lived WebSocket connections, deploying them via serverless functions (like Vercel) will trigger immediate execution timeout failures. Deploying onto your dedicated VPS is the standard production solution.
Step 1: Install Python 3.10+ and uv on your VPS
Log into your VPS via SSH and run:
# Update packages
sudo apt update && sudo apt upgrade -y

# Install standard Python build dependencies
sudo apt install -y python3 python3-pip python3-venv git

# Install the superfast uv package manager globally
curl -LsSf [https://astral.sh/uv/install.sh](https://astral.sh/uv/install.sh) | sh
source $HOME/.local/bin/env

Step 2: Clone & Install the Project on VPS
git clone <your-git-repo-url> /var/www/shipstory
cd /var/www/shipstory/agents

# Sync and lock all Python dependencies automatically inside the uv workspace virtualenv
uv sync

Step 3: Configure Process Management using systemd
To ensure the agents stay alive 24/7 and automatically restart if your VPS crashes or reboots, construct systemd services.
For each agent, build a small service manager file. Here is the configuration template for Devin:
sudo nano /etc/systemd/system/shipstory-devin.service

Paste the following configurations:
[Unit]
Description=ShipStory Devin Agent Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/shipstory/agents
ExecStart=/root/.local/bin/uv run --with-requirements pyproject.toml python devin_eng/agent.py
Restart=always
RestartSec=5
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=/var/www/shipstory/agents/.env

[Install]
WantedBy=multi-user.target

Step 4: Run & Enable Services on Boot
# Reload daemon profiles
sudo systemctl daemon-reload

# Start and enable the Devin agent to spin up automatically on system boot
sudo systemctl enable --now shipstory-devin

# Check live logs to verify connection status
sudo journalctl -u shipstory-devin -f -n 50

Repeat this process for all 6 python services.
8. Antigravity AI Bootstrapping Prompt
This prompt is specially designed to bring your AI coding assistant (antigravity) up to speed immediately. Copy and paste everything below this line into your AI workspace to start auto-generating files.
ROLE: Senior Principal Multi-Agent Software Engineer
PROJECT: ShipStory
We are building "ShipStory", an autonomous growth department running on the Band of Agents framework (using the Python band-sdk).
The architecture is a monorepo consisting of a Next.js (TypeScript) dashboard, and 6 specialized Python-based microservices representing corporate departments. These agents communicate and coordinate inside a shared Band Chat Room by mutating a centralized shared_memory_state JSON object and tagging each other asynchronously.
Core Implementation Directives:
The Shared Memory State Pattern:
Do not pass simple unstructured strings between agents. Every agent reads and writes mutations directly to the centralized Company Brain JSON schema specified in Section 2 of our Technical PRD.
Agents use standard @mentions via thenvoi_send_message to tag other departments when a task needs execution.
The LLM Configuration:
Configure all python adapters to utilize OpenAI-compatible endpoint configurations. Let's design the adapters to fallback dynamically:
# Use AI/ML API as base provider or OpenAI
llm = ChatOpenAI(
    model="gpt-4o",
    openai_api_base="[https://api.aimlapi.com/v1](https://api.aimlapi.com/v1)",
    openai_api_key=os.getenv("AIML_API_KEY")
)


Writing the Agent Implementations:
Priscilla (LangGraph): Write the graph-based checkpointer loop. It must subscribe to the Band room, monitor messages mentioning @priscilla_agent, look up the state, parse for copywriting text, evaluate against style guide restrictions, and execute tool calls: thenvoi_send_message (approving/rejecting Gigi) and thenvoi_send_event (updating status).
Devin (CrewAI): Create a standard CrewAI agent using the CrewAIAdapter. Define its role, goal, and backstory dynamically. It listens to raw GitHub payload webhooks (forwarded via the Next.js API route to Band), summarizes changes, and alerts @priscilla_agent for evaluation.
Connie (LangGraph / Chief of Staff): Needs to handle conversational Q&As. If Connie-Internal is queried by the user, she parses the entire state. If Connie-Public is tagged externally, she sanitizes inputs via tools, sends the draft answer to @priscilla_agent for compliance check first, and dispatches only upon approval.
First Coding Task:
Generate the common shared state manager code under agents/shared/state_manager.py that handles the JSON schemas, and write the initial connection scripts (agent.py) for both Devin (CrewAIAdapter) and Priscilla (LangGraphAdapter) demonstrating how they communicate. Make sure to use the official band-sdk syntax.

