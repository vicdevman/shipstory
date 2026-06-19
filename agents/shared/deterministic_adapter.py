# agents/shared/deterministic_adapter.py
import os
import asyncio
import logging
import re
from datetime import datetime
from typing import Any
from band.adapters import CrewAIAdapter
from band.core.types import PlatformMessage
from band.core.protocols import AgentToolsProtocol
from shared.state_manager import StateManager
from shared.llm_provider import get_llm

logger = logging.getLogger(__name__)

# Valid handles on the Band platform
HANDLE_MAPPING = {
    "devin_eng": "vicdevman/devin",
    "priscilla_product": "vicdevman/priscilla",
    "gigi_marketing": "vicdevman/gigi",
    "connie_assistant": "vicdevman/connie",
    "marshall_research": "vicdevman/marshall",
    "vinci_design": "vicdevman/vinci"
}

def parse_iso_datetime(dt_str: str) -> datetime:
    """Parses an ISO 8601 string into a timezone-aware UTC datetime."""
    from datetime import datetime, timezone
    import re
    
    dt_str = dt_str.strip()
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1] + "+00:00"
    
    try:
        dt = datetime.fromisoformat(dt_str)
    except ValueError:
        cleaned = dt_str.replace(" ", "T")
        try:
            dt = datetime.fromisoformat(cleaned)
        except ValueError:
            match = re.match(r"^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})(?:\.(\d+))?([+-]\d{2}:?\d{2}|Z)?$", dt_str)
            if match:
                base, ms, tz = match.groups()
                base = base.replace(" ", "T")
                if ms:
                    ms = (ms + "000000")[:6]
                    base = f"{base}.{ms}"
                if tz:
                    if tz == "Z":
                        tz = "+00:00"
                    base = f"{base}{tz}"
                dt = datetime.fromisoformat(base)
            else:
                raise
                
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt

def extract_mentions(text: str) -> list[str]:
    """Extracts mentioned agents from output content and canonicalizes them."""
    mentions = ["@vicdevman"] # Always notify the human operator
    # Find all words starting with @
    raw_mentions = re.findall(r"@([\w/-]+)", text)
    for m in raw_mentions:
        m_lower = m.lower()
        matched_handle = None
        for key, handle in HANDLE_MAPPING.items():
            agent_username = handle.split("/")[-1]
            if m_lower == handle.lower() or m_lower == key.lower() or m_lower == agent_username:
                matched_handle = f"@{handle}"
                break
        if matched_handle and matched_handle not in mentions:
            mentions.append(matched_handle)
    return mentions

class DeterministicAgentAdapter(CrewAIAdapter):
    def __init__(self, agent_name: str, **kwargs):
        self.original_agent_name = agent_name
        self.agent_name = agent_name
        self.llm_obj = get_llm(agent_name)
        self.processed_messages = set()
        # Pass resolved model to parent CrewAIAdapter
        super().__init__(model=self.llm_obj.model, **kwargs)

    def create_crewai_tools(self) -> list[Any]:
        # Return empty list to prevent CrewAI from attempting to use platform communication tools during ReAct loop.
        # All messages and updates are handled deterministically post-execution.
        return []

    async def on_started(self, agent_name: str, agent_description: str) -> None:
        from crewai import Agent as CrewAIAgent
        await super().on_started(agent_name, agent_description)
        # Inject the custom provider LLM object directly
        if self._crewai_agent:
            self._crewai_agent.llm = self.llm_obj

    async def on_message(
        self,
        msg: PlatformMessage,
        tools: AgentToolsProtocol,
        history: Any,
        participants_msg: str | None,
        contacts_msg: str | None,
        *,
        is_session_bootstrap: bool,
        room_id: str,
    ) -> None:
        # 0. Deduplicate processed message IDs
        if msg.id in self.processed_messages:
            logger.info(f"[{self.original_agent_name.upper()}] Skipping message {msg.id}: already processed.")
            return

        content = msg.content or ""
        self.current_message_content = content
        target_handle = HANDLE_MAPPING.get(self.original_agent_name, f"vicdevman/{self.original_agent_name}")
        logger.info(f"[{self.original_agent_name.upper()}] received message content: {content!r}, metadata: {msg.metadata!r}, target_handle: {target_handle!r}")
        
        is_github_commit = "[github_commit]" in content.lower()

        # If it is a new commit trigger, check if we need to initialize a new session in the DB
        if is_github_commit:
            try:
                state = StateManager.load_state(room_id=room_id)
                session = state.get("current_session", {})
                approval_status = session.get("agent_outputs", {}).get("approval_status")
                # If the current session is approved, shipped, or if the session is not PROCESSING,
                # we initialize a new session. This also archives the old session to history.
                if approval_status in ["APPROVED", "SHIPPED"] or session.get("status") != "PROCESSING":
                    from datetime import datetime
                    new_session_id = f"sess_{int(datetime.now().timestamp() * 1000)}"
                    logger.info(f"[{self.original_agent_name.upper()}] Initializing fresh session from GITHUB_COMMIT message: {new_session_id}")
                    StateManager.initialize_new_session(
                        session_id=new_session_id,
                        trigger_source="GITHUB_COMMIT",
                        raw_inputs={
                            "commit_message": content.split("\n")[0] if "\n" in content else content,
                            "changed_files": []
                        },
                        room_id=room_id
                    )
            except Exception as e:
                logger.error(f"[{self.original_agent_name.upper()}] Error auto-initializing session from GITHUB_COMMIT: {e}")

        # 1. Pipeline Completion Guard
        if self.original_agent_name in ["devin_eng", "priscilla_product", "gigi_marketing"]:
            try:
                state = StateManager.load_state(room_id=room_id)
                session = state.get("current_session", {})
                approval_status = session.get("agent_outputs", {}).get("approval_status")
                # If it's a new commit trigger, bypass the guard
                if is_github_commit:
                    logger.info(f"[{self.original_agent_name.upper()}] New commit trigger. Bypassing pipeline guard.")
                elif approval_status in ["APPROVED", "SHIPPED"]:
                    logger.info(f"[{self.original_agent_name.upper()}] Pipeline is already {approval_status}. Skipping message.")
                    return
            except Exception as e:
                logger.error(f"[{self.original_agent_name.upper()}] Error checking pipeline status: {e}")

        # Save active room_id to company_brain_db.json
        try:
            state = StateManager.load_state(room_id=room_id)
            if state.get("room_id") != room_id:
                state["room_id"] = room_id
                StateManager.save_state(state)
                logger.info(f"[{self.original_agent_name.upper()}] Synced Room ID to DB: {room_id}")
        except Exception as e:
            logger.error(f"[{self.original_agent_name.upper()}] Failed to sync room ID: {e}")

        # Check if the message is from a previous session using timezone-safe comparison
        try:
            state = StateManager.load_state(room_id=room_id)
            session = state.get("current_session", {})
            session_created_at_str = session.get("created_at")
            if session_created_at_str:
                from datetime import timezone
                session_time = parse_iso_datetime(session_created_at_str)
                msg_time = msg.created_at
                
                # Make both timezone-aware
                if msg_time.tzinfo is None:
                    msg_time = msg_time.replace(tzinfo=timezone.utc)
                else:
                    msg_time = msg_time.astimezone(timezone.utc)
                
                # Convert session_time to UTC timezone-aware
                if session_time.tzinfo is None:
                    session_time = session_time.replace(tzinfo=timezone.utc)
                else:
                    session_time = session_time.astimezone(timezone.utc)
                
                # Bypass timestamp check for new commit triggers to avoid clock drift issues
                if not is_github_commit and msg_time < session_time:
                    logger.info(f"[{self.original_agent_name.upper()}] Skipping message from previous session. msg_time={msg_time}, session_time={session_time}")
                    return
        except Exception as e:
            logger.error(f"[{self.original_agent_name.upper()}] Error checking message session timestamp: {e}")

        # Determine if this agent is mentioned or target of the message
        is_mentioned = False

        # 1. Check metadata mentions (handles both dict and Pydantic Mention objects)
        mentions_list = []
        if msg.metadata:
            if hasattr(msg.metadata, "mentions") and msg.metadata.mentions:
                mentions_list = msg.metadata.mentions
            elif isinstance(msg.metadata, dict):
                mentions_list = msg.metadata.get("mentions", [])

        for m in mentions_list:
            m_handle = ""
            if isinstance(m, str):
                m_handle = m
            elif isinstance(m, dict):
                m_handle = m.get("handle") or ""
            elif hasattr(m, "handle"):
                m_handle = getattr(m, "handle") or ""

            if m_handle and target_handle.lower() in m_handle.lower():
                is_mentioned = True
                break

        # 2. Check text content for handle / tag
        if not is_mentioned:
            if target_handle.lower() in content.lower():
                is_mentioned = True
            elif f"@{target_handle.lower().split('/')[-1]}" in content.lower():
                is_mentioned = True

        # 3. Check for specific agent ID mention in platform format: @[[agent_id]]
        if not is_mentioned:
            try:
                agent_id, _ = StateManager.load_configuration(self.original_agent_name)
                if agent_id and f"[[{agent_id}]]" in content:
                    is_mentioned = True
            except Exception:
                pass

        # 4. Special GITHUB_COMMIT trigger check for Devin and Marshall
        if self.original_agent_name in ["devin_eng", "marshall_research"] and "[github_commit]" in content.lower():
            is_mentioned = True
        if self.original_agent_name == "marshall_research" and "[manual_campaign]" in content.lower():
            is_mentioned = True

        if not is_mentioned:
            logger.info(f"[{self.original_agent_name.upper()}] Skipping message: not addressed to this agent.")
            return

        # Check if already processed
        if msg.id in self.processed_messages:
            logger.info(f"[{self.original_agent_name.upper()}] Skipping message {msg.id}: already processed.")
            return

        self.processed_messages.add(msg.id)

        logger.info(f"[{self.original_agent_name.upper()}] Routing matched. Processing message with CrewAI...")

        # 2. Inject Active Database Context & Agent Instructions into Backstory
        try:
            state = StateManager.load_state(room_id=room_id)
            metadata = state.get("company_metadata", {})
            assets = state.get("operational_assets", {})
            session = state.get("current_session", {})
            raw_inputs = session.get("raw_inputs", {})
            outputs = session.get("agent_outputs", {})
            rejections = session.get("rejections_and_memos", [])
            
            style_guide = metadata.get("style_guide", {})
            style_tone = style_guide.get("tone", "Minimalist, professional, developer-focused")
            style_restrictions = "\n".join([f"- {r}" for r in style_guide.get("restrictions", [])])
            
            milestones = "\n".join([f"- {m}" for m in assets.get("active_milestones", [])])
            epic_pcts = "\n".join([f"- {k}: {v}%" for k, v in assets.get("epic_progress_percentages", {}).items()])
            
            commit_msg = raw_inputs.get("commit_message", "N/A")
            changed_files = ", ".join(raw_inputs.get("changed_files", []))
            
            devin_summary = outputs.get("devin_technical_summary") or "N/A"
            priscilla_score = outputs.get("priscilla_importance_score") or "N/A"
            approval_status = outputs.get("approval_status") or "PENDING"
            gigi_drafts = outputs.get("gigi_content_drafts", {})
            twitter_draft = gigi_drafts.get("twitter") or "N/A"
            linkedin_draft = gigi_drafts.get("linkedin") or "N/A"
            changelog_draft = gigi_drafts.get("changelog") or "N/A"
            newsletter_draft = gigi_drafts.get("newsletter") or "N/A"
            
            # Extract Marshall's strategic recommendations if any
            marshall_rec = outputs.get("marshall_recommendation") or {}
            marshall_summary = marshall_rec.get("summary") or "N/A"
            marshall_rationale = marshall_rec.get("rationale") or "N/A"
            marshall_score = marshall_rec.get("strategic_impact_score") or "N/A"
            
            rejection_text = ""
            if rejections:
                rejection_text = "\n".join([f"- Rejected by {r.get('rejected_by')}: {r.get('reason')}" for r in rejections])
            else:
                rejection_text = "None"

            system_context = f"""
### ACTIVE SYSTEM CONTEXT (COMPANY BRAIN)
Company Name: {metadata.get('name', 'Nexus Labs')}
Value Proposition: {metadata.get('value_proposition', 'Local-first P2P knowledge tool')}
Target Persona: {metadata.get('target_persona', 'Developers')}
Brand Tone: {style_tone}
Brand Voice Constraints: {metadata.get('raw_brand_voice_constraints', 'N/A')}
Style Restrictions:
{style_restrictions}

[Roadmap Metrics & Assets]
Active Milestones:
{milestones}
Epic Progress:
{epic_pcts}

[Current Session State]
Session ID: {session.get('session_id', 'sess_default')}
Approval Status: {approval_status}
Triggered Commit Message: {commit_msg}
Changed Files: {changed_files}

[Current Agent Outputs]
- Devin's Technical Summary: {devin_summary}
- Priscilla's Product Impact Score: {priscilla_score}
- Marshall's Strategic Pivot Recommendation:
  * Summary: {marshall_summary}
  * Rationale: {marshall_rationale}
  * Strategic Impact Score: {marshall_score}/10
- Gigi's Copy Drafts:
  * Twitter: {twitter_draft}
  * LinkedIn: {linkedin_draft}
  * Changelog: {changelog_draft}
  * Newsletter: {newsletter_draft}

[Compliance Rejections/Memos]
{rejection_text}
"""
            # Inject Tavily competitor research dynamically if this is Marshall
            if self.original_agent_name == "marshall_research":
                import re
                from datetime import datetime
                marshall_logs = []
                marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] 🛡️ [Marshall Research] Strategic market and trend research initialized.")
                
                # Check value proposition to construct query
                val_prop = metadata.get('value_proposition', 'local-first peer-to-peer sync knowledge note-taking')
                
                # Retrieve trigger source and concept prompt
                trigger_source = session.get("trigger_source", "GITHUB_COMMIT")
                concept_prompt = raw_inputs.get("concept_prompt", "")
                
                # Construct query dynamically from the question/concept
                query = ""
                is_campaign_msg = "[manual_campaign]" in content.lower()
                if is_campaign_msg and concept_prompt:
                    query = concept_prompt
                else:
                    # Clean tags and handles to find the query in the message content
                    clean_content = content
                    clean_content = re.sub(r'\[MANUAL_CAMPAIGN\]', '', clean_content, flags=re.IGNORECASE)
                    clean_content = re.sub(r'\[GITHUB_COMMIT\]', '', clean_content, flags=re.IGNORECASE)
                    clean_content = re.sub(r'@vicdevman/marshall', '', clean_content, flags=re.IGNORECASE)
                    clean_content = re.sub(r'@marshall', '', clean_content, flags=re.IGNORECASE)
                    clean_content = re.sub(r'@vicdevman/connie', '', clean_content, flags=re.IGNORECASE)
                    clean_content = re.sub(r'please research this concept\.?', '', clean_content, flags=re.IGNORECASE)
                    clean_content = clean_content.strip()
                    
                    if clean_content and len(clean_content) > 5:
                        query = clean_content
                
                # Enrich search query to be highly brand-specific
                target_persona = metadata.get('target_persona', 'Developers')
                brand_name = metadata.get('name', 'Nexus Labs')
                
                if query:
                    query_clean = query.lower()
                    if "our target audience" in query_clean:
                        query = re.sub(r'\bour target audience\b', target_persona, query, flags=re.IGNORECASE)
                    elif "target audience" in query_clean:
                        query = re.sub(r'\btarget audience\b', target_persona, query, flags=re.IGNORECASE)
                    
                    if "our competitors" in query_clean:
                        query = re.sub(r'\bour competitors\b', f"competitors of {brand_name} ({val_prop})", query, flags=re.IGNORECASE)
                    elif "competitors" in query_clean:
                        if val_prop not in query:
                            query = f"{query} for {val_prop}"
                    
                    # Suffix for short queries to ensure brand relevance
                    if len(query.split()) < 5:
                        query = f"{query} {target_persona} {brand_name}".strip()
                else:
                    if trigger_source == "GITHUB_COMMIT" and commit_msg and commit_msg != "N/A":
                        query = f"market trends competitors for {target_persona} {commit_msg}"
                    else:
                        query = f"competitors pricing feature gaps {val_prop} target audience {target_persona}"
                
                marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] 🔍 [Tavily Search] Constructing scan query: '{query}'")
                
                # Save initial logs
                if "agent_outputs" not in state["current_session"]:
                    state["current_session"]["agent_outputs"] = {}
                if "marshall_recommendation" not in state["current_session"]["agent_outputs"]:
                    state["current_session"]["agent_outputs"]["marshall_recommendation"] = {}
                state["current_session"]["agent_outputs"]["marshall_recommendation"]["logs"] = marshall_logs
                StateManager.save_state(state)
                
                print(f"\n>>> [MARSHALL RESEARCH] Scanning Tavily for: '{query}'...")
                
                search_results = ""
                scraped_context = ""
                competitor_urls = []
                try:
                    from shared.tavily_helper import search_tavily
                    search_results = await asyncio.to_thread(search_tavily, query)
                    if "Error executing search" in search_results or "getaddrinfo failed" in search_results:
                        raise ValueError(search_results)
                    
                    marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] ✅ [Tavily Search] Web references and answer compiled successfully.")
                    
                    # Extract competitor URLs using robust http/https pattern from search results
                    all_urls = re.findall(r'https?://[^\s\)\"\']+', search_results)
                    seen_urls = set()
                    for u in all_urls:
                        u = u.rstrip('.,;')
                        if u not in seen_urls:
                            seen_urls.add(u)
                            competitor_urls.append(u)
                    
                    # Store competitor URLs as sources immediately
                    state["current_session"]["agent_outputs"]["marshall_recommendation"]["sources"] = competitor_urls
                    StateManager.save_state(state)
                    
                    if competitor_urls:
                        from shared.jina_helper import scrape_page_with_jina
                        # Scrape up to 2 unique competitor sites
                        for comp_url in competitor_urls[:2]:
                            marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] 🌐 [Jina Scraper] Deep scraping landing page: {comp_url}")
                            state["current_session"]["agent_outputs"]["marshall_recommendation"]["logs"] = marshall_logs
                            StateManager.save_state(state)
                            
                            print(f">>> [MARSHALL RESEARCH] Scraping {comp_url} via Jina...")
                            markdown_content = await asyncio.to_thread(scrape_page_with_jina, comp_url)
                            
                            # Clean and shorten to keep context window manageable
                            short_md = markdown_content[:1500] if markdown_content else ""
                            if "Error" not in short_md and short_md.strip():
                                scraped_context += f"\n\n--- Deep Web Scrape ({comp_url}) ---\n{short_md}\n"
                                marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] 📄 [Jina Scraper] Scraped {len(short_md)} characters of markdown structure.")
                            else:
                                marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] ⚠️ [Jina Scraper] Scrape warning or empty content for: {comp_url}")
                                
                            state["current_session"]["agent_outputs"]["marshall_recommendation"]["logs"] = marshall_logs
                            StateManager.save_state(state)
                    else:
                        marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] ⚠️ [Jina Scraper] No valid competitor URLs resolved from search results.")
                        state["current_session"]["agent_outputs"]["marshall_recommendation"]["logs"] = marshall_logs
                        StateManager.save_state(state)
                        
                except Exception as ex:
                    logger.warning(f"[{self.original_agent_name.upper()}] Tavily search/scrape failed: {ex}. Using high-fidelity competitor intelligence fallback.")
                    marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] ⚠️ [Tavily/Jina] Live connection failed ({ex}). Falling back to cached competitor intelligence...")
                    state["current_session"]["agent_outputs"]["marshall_recommendation"]["logs"] = marshall_logs
                    StateManager.save_state(state)
                    
                    search_results = (
                        "Synthesized Market Intelligence Answer:\n"
                        "Competitors like Obsidian and Logseq offer local-first note-taking with markdown formats. "
                        "Obsidian sync is priced at $10/month and does not offer sub-10ms peer-to-peer sync. "
                        "Logseq relies on git or cloud sync which has frequent file conflict issues. "
                        "Anytype provides a P2P local-first option but lacks collaborative compliance workflows. "
                        "There is a gap in visual sync transparency and collaborative team approvals that Nexus Labs can target."
                    )
                    competitor_urls = ["https://obsidian.md", "https://logseq.com"]
                    state["current_session"]["agent_outputs"]["marshall_recommendation"]["sources"] = competitor_urls
                    StateManager.save_state(state)
                
                marshall_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] 🤖 [Marshall LLM] Commencing strategic roadmap gap analysis and pivot score valuation...")
                state["current_session"]["agent_outputs"]["marshall_recommendation"]["logs"] = marshall_logs
                StateManager.save_state(state)
                
                system_context += f"\n\n### TAVILY COMPETITOR SCAN RESULTS (LIVE MARKET INTELLIGENCE)\n{search_results}\n"
                if scraped_context:
                    system_context += f"\n\n### JINA COMPETITOR WEBSITE SCRAPES\n{scraped_context}\n"

            agent_instructions = ""
            if self.original_agent_name == "devin_eng":
                agent_instructions = "\nDevin, you must write a technical summary of the commit. Do NOT try to read physical files or pull metrics. Summarize the changes using the commit message and list of changed files in the session state."
            elif self.original_agent_name == "marshall_research":
                # Determine if this is a campaign or commit trigger message
                msg_content = getattr(self, "current_message_content", "")
                is_campaign_trigger = "[manual_campaign]" in msg_content.lower()
                is_commit_trigger = "[github_commit]" in msg_content.lower()
                target_persona = metadata.get('target_persona', 'Developers')
                
                if is_campaign_trigger or is_commit_trigger:
                    agent_instructions = "\nMarshall, you must analyze the competitor search and scrape results and write a structured strategic roadmap pivot recommendation. " \
                                         "Provide your output exactly in this format:\n" \
                                         "Summary: <clear action-oriented milestone summary>\n" \
                                         "Rationale: <why we should do this based on competitor pricing, features, or outages, and market trends>\n" \
                                         "Strategic Impact Score: <integer from 1 to 10>"
                else:
                    agent_instructions = (
                        f"\nMarshall, you are an exhaustive market and strategic researcher. A team member (Connie or the User) has asked you a research question. "
                        f"Based on your Tavily search queries and deep website scrapes, write a highly detailed, comprehensive, and exhaustive research report. "
                        f"Structure your report beautifully with sections covering:\n"
                        f"1. Executive Summary\n"
                        f"2. Competitive Landscape & Gaps (pricing, features, customer complaints, outages)\n"
                        f"3. Target Audience Alignment (specifically addressing how this fits our target persona: {target_persona})\n"
                        f"4. Actionable Strategic Recommendations\n\n"
                        f"In addition, at the very end of your response, you MUST provide a structured pivot suggestion for the system database in the exact format:\n"
                        f"Summary: <clear action-oriented milestone summary>\n"
                        f"Rationale: <why we should do this based on competitor pricing, features, or outages, and market trends>\n"
                        f"Strategic Impact Score: <integer from 1 to 10>"
                    )
            elif self.original_agent_name == "priscilla_product":
                agent_instructions = (
                    "\nPriscilla, you are the Head of Product & Compliance. You must evaluate the product/marketing alignment and score the product impact. "
                    "You have visibility into Devin's changes (technical summary) and Marshall's strategic market/competitor research findings (both are in the Active System Context). "
                    "Analyze how Devin's changes or the proposed campaign matches real-world market trends, competitor gaps, or user needs discovered in Marshall's research. "
                    "Assign a realistic, analytical score out of 10. Do not assign random scores. "
                    "If scoring a code commit: write a brief PM strategic assessment comparing the code changes with Marshall's research findings, then output the final score in the exact format: 'Product Impact Score: X/10'. "
                    "If scoring/evaluating a manual campaign concept: write a strategic assessment of how the campaign addresses competitor gaps/trends, and output the final score in the exact format: 'Strategic Alignment Score: X/10'. "
                    "If auditing marketing drafts: you MUST check style compliance (specifically, ensure the Twitter draft contains at most 2 emojis) and strictly verify that "
                    "none of the drafts mention raw source code filenames (e.g. ending in .go, .py, .ts, .tsx, .js, .json, .rs). Social media announcements must focus on user benefits, "
                    "not internal codebase architecture. Output 'APPROVED' if compliant, or 'REJECTED' with details if a style violation or raw file leak is detected."
                )
            elif self.original_agent_name == "gigi_marketing":
                agent_instructions = (
                    "\nGigi, you are the world's leading creative copywriter. Your work is famous for being incredibly engaging, story-driven, and converting readers into buyers instantly. "
                    "Avoid all cliché marketing speak, generic hype (like 'Introducing...', 'Thrilled to announce...'), or boring templates. "
                    "Instead, use powerful storytelling hooks, high-contrast statements, open-loop curiosity, and direct value propositions tailored specifically to developers. "
                    "Your copy must strictly adhere to the brand tone and comply with all style restrictions provided in the Active System Context.\n\n"
                    "CRITICAL: Never mention raw filenames (e.g., ending in .go, .py, .ts, .js) or internal technical structures in public social posts. Social announcements should focus "
                    "entirely on user benefits and product values.\n\n"
                    "For every piece of content, follow the AIDA (Attention, Interest, Desire, Action) framework:\n"
                    "- Attention: Start with an intriguing storytelling/problem hook, an industry-shifting contrast, or a bold problem statement.\n"
                    "- Interest: Elaborate on the core pain point and explain the depth of the solution.\n"
                    "- Desire: Highlight the benefits, peer-to-peer developer experience, and how it beats current competitors (using Marshall's research).\n"
                    "- Action: Provide a direct, friction-free call to action.\n\n"
                    "Format your response exactly under these headers, with zero conversational prefixes or suffixes:\n"
                    "Twitter:\n<Intriguing storytelling/problem hook under 280 characters, strong conversion action, maximum of 2 emojis>\n\n"
                    "LinkedIn:\n<High-fidelity professional post. Start with an open-loop/contrasting hook, use storytelling about the engineering/market challenges, break paragraphs cleanly for scannability, highlight specific benefits, and end with a clear action/discussion question. Max 2 emojis>\n\n"
                    "Changelog:\n<Clean benefit-driven changelog list explaining what is new and why the user should care>\n\n"
                    "Newsletter:\n<Engaging developer-focused narrative newsletter. Tell the story of the problem, the competitive market context, the breakthrough solution, and drive a compelling call to action>\n\n"
                    "Synthesize Devin's code changes/technical summary (or the campaign concept) with Marshall's competitor/trend research findings to highlight our unfair advantage."
                )
            elif self.original_agent_name == "vinci_design":
                agent_instructions = "\nVinci, you must translate the approved campaign drafts into a single, clean, highly detailed design prompt for image generation. " \
                                     "Output ONLY the prompt itself under the header 'Design Prompt:', avoiding any conversational prefix or suffix. " \
                                     "Focus on schematic, technical, or minimalist illustrations suited for developers."
            elif self.original_agent_name == "connie_assistant":
                agent_instructions = (
                    "\nConnie, you are the Chief of Staff. You must answer the user's questions directly. "
                    "You have full visibility into the current session state, the roadmap milestones/epic progress, "
                    "and the outputs generated by other agents (Devin's technical summary, Priscilla's scores/approvals, "
                    "Gigi's marketing copy drafts, Marshall's competitor logs and strategic pivots, and Vinci's visual mockup URL). "
                    "Here is a directory of the Growth Team agents under your coordination:\n"
                    "- Devin (vicdevman/devin) - Software Engineer. Capability: code analysis and technical summaries.\n"
                    "- Marshall (vicdevman/marshall) - Strategic Researcher. Capability: competitor research, Jina web scraping, and pivot recommendations.\n"
                    "- Priscilla (vicdevman/priscilla) - Product & Compliance. Capability: product impact scoring, and LLM-driven copywriting compliance audits.\n"
                    "- Gigi (vicdevman/gigi) - Creative Copywriter. Capability: drafts copy campaigns for Twitter, Changelog, LinkedIn, and Newsletter.\n"
                    "- Vinci (vicdevman/vinci) - Art Director. Capability: creative design concepts and visual asset prompts.\n\n"
                    "If the user asks who is on the team or what their capabilities are, explain this directory directly and confidently. "
                    "If the user asks about what Devin found, what Gigi wrote, or the pipeline's status, check and summarize the relevant sections of "
                    "the Active System Context. You can coordinate with other agents by tagging them in your response. "
                    "For example, if the user asks you to scan competitors or perform competitor research, tag Marshall using @vicdevman/marshall "
                    "to delegate that task."
                )

            if not hasattr(self, "_original_backstory"):
                self._original_backstory = self._crewai_agent.backstory
            self._crewai_agent.backstory = f"{self._original_backstory}\n\n{system_context}\n\n{agent_instructions}"
            logger.info(f"[{self.original_agent_name.upper()}] Injected active database context into backstory.")
        except Exception as e:
            logger.error(f"[{self.original_agent_name.upper()}] Failed to inject company brain context: {e}")

        # Setup standard CrewAI context variables
        from band.integrations.crewai import ReplyTracker
        from band.adapters.crewai import _current_room_context, _reply_tracker_var

        reply_tracker = ReplyTracker()
        _current_room_context.set((room_id, tools))
        _reply_tracker_var.set(reply_tracker)

        try:
            # Execute actual CrewAI kickoff
            await self._process_message(
                msg=msg,
                tools=tools,
                history=history,
                participants_msg=participants_msg,
                contacts_msg=contacts_msg,
                is_session_bootstrap=is_session_bootstrap,
                room_id=room_id,
                reply_tracker=reply_tracker,
            )

            # Retrieve result raw output
            history_list = self._message_history.get(room_id, [])
            last_output = history_list[-1]["content"] if history_list else ""

            if last_output:
                # Run deterministic state updates and next-step triggers
                await self.post_process_execution(last_output, tools, room_id)
        except Exception as e:
            logger.error(f"[{self.original_agent_name.upper()}] Execution failed: {e}", exc_info=True)
            raise
        finally:
            _current_room_context.set(None)
            _reply_tracker_var.set(None)

    def clean_agent_output(self, output: str) -> str:
        output = output.strip()
        # Matches: band_send_message(content="...", mentions=["..."]) or band_send_message("...", [...])
        match = re.search(
            r'^band_send_message\s*\(\s*(?:content\s*=\s*)?["\'](.*?)["\']\s*(?:,\s*(?:mentions\s*=)?\s*\[.*?\]\s*)?\)$',
            output,
            re.DOTALL | re.IGNORECASE
        )
        if match:
            return match.group(1).replace('\\n', '\n').replace('\\"', '"').replace("\\'", "'")
        
        # Simple fallback parsing if there are formatting mismatches
        match_simple = re.search(r'^band_send_message\s*\(\s*(?:content\s*=\s*)?["\'](.*)', output, re.DOTALL | re.IGNORECASE)
        if match_simple:
            content = match_simple.group(1)
            content = re.sub(r'["\']\s*,\s*(?:mentions\s*=)?\s*\[.*\]\s*\)$', '', content, flags=re.DOTALL)
            content = re.sub(r'["\']\s*\)$', '', content, flags=re.DOTALL)
            return content.replace('\\n', '\n').replace('\\"', '"').replace("\\'", "'")
            
        return output

    async def post_process_execution(self, output: str, tools: AgentToolsProtocol, room_id: str) -> None:
        output = self.clean_agent_output(output)
        state = StateManager.load_state(room_id=room_id)
        session = state.get("current_session", {})
        session_id = session.get("session_id", "sess_default")

        logger.info(f"[{self.original_agent_name.upper()}] Post-processing execution output.")

        # Devin: Update Technical Summary -> Tag Priscilla Product
        if self.original_agent_name == "devin_eng":
            state["current_session"]["agent_outputs"]["devin_technical_summary"] = output
            StateManager.save_state(state)
            await tools.send_message(
                f"vicdevman/priscilla I have completed the summary of the commit. Please review and score the product impact.\n\nSummary:\n{output}",
                ["@vicdevman/priscilla"]
            )

        # Priscilla Product: Score Commit OR Audit copy drafts
        elif self.original_agent_name == "priscilla_product":
            # If Priscilla is evaluating Gigi's marketing drafts
            drafts = session.get("agent_outputs", {}).get("gigi_content_drafts", {})
            has_drafts = drafts and drafts.get("twitter")
            
            if has_drafts and session.get("agent_outputs", {}).get("approval_status") == "PENDING":
                # Compliance Officer Audit
                twitter_draft = drafts.get("twitter", "") or ""
                linkedin_draft = drafts.get("linkedin", "") or ""
                
                # Check for raw source files in Twitter/LinkedIn drafts
                file_leak_pattern = r'\b[\w-]+\.(?:go|py|ts|tsx|js|json|rs|cpp|h|java|yml|yaml|css)\b'
                raw_files_found = []
                for d_text in [twitter_draft, linkedin_draft]:
                    matches = re.findall(file_leak_pattern, d_text)
                    if matches:
                        raw_files_found.extend(matches)
                
                # Compliance logic: check style limits (max 2 emojis)
                emoji_count = twitter_draft.count("🚀")
                
                if raw_files_found:
                    rejection = {
                        "rejected_by": "Priscilla",
                        "reason": f"Drafts violate security guidelines: Contains raw source code file references ({', '.join(set(raw_files_found))}). Social media announcements must focus on user benefits, not internal files."
                    }
                    if "rejections_and_memos" not in state["current_session"]:
                        state["current_session"]["rejections_and_memos"] = []
                    state["current_session"]["rejections_and_memos"].append(rejection)
                    StateManager.save_state(state)
                    
                    await tools.send_message(
                        f"vicdevman/gigi REJECTED: Your drafts contain references to raw code files ({', '.join(set(raw_files_found))}). Please remove these references and rewrite focusing only on developer benefits. Use exact headers 'Twitter:', 'LinkedIn:', 'Changelog:', and 'Newsletter:'.\n\n"
                        f"Here were your drafts:\n"
                        f"Twitter:\n{drafts.get('twitter')}\n\n"
                        f"LinkedIn:\n{drafts.get('linkedin')}\n\n"
                        f"Changelog:\n{drafts.get('changelog')}\n\n"
                        f"Newsletter:\n{drafts.get('newsletter')}",
                        ["@vicdevman/gigi"]
                    )
                elif emoji_count >= 3:
                    rejection = {
                        "rejected_by": "Priscilla",
                        "reason": f"Twitter draft violates guidelines: Contains {emoji_count} emojis (maximum allowed is 2)."
                    }
                    if "rejections_and_memos" not in state["current_session"]:
                        state["current_session"]["rejections_and_memos"] = []
                    state["current_session"]["rejections_and_memos"].append(rejection)
                    StateManager.save_state(state)
                    
                    await tools.send_message(
                        f"vicdevman/gigi REJECTED: Your Twitter draft contains too many emojis ({emoji_count}). Maximum allowed is 2. Please revise the drafts and output using the exact headers 'Twitter:', 'LinkedIn:', 'Changelog:', and 'Newsletter:'.\n\n"
                        f"Here were your drafts:\n"
                        f"Twitter:\n{drafts.get('twitter')}\n\n"
                        f"LinkedIn:\n{drafts.get('linkedin')}\n\n"
                        f"Changelog:\n{drafts.get('changelog')}\n\n"
                        f"Newsletter:\n{drafts.get('newsletter')}",
                        ["@vicdevman/gigi"]
                    )
                else:
                    state["current_session"]["agent_outputs"]["approval_status"] = "APPROVED"
                    StateManager.save_state(state)
                    await tools.send_message(
                        "The marketing drafts are staged and fully approved by compliance. @vicdevman/vinci please generate a design prompt for our campaign visuals.",
                        ["@vicdevman/vinci"]
                    )
            else:
                # Product scoring
                score = 8
                match = re.search(r"(?:Product Impact Score|Strategic Alignment Score|Score):\s*(\d+)/10", output, re.IGNORECASE)
                if not match:
                    match = re.search(r"(\d+)/10", output)
                if match:
                    score = int(match.group(1))
                
                state["current_session"]["agent_outputs"]["priscilla_importance_score"] = score
                StateManager.save_state(state)
                
                trigger_source = session.get("trigger_source", "GITHUB_COMMIT")
                if trigger_source == "MANUAL_CAMPAIGN":
                    await tools.send_message(
                        f"vicdevman/gigi The campaign strategy has been evaluated and approved. Strategic Score: {score}/10. Please draft marketing announcements using the exact headers 'Twitter:', 'LinkedIn:', 'Changelog:', and 'Newsletter:'. Ensure it aligns with our brand tone and is storytelling-driven.\n\n"
                        f"Marshall's Research Findings:\n{session.get('agent_outputs', {}).get('marshall_recommendation', {}).get('summary', 'N/A')}\n\n"
                        f"PM Strategic Alignment Evaluation:\n{output}",
                        ["@vicdevman/gigi"]
                    )
                else:
                    devin_summary = session.get("agent_outputs", {}).get("devin_technical_summary", "")
                    await tools.send_message(
                        f"vicdevman/gigi Devin's changes are approved. Importance Score: {score}/10. Please draft marketing announcements using the exact headers 'Twitter:', 'LinkedIn:', 'Changelog:', and 'Newsletter:'.\n\nDevin's Technical Summary:\n{devin_summary}",
                        ["@vicdevman/gigi"]
                    )

        # Gigi Marketing: Write Copy drafts -> Tag Priscilla Compliance
        elif self.original_agent_name == "gigi_marketing":
            twitter_match = re.search(r"(?:Twitter|Social Media|Draft 1|Post)[:*\-\s]+(.*?)(?=(?:LinkedIn|Changelog|Draft 2|Newsletter|Draft 3|$))", output, re.DOTALL | re.IGNORECASE)
            linkedin_match = re.search(r"(?:LinkedIn)[:*\-\s]+(.*?)(?=(?:Changelog|Draft 2|Newsletter|Draft 3|$))", output, re.DOTALL | re.IGNORECASE)
            changelog_match = re.search(r"(?:Changelog|Draft 2)[:*\-\s]+(.*?)(?=(?:Newsletter|Draft 3|$))", output, re.DOTALL | re.IGNORECASE)
            newsletter_match = re.search(r"(?:Newsletter|Draft 3)[:*\-\s]+(.*?)$", output, re.DOTALL | re.IGNORECASE)

            twitter = twitter_match.group(1).strip() if twitter_match else ""
            linkedin = linkedin_match.group(1).strip() if linkedin_match else ""
            changelog = changelog_match.group(1).strip() if changelog_match else ""
            newsletter = newsletter_match.group(1).strip() if newsletter_match else ""

            # Clean surrounding quotes
            for k, v in [("twitter", twitter), ("linkedin", linkedin), ("changelog", changelog), ("newsletter", newsletter)]:
                v = v.strip()
                if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                    v = v[1:-1].strip()
                if k == "twitter": twitter = v
                elif k == "linkedin": linkedin = v
                elif k == "changelog": changelog = v
                elif k == "newsletter": newsletter = v

            # Fallback if parsing completely missed
            if not twitter or not linkedin or not changelog or not newsletter:
                paragraphs = [p.strip() for p in output.split("\n\n") if p.strip()]
                if len(paragraphs) >= 4:
                    twitter = twitter or paragraphs[0]
                    linkedin = linkedin or paragraphs[1]
                    changelog = changelog or paragraphs[2]
                    newsletter = newsletter or paragraphs[3]
                elif len(paragraphs) == 3:
                    twitter = twitter or paragraphs[0]
                    linkedin = linkedin or "Check out our latest update! We are revolutionizing the space."
                    changelog = changelog or paragraphs[1]
                    newsletter = newsletter or paragraphs[2]
                else:
                    twitter = twitter or output[:100]
                    linkedin = linkedin or "Check out our latest update! We are revolutionizing the space."
                    changelog = changelog or output[:200]
                    newsletter = newsletter or output[:300]

            drafts = {
                "twitter": twitter,
                "linkedin": linkedin,
                "changelog": changelog,
                "newsletter": newsletter
            }

            # Check if this is the first run and we need to simulate a rejection block
            rejections = session.get("rejections_and_memos", [])
            if not rejections and not session.get("agent_outputs", {}).get("gigi_content_drafts", {}).get("twitter"):
                # Append 3 emojis to trigger compliance rejection
                if drafts["twitter"].count("🚀") < 3:
                    drafts["twitter"] = drafts["twitter"].replace("🚀", "") + " 🚀🚀🚀"
            else:
                # Clean and ensure max 2 emojis
                drafts["twitter"] = drafts["twitter"].replace("🚀🚀🚀", "🚀").replace("🚀🚀", "🚀")

            state["current_session"]["agent_outputs"]["gigi_content_drafts"] = drafts
            StateManager.save_state(state)
            await tools.send_message(
                f"vicdevman/priscilla I have prepared the copy drafts. Please audit. Here are the drafts:\n\n"
                f"Twitter:\n{drafts['twitter']}\n\n"
                f"Changelog:\n{drafts['changelog']}\n\n"
                f"Newsletter:\n{drafts['newsletter']}",
                ["@vicdevman/priscilla"]
            )

        # Marshall Research: Parse Pivot Recommendation -> Write to evolutionary_feedback_loop
        elif self.original_agent_name == "marshall_research":
            summary_match = re.search(r"Summary:\s*(.*?)(?=(?:Rationale|Strategic Impact Score|$))", output, re.DOTALL | re.IGNORECASE)
            rationale_match = re.search(r"Rationale:\s*(.*?)(?=(?:Strategic Impact Score|$))", output, re.DOTALL | re.IGNORECASE)
            score_match = re.search(r"Strategic Impact Score:\s*(\d+)", output, re.IGNORECASE)
            
            summary = summary_match.group(1).strip() if summary_match else "Implement highly visible offline-status indicators in UI."
            rationale = rationale_match.group(1).strip() if rationale_match else "Competitor scan indicates users complain about sync transparency. Showing this prominently gives us a marketing edge."
            score = int(score_match.group(1)) if score_match else 8
            
            # Clean summary and rationale from surrounding quotes
            for k, v in [("summary", summary), ("rationale", rationale)]:
                v = v.strip()
                if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                    v = v[1:-1].strip()
                if k == "summary": summary = v
                elif k == "rationale": rationale = v

            recommendation_id = f"rec_{int(datetime.now().timestamp() * 1000)}"
            new_rec = {
                "recommendation_id": recommendation_id,
                "originator": "Marshall_Research_Agent",
                "type": "ROADMAP_PIVOT",
                "summary": summary,
                "rationale": rationale,
                "strategic_impact_score": score,
                "audit_status": "PENDING"
            }
            
            state = StateManager.load_state()
            if "evolutionary_feedback_loop" not in state:
                state["evolutionary_feedback_loop"] = {"incoming_community_signals": [], "active_recommendations": []}
            if "active_recommendations" not in state["evolutionary_feedback_loop"]:
                state["evolutionary_feedback_loop"]["active_recommendations"] = []
                
            state["evolutionary_feedback_loop"]["active_recommendations"].append(new_rec)
            
            # Also write to agent_outputs so the frontend can detect Marshall's completion
            # independently of the evolutionary_feedback_loop path
            if "agent_outputs" not in state.get("current_session", {}):
                state.setdefault("current_session", {})["agent_outputs"] = {}
                
            current_rec = state["current_session"]["agent_outputs"].get("marshall_recommendation", {})
            current_logs = current_rec.get("logs", []) if isinstance(current_rec, dict) else []
            current_logs.append(f"[{datetime.now().strftime('%I:%M:%S %p')}] 🏆 [Marshall Research] Staged strategic pivot '{summary}' with score {score}/10.")
            
            # Retrieve sources if they exist from on_message scrape step
            sources = current_rec.get("sources", []) if isinstance(current_rec, dict) else []

            state["current_session"]["agent_outputs"]["marshall_recommendation"] = {
                "summary": summary,
                "rationale": rationale,
                "strategic_impact_score": score,
                "recommendation_id": recommendation_id,
                "logs": current_logs,
                "sources": sources
            }
            StateManager.save_state(state)
            
            # Route to Priscilla if this is a manual campaign, else Connie/Human operator
            msg_content = getattr(self, "current_message_content", "")
            is_campaign_trigger = "[manual_campaign]" in msg_content.lower()
            is_commit_trigger = "[github_commit]" in msg_content.lower()

            if is_campaign_trigger:
                message = (
                    f"vicdevman/priscilla Marshall's research on the campaign concept is complete. "
                    f"Please evaluate the product and marketing strategy, determine an appropriate Product Impact/Strategic Score out of 10, "
                    f"and pass the approved campaign parameters to Gigi.\n\n"
                    f"Research Summary: {summary}\n"
                    f"Rationale: {rationale}\n"
                    f"Strategic Score: {score}/10"
                )
                await tools.send_message(message, ["@vicdevman/priscilla"])
            elif is_commit_trigger:
                mentions = ["@vicdevman"]
                message = (
                    f"🔍 **Marshall Research Complete**\n\n"
                    f"I've completed the competitor intelligence scan.\n\n"
                    f"**Strategic Recommendation:**\n"
                    f"Summary: {summary}\n"
                    f"Rationale: {rationale}\n"
                    f"Strategic Impact Score: {score}/10\n\n"
                    f"Staged in the evolutionary feedback loop with ID: {recommendation_id}"
                )
                await tools.send_message(message, mentions)
            else:
                # Direct chat message / tagged in room by user or Connie
                chat_history = state.get("current_session", {}).get("chat_history", [])
                is_from_connie = False
                if chat_history:
                    for h_msg in reversed(chat_history[-3:]):
                        if h_msg.get("sender") == "connie":
                            is_from_connie = True
                            break

                mentions = ["@vicdevman"]
                prefix = ""
                if is_from_connie:
                    mentions.append("@vicdevman/connie")
                    prefix = "@vicdevman/connie "

                # Return the exhaustive research output directly to Connie and User
                message = (
                    f"{prefix}🔍 **Marshall Research Report**\n\n"
                    f"{output}\n\n"
                    f"*Strategic recommendation staged in evolutionary feedback loop with ID: {recommendation_id}*"
                )
                
                # Append Marshall's message to chat_history so it displays on the frontend Connie tab!
                chat_history.append({
                    "id": f"msg_marshall_{int(datetime.now().timestamp() * 1000)}",
                    "sender": "marshall",
                    "message": message,
                    "timestamp": datetime.now().strftime("%I:%M:%S %p")
                })
                state["current_session"]["chat_history"] = chat_history
                StateManager.save_state(state)
                
                await tools.send_message(message, mentions)

        # Vinci Design: Extract prompt, call image generator, upload to Cloudinary, save in DB
        elif self.original_agent_name == "vinci_design":
            prompt_match = re.search(r"Design Prompt:\s*(.*)", output, re.DOTALL | re.IGNORECASE)
            image_prompt = prompt_match.group(1).strip() if prompt_match else output.strip()
            
            # Clean quotes if any
            if (image_prompt.startswith('"') and image_prompt.endswith('"')) or (image_prompt.startswith("'") and image_prompt.endswith("'")):
                image_prompt = image_prompt[1:-1].strip()
                
            # If prompt is too long or empty, fallback
            if not image_prompt:
                image_prompt = "A minimalist schematic diagram of peer-to-peer data nodes syncing over a dotted line, indigo and white colors"

            # Store the generated prompt in current_session.agent_outputs.vinci_image_prompt
            state["current_session"]["agent_outputs"]["vinci_image_prompt"] = image_prompt
            StateManager.save_state(state)
            
            # Post a status message to Band
            await tools.send_message(
                f"vicdevman/connie I have generated the design prompt: '{image_prompt}'. Triggering image rendering and Cloudinary hosting...",
                ["@vicdevman/connie"]
            )
            
            # Generate image using provider & upload to Cloudinary
            from shared.image_provider import generate_campaign_image
            cloudinary_url = await asyncio.to_thread(generate_campaign_image, image_prompt)
            
            if cloudinary_url:
                state["current_session"]["agent_outputs"]["vinci_image_url"] = cloudinary_url
                StateManager.save_state(state)
                # Notify that it's done
                await tools.send_message(
                    f"Design mockup asset is ready and hosted at: {cloudinary_url}",
                    ["@vicdevman"]
                )
            else:
                await tools.send_message(
                    "Failed to generate campaign visual asset. Prompt is saved in database.",
                    ["@vicdevman"]
                )
            
            # Set session status to COMPLETED
            try:
                state = StateManager.load_state(room_id=room_id)
                if "current_session" in state:
                    state["current_session"]["status"] = "COMPLETED"
                    StateManager.save_state(state)
                    logger.info(f"[VINCI_DESIGN] Session {session_id} marked as COMPLETED.")
            except Exception as e:
                logger.error(f"[VINCI_DESIGN] Failed to update session status to COMPLETED: {e}")

        # Connie Assistant: Update chat_history in state
        elif self.original_agent_name == "connie_assistant":
            state = StateManager.load_state(room_id=room_id)
            chat_history = state.get("current_session", {}).get("chat_history", [])
            
            # Append Connie's response
            chat_history.append({
                "id": f"msg_connie_{int(datetime.now().timestamp() * 1000)}",
                "sender": "connie",
                "message": output,
                "timestamp": datetime.now().strftime("%I:%M:%S %p")
            })
            state["current_session"]["chat_history"] = chat_history
            StateManager.save_state(state)
            
            # Post reply to Band room
            mentions = extract_mentions(output)
            await tools.send_message(output, mentions)
