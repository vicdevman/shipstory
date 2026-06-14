6-Day Hackathon Battle Plan & Roadmap
This is your day-by-day roadmap to build, refine, and ship ShipStory to win first place.
Day 1: Identity, Core Schema & Mocking
Goal: Set up your repository, register your team, and build the "Company Brain" state.
Morning (09:00 - 13:00):
Create your hackathon project submission on the platform.
Set up a clean Next.js (Frontend) and Python (Backend) monorepo.
Afternoon (14:00 - 18:00):
Define the exact JSON State schema (matching the Technical PRD, including evolutionary_feedback_loop and the security/data isolation parameters).
Create a local mock database/JSON file to store this state.
Night (19:00 - 22:00):
Write a mock ingress script that can simulate a GitHub commit payload, a Sentry performance alert, or a manual "Daily Scheduled" button click.
Day 2: Core Prompt Engineering (The Brains)
Goal: Build and test the prompts for the primary agents.
Morning (09:00 - 13:00):
Write the system instructions for Devin (Engineering) and Priscilla (Product Strategist).
Ensure Priscilla can successfully output an Importance Score, validate raw technical text, and audit recommendations.
Afternoon (14:00 - 18:00):
Write system prompts for Gigi (Growth Marketer) and Marshall (Market Researcher).
Build a simple mock Web Search tool for Marshall using an API like Tavily or Serper to fetch competitor insights and feed the recommendation engine.
Night (19:00 - 22:00):
Run test scripts passing mock commits to verify that Devin, Priscilla, Marshall, and Gigi can sequentially construct their parts of the shared JSON state.
Day 3: Band Integration & Rejection Loops
Goal: Implement the Band environment to handle the asynchronous debate loops.
Morning (09:00 - 13:00):
Read the Band framework documentation and set up your Band workspace.
Connect your Python backend to the Band session runtime.
Afternoon (14:00 - 18:00):
Implement the state transition engine. If Priscilla writes a REJECTED flag, route the payload back to Gigi’s prompt with the critique appended.
Night (19:00 - 22:00):
Verify and debug the debate loop. Ensure that the agents can iterate up to 3 times to fix draft errors without getting stuck in infinite loops.
Day 4: Visuals, Secure Assistant & Feedback Loops
Goal: Integrate Vinci (Graphics) and Connie (Assistant), and hook up the Manual Run trigger.
Morning (09:00 - 13:00):
Build Vinci's agent. Connect it to OpenAI’s DALL-E 3 API to generate images based on Gigi's approved copy.
Implement the Manual Content Run Button on your backend. When clicked, it bypasses GitHub, reads the current active milestone from the Company Brain, and triggers the full pipeline to generate an educational post.
Afternoon (14:00 - 18:00):
Build the dual-facing Connie agent. Implement the secure routing layer where Connie-Public outbound drafts are sent to Priscilla's LangGraph model for keyword redaction to prevent data leaks.
Integrate the Recommendation Core: Set up the pathway where Connie's customer queries and Marshall's search alerts generate a structural feedback card inside the JSON state under evolutionary_feedback_loop.
Night (19:00 - 22:00):
Run end-to-end integration tests. Verify that all 6 agents can collaborate inside the Band state from a single input trigger and generate both content drafts and product recommendations securely.
Day 5: Frontend Construction & Visual Log
Goal: Build a beautiful, high-fidelity UI to showcase the system to judges.
Morning (09:00 - 13:00):
Build the Main Dashboard showing the Company Brain (Roadmap, Active Milestones, Pitch Deck state, and active Strategic Recommendations) alongside Connie's interactive internal operations chat interface.
Afternoon (14:00 - 18:00):
Build the Live Collaboration Log Component. This is a vertical timeline that animates live as agents update, reject, and approve different parts of the Band session. Use clean colors: Green for approvals, Red for rejections, Yellow for market research alerts, and Purple for recommendation injections.
Night (19:00 - 22:00):
Build the final "Approve & Ship" screen showing the finished tweets, newsletter drafts, generated graphic assets, and the "Approve Recommendation" button that mutates the active roadmap live.
Day 6: Demo Recording, Polish & Submission
Goal: Record a flawless presentation and submit the project.
Morning (09:00 - 13:00):
Perform a dry-run of the demo with a real test GitHub repository. Ensure everything executes in under 60 seconds.
Clean up all console logs and handle UI edge cases.
Afternoon (14:00 - 18:00):
Record your screen and presentation using the Video Demo Script. Make sure to capture the live GitHub push and the corresponding UI updates, including the roadmap mutation.
Night (19:00 - 22:00):
Edit the video down to exactly 3 minutes.
Deploy your web application, write a crisp, readable README, and submit your final entry on the hackathon portal.
V2 / Post-Hackathon Expansion (Beyond the MVP)
Autonomous Engineering Sync: Hook Devin (Engineering) to a private coding agent framework. When a Strategic Recommendation is approved by the human, automatically generate a code issue, spin up a secure container, and let Devin draft the PR to solve the issue, closing the infinite feedback loop.
Live Web Outbound Engine: Grant Connie authorization to execute actual social media posting and community interactions via the X, Slack, and Discord APIs.
Automated Pitch Deck Sync: Dynamically sync updated traction points directly with a Google Slides or Canva API to keep the investor deck live 24/7.

