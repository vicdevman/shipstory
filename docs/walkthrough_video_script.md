# Walkthrough Video Script: ShipStory Growth OS

This script outlines a structured, high-impact walkthrough for demonstrating ShipStory to judges, users, or stakeholders. It covers onboarding, the automated Git commit pipeline, the dynamic campaign pipeline, and multi-tenant persistence.

---

## Part 1: Introduction (0:00 - 0:30)

**Visuals**: Show the **Workflow Visualizer** canvas on the screen. Zoom in on the active nodes showing Connie, Devin, Marshall, Priscilla, Gigi, Vinci, and the Ship Deck.
**Speaker Audio**:
> "Hi everyone! Welcome to ShipStory—the multi-agent Growth Operating System that turns codebase commits and marketing ideas into high-converting announcements.
>
> Unlike basic demo applications, ShipStory is a fully integrated, multi-tenant workspace where specialized AI agents—a Chief of Staff, a Lead Engineer, a Product Manager, a Strategic Researcher, and a Copywriter—collaborate in real-time, enforcing style guidelines and preventing security leaks before anything is shipped."

---

## Part 2: Onboarding & Multi-Tenant Setup (0:30 - 1:15)

**Visuals**: 
1. Navigate to the **Startup Workspace** tab.
2. Select a startup or click `+ Create Startup` to create one. Show that after refreshing the browser, the chosen startup remains selected (Persistence).
3. Under **Brand Profile & Onboarding**, paste a landing page URL or a GitHub repository link in the **AI Website Onboarding Extractor**.
4. Click **AI Extract Profile** and watch the fields (Value Proposition, Persona, Tone, restricted keywords, and detailed markdown Brand voice constraints) populate.
**Speaker Audio**:
> "Let's start with onboarding. In the **Startup Workspace**, we can manage multiple startups with full local persistence. We'll extract a startup's brand voice instantly by pasting its landing page URL.
>
> Our extractor scrapes the page and populates the brand guidelines—complete with dynamic niche Dos and Don'ts. No generic placeholders here: the guidelines are customized to the target audience immediately."

---

## Part 3: Automated Git Commit Webhook Pipeline (1:15 - 2:30)

**Visuals**:
1. Click **Trigger Pipeline** in the top bar. Select a commit from the connected repository or enter a custom one (e.g. `feat(sync): implement connection pooling and sub-10ms P2P replication`). Click trigger.
2. Go to the **Workflow Visualizer** canvas. Watch the pulsing blue animation edges flow.
3. Show Devin compiling the changes. Marshall scanning Tavily for market trends related to that feature. Priscilla grading the impact. Gigi writing story-driven posts.
4. Click on the **Marshall Research** node. Show the terminal logs showing real-time Tavily competitor searches, Jina scrapes of competitor websites, and the newly added **Sources & References** box at the bottom of the inspector card with clickable links.
**Speaker Audio**:
> "Now let's watch the webhook pipeline. When an engineer pushes code to `main`, Devin summarizes the technical changes, while Marshall—our strategic researcher—scans search engines and scrapes competitors to discover market trends matching that feature.
>
> If we click on the **Marshall** node, we can inspect all of his Tavily queries, Jina scrape logs, and the actual clickable sources and references he researched.
> 
> Next, PriscillaPM analyzes Devin's summary against Marshall's research to calculate an analytical, trend-aware Product Impact Score out of 10."

---

## Part 4: AIDA Storytelling Copy, Compliance & Vinci Mockups (2:30 - 3:45)

**Visuals**:
1. Navigate to **Campaign Deliverables**. Show the staged drafts for Twitter, LinkedIn, Changelog, and Newsletter.
2. Point out that the LinkedIn post uses story hooks, contrast, and open-loops instead of template clichés.
3. Show a simulated compliance rejection: Gigi accidentally mentioned `db.go` or had too many emojis. PriscillaCompliance rejected the draft. Show the rejection memo, and then show Gigi outputting the revised, approved version.
4. Scroll down to show the Vinci Graphic Asset prompt and the rendered mockups.
**Speaker Audio**:
> "Once approved, Gigi—our copywriting agent—drafts announcements for Twitter, LinkedIn, Changelogs, and Newsletters. Gigi uses the AIDA copywriting framework to craft hooky, narrative-driven posts that attract developer interest, rather than robotic templates.
>
> Notice the **Priscilla Compliance** node: she audits drafts before they stage. If Gigi accidentally leaks internal files (like `auth.go` or `db.ts`) or goes over style restrictions, Priscilla rejects the copy and sends it back to Gigi with a clear critique.
> 
> Once approved, Vinci—our Art Director—translates the copy into high-fidelity image prompts, rendering mockups ready for distribution."

---

## Part 5: The Campaign Idea Pipeline & Summary (3:45 - 4:30)

**Visuals**:
1. Open the Trigger modal, click the **Campaign Idea** tab.
2. Enter a custom topic or a strategic question (e.g., *"What are our target audience attracted to right now?"*).
3. Click **Launch Dynamic Campaign Pipeline**. Show the edge animations starting from Marshall and flowing directly to Priscilla, Gigi, and Vinci.
**Speaker Audio**:
> "But what if you want to run a campaign without a code commit? We can open our trigger panel and click the **Campaign Idea** tab. Here, we can ask random strategic questions or write marketing ideas.
>
> Triggering the pipeline launches the non-commit flow. Marshall immediately constructs a dynamic Tavily query from the question, scrapes references, and routes the pivot strategy to Priscilla, Gigi, and Vinci for copywriting and visual asset design.
>
> ShipStory orchestrates human-agent alignment to supercharge developer outreach. Thanks for watching, and let us know what you think!"
