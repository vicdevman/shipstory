Pitch Deck & Video Demo Script
1. Slide-by-Slide Deck Layout
Slide 1: Title
Visual: Dark UI background with the logo of ShipStory, and agents communicating on a timeline.
Text: ShipStory: Your Autonomous Growth Department on Band.
Speaker Note: "Every startup team faces the same bottleneck: Engineers build fast, but marketing, content, and community gets completely ignored. Let me introduce ShipStory."
Slide 2: The Problem
Visual: A diagram showing the "Disconnect" between the Engineering repo, the marketing team, and the user base.
Text: The Engineering-Marketing disconnect costs startups up to $\$15,000/\text{month}$ in human overhead, or results in total silence. Traditional AI tools generate generic spam because they lack context.
Speaker Note: "Traditional marketing is manual and expensive. Linear AI pipelines just spam your users because they don't understand your actual code, your product roadmaps, or what your competitors are doing."
Slide 3: The Solution
Visual: The 6-Agent virtual department collaborating inside a centralized Band room.
Text: ShipStory: An autonomous virtual startup. It reads code changes, analyzes roadmaps, tracks competitor gaps, writes content, designs graphics, and acts as your secure, interactive Chief of Staff—all in a shared, secure Band environment.
Speaker Note: "By using Band, we've deployed 6 specialized agents that represent a full corporate startup structure. They debate, correct, and align with each other to turn complex code changes into strategic growth assets."
Slide 4: Secure Multi-Agent Coordination (Band’s Core Value)
Visual: Screen capture of Band state mutations showing Priscilla (Compliance) catching and blocking a data leak from Connie (Assistant) live.
Text: Cross-framework secure context sharing. Standard AI is prone to prompt injection. ShipStory implements data isolation, routing Connie-Public replies through Priscilla's compliance layer to safeguard system IP.
Speaker Note: "Without Band, connecting different AI frameworks securely is a nightmare. Band acts as our universal intranet where agents can safely cross-examine each other's work while protecting internal secrets from customer-facing environments."
Slide 5: The Adaptive Feedback Loop (The Evolution)
Visual: Diagram showing Connie (Assistant) and Marshall (Research) injecting insights back into the "Company Brain", updating roadmap metrics.
Text: A self-improving operational cycle. Competitor moves and user comments trigger autonomous product feature recommendations, closing the loop between marketing, engineering, and active development.
Speaker Note: "We don't just output static posts. ShipStory listens. If your users voice concerns or competitors make sudden moves, our agents synthesize actionable roadmap recommendations and adapt your content plan instantly, keeping your startup perfectly aligned."
Slide 6: Business Potential
Visual: Growth projection to $\$30\text{M ARR}$ by capturing $0.34\%$ of the global active SaaS market.
Text: Freemium scaling, zero marginal cost of operations, high retention due to deeply integrated developer workflows.
Speaker Note: "With a massive TAM and high-ticket B2B subscriptions, we are built to scale. For startups, ShipStory is a complete marketing department for the price of a single SaaS subscription."
2. Flawless 3-Minute Video Demo Script
[0:00 - 0:30] The Hook:
Visual: Presenter on camera.
Script: "Most software products die in silence. Not because the code is bad, but because founders don't have the time to market their wins, design content, and moderate communities. We built ShipStory—the first autonomous, cross-department growth engine powered by Band. Let's see how it operates in real-time."
[0:30 - 1:15] The Live Trigger & The Assistant:
Visual: Show split-screen: VS Code on the left, the ShipStory Next.js Dashboard on the right featuring "Connie, your Chief of Staff" chat panel.
Script: "Here is our real GitHub repository. Let's make a highly technical code push while checking in with Connie, our secure assistant, to see our active milestones."
Action: Ask Connie in chat: "Connie, what's our focus today?" Connie replies securely showing the P2P Gateway Sync milestone.
Action: Type git push origin main with commit message: perf(db): implement connection pooling and redis caching layer.
Script: "The moment the commit lands, our webhook fires. Watch our dashboard."
[1:15 - 2:15] The Band Execution & Agent Debate:
Visual: The "Live Collaboration Log" lights up on the dashboard.
Script: "Look at the Band session state. Devin, our Engineering Agent, parses the raw code diff. Priscilla, our Product Strategist, matches this against our P2P Sync milestone. She scores this an $8/10$ milestone. But watch the debate! Gigi, our Marketer, writes a draft claiming the app is now '100% bug-free.' Priscilla steps in, rejects the draft for violating our accuracy compliance, and forces Gigi to rewrite it. Marshall, our Market Researcher, injects competitor gaps, while Vinci generates a sleek, minimalist schematic prompt matching the verified content. Finally, watch Connie-Public prepare a reply to a user tweet asking about connection bottlenecks. Priscilla instantly intercepts it, redacting raw database code references to prevent any data leaks."
[2:15 - 3:00] The Self-Improving Feedback Loop & One-Click Approval:
Visual: Switch to the "Strategic Recommendations" panel on the dashboard.
Script: "But here's the magic: ShipStory doesn't just push. It listens. Connie has analyzed user comments about syncing issues, and Marshall has flagged that Competitor Y just dropped their offline mode. Right here, the system presents an actionable Recommendation: Pivot roadmap to prioritize Offline-First indicators. I click 'Approve Recommendation' and our Company Brain's active roadmap updates instantly. Alongside it, our pristine 'Ready to Ship' cards showing our X Thread, Changelog, and Generated Graphic are set. I click 'Approve and Ship' to push our brand new marketing assets to the world. A complete, brand-compliant, competitor-aware campaign and updated product strategy, built from raw code in seconds."

---

## 3. Devpost / Hackathon Submission Fields & Additional Information

### 1. Slogan / Hook (One-Liner)
Code is your story. Let ShipStory tell it.

### 2. Short Description (Max 255 Characters)
ShipStory is an autonomous startup engine on Band. Its 6 agents parse git pushes, track competitor gaps, write copy, design graphics, and act as an interactive AI Assistant to manage your operations and community securely.

### 3. Inspiration
Lean startup teams, solo founders, and indie hackers build amazing tech but fail to gain traction because marketing, content creation, community engagement, and strategic roadmapping are massive manual bottlenecks. ShipStory was inspired by the vision of creating an autonomous virtual department that behaves like a real corporate team, continuously transforming raw engineering work into public traction and strategic alignment.

### 4. What it does
ShipStory is an autonomous 6-agent virtual growth department running inside a secure Band room.
* **Devin (Lead Engineer)** parses technical code commits.
* **Priscilla (Product & Compliance)** scores feature business value and audits copy drafts for IP leaks and brand alignment.
* **Marshall (Research)** crawls competitor updates and user feedback.
* **Gigi (Creative Copywriter)** generates multi-channel marketing campaigns (Twitter, Changelog, Newsletter).
* **Vinci (Designer)** generates graphic asset prompts matching Gigi's copy.
* **Connie (Chief of Staff & Assistant)** acts as a secure, interactive operational dashboard assistant for the user and handles public customer queries.

### 5. How we built it
* **Frontend**: Next.js 15 (App Router, TypeScript) styled with Vanilla CSS and Tailwind, using `@xyflow/react` (React Flow) for a live-updating interactive departmental visualizer map.
* **Backend**: Python microservices orchestrated via the **Band SDK** (WebSockets and REST client) for real-time room communication and state synchronization.
* **AI & Orchestration**: CrewAI Python SDK with `litellm` abstracting OpenAI, AI/ML API (GPT-4o), and Featherless (Llama 3.1 70B).
* **State Management**: A local database (`company_brain_db.json`) coordinating active roadmaps, milestones, epic progress, and current session parameters.

### 6. Challenges we ran into
* **Infinite Loops & Credit Burn**: Agents got stuck in infinite conversation cycles on WebSockets during feedback debates. We solved this by implementing an in-memory message deduplication set and a state-based pipeline completion guard in the deterministic adapter.
* **Lack of Context & Tool Hallucination**: CrewAI agents without tool access tried to query missing endpoints or output placeholder text. We resolved this by dynamically injecting the active Company Brain database state directly into the agent's prompt backstory inside the WebSocket message adapter, providing complete, real-time context.
* **Compliance Safeguards**: Ensuring Connie's public-facing replies did not leak sensitive internal IP. We built Priscilla's compliance filter to intercept and audit drafts, redacting raw database code references before publication.

### 7. Accomplishments that we're proud of
* Building a real, multi-agent adversarial loop where agents critique, reject, and force revisions on marketing drafts (e.g. style guide constraints on Twitter emojis) until they are 100% compliant.
* Successfully running distinct model providers (GPT-4o on AIML and Llama 3.1 70B on Featherless) in the same collaborative workspace using the Band framework.
* Implementing a complete, self-improving product loop: competitor moves and user feedback feed Marshall's research, generating actionable recommendations that mutate the active roadmap in a single click.

### 8. What we learned
* State management and context serialization are critical when scaling multi-agent systems.
* In-context state injection is often more robust, faster, and cheaper than granting agents arbitrary tool execution privileges.
* Band's secure routing framework is invaluable for maintaining data isolation between customer-facing interfaces and internal development backends.

### 9. What's next for ShipStory
* **Autonomous Engineering Sync**: Connect Devin to code repositories to generate issues and draft pull requests solving human-approved strategic recommendations automatically.
* **Live Social Outbound**: Hook up X, Discord, and Slack API integrations to post and reply autonomously.
* **Automated Investor Sync**: Auto-update traction details and milestones directly in pitch deck files.
