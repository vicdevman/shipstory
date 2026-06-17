# 🚀 ShipStory: Autonomous Adversarial Multi-Agent Product Loop

ShipStory is a continuous adversarial alignment cycle designed for startups. Instead of running rigid, linear scripts, ShipStory orchestrates a network of autonomous agents that collaborate, review, debate, and design campaign deliverables the moment code is pushed.

---

## 🏗️ Architecture & Interaction Diagram

```mermaid
graph TD
    %% Trigger Ingress
    Ingress[GitHub Commit Trigger] -->|Mentions Devin & Marshall| BandRoom{Band Room Platform}

    %% Column 1: Engineering & Research Gaps
    subgraph Column 1: Code Ingress
        Devin[Devin: Lead Engineer]
        Marshall[Marshall: Strategic Researcher]
    end
    BandRoom -.->|Route Event| Devin
    BandRoom -.->|Route Event| Marshall
    
    Tavily[(Tavily API)] -->|Advanced Search Gaps| Marshall

    %% Column 2: Product Valuation & Pricing Pivot
    subgraph Column 2: Audit & Strategy
        Priscilla[Priscilla: Product Manager]
    end
    Devin -->|Summary| Priscilla
    Marshall -->|Roadmap Pivot| Priscilla

    %% Column 3: Multi-channel Copywriting & Safety Checks
    subgraph Column 3: Creative & Copywriting
        Gigi[Gigi: Creative Marketer]
        Compliance[Priscilla: Compliance Officer]
    end
    Priscilla -->|Approve score| Gigi
    Gigi -->|Twitter, Changelog, Newsletter| Compliance

    %% Column 4: High-Fidelity Design
    subgraph Column 4: Asset Design
        Vinci[Vinci: Art Director]
    end
    Compliance -->|Staged drafts approved| Vinci
    
    %% Image API & Storage
    AIML[AIML API: Flux 2 Pro] -->|Image URL| Cloudinary[(Cloudinary Storage)]
    Vinci -->|Prompt / Render Image| AIML
    Cloudinary -->|Hosted Visuals| ShipDeck[Ship Deck Deliverables]

    %% Real-time Sync
    MongoDB[(MongoDB Atlas)] <-->|Central Brain Sync| NextJSApp[Next.js Visualizer Dashboard]
```

---

## 🤖 The Multi-Agent Network (Band Platform Agents)

Each agent in ShipStory runs as an isolated daemon. They communicate through **Band.ai** (a WebSockets-based agent platform room). When one agent completes its task, it sends a targeted platform mention in the room to trigger the next step.

| Agent | Module / Entrypoint | Platform Handle | Core Goal & Action |
| :--- | :--- | :--- | :--- |
| **Connie** | [connie_assistant](file:///c:/Users/User/OneDrive/Desktop/projects/shipstory/agents/connie_assistant/agent.py) | `@vicdevman/connie` | **Chief of Staff**: Answers operator queries using milestones in MongoDB. |
| **Devin** | [devin_eng](file:///c:/Users/User/OneDrive/Desktop/projects/shipstory/agents/devin_eng/agent.py) | `@vicdevman/devin` | **Lead Engineer**: Translates commit diffs and codebases into value statements. |
| **Marshall** | [marshall_research](file:///c:/Users/User/OneDrive/Desktop/projects/shipstory/agents/marshall_research/agent.py) | `@vicdevman/marshall` | **Researcher**: Queries competitor gaps via Tavily and logs strategic pivots. |
| **Priscilla** | [priscilla_product](file:///c:/Users/User/OneDrive/Desktop/projects/shipstory/agents/priscilla_product/agent.py) | `@vicdevman/priscilla` | **Product Manager**: Grades engineering scores and audits campaign copy drafts. |
| **Gigi** | [gigi_marketing](file:///c:/Users/User/OneDrive/Desktop/projects/shipstory/agents/gigi_marketing/agent.py) | `@vicdevman/gigi` | **Copywriter**: Writes multi-channel staged copy drafts (max 2 emojis safety limit). |
| **Vinci** | [vinci_design](file:///c:/Users/User/OneDrive/Desktop/projects/shipstory/agents/vinci_design/agent.py) | `@vicdevman/vinci` | **Art Director**: Generates visual design prompts and renders graphic assets. |

---

## 🎨 Tech Stack & Integrations

1. **Agent Orchestration**: **Band.ai Platform SDK & CrewAI**
2. **Web Frontend**: **Next.js 15, React Flow (@xyflow/react), Tailwind CSS, Lucide icons**
3. **Database & Cache**: **MongoDB Atlas & Mongoose** (centralized brain document mapping `_id: "nexus_labs_brain"`)
4. **Competitor Scans**: **Tavily AI Search API** (utilizing `"search_depth": "advanced"` and `"include_answer": True`)
5. **Asset Persistance**: **Cloudinary** & **AIML API (Flux 2 Pro image generation model)**

---

## 🛠️ Verification & Setup Guide

### Prerequisites
Make sure you have `pnpm` (Node) and `uv` (Python) installed on your system.

### 1. Environment Configuration
Verify that the `agents/.env` file is populated with valid credentials:
```ini
AIML_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 2. Install Dependencies
Install Node packages for the frontend and Python libraries for the agents:
```bash
# Install frontend web dependencies
pnpm install

# Build the web assets to verify type completeness
pnpm run build:web
```

### 3. Run the Entire System

To start the ShipStory war room, you need to spin up the web dashboard and launch the platform agents.

**Step A: Launch the Next.js Visualizer Dashboard**
```bash
pnpm run dev:web
# Launches on http://localhost:3000
```

**Step B: Launch All 6 Platform Agents Concurrently**
We have written a unified runner script to start all agent processes under a single terminal:
```bash
cd agents
uv run python run_agents.py
```

---

## 🧠 Key Workflow States

1. **GitHub Ingress (Start)**: A simulated git push sends `[github_commit]` to the room.
2. **Parallel Debate**: Devin summarizes code changes while Marshall runs a Tavily competitor search to log strategic recommendations.
3. **Drafting**: Gigi drafts marketing posts. Priscilla audits for emoji limits (rejecting >2 emojis).
4. **Design rendering**: Vinci turns approved copy into a design blueprint, generates an image using Flux 2 Pro, and uploads it to Cloudinary.
5. **Human Ship Control**: Staged posts and generated visual assets render on the frontend for approval and deployment.
