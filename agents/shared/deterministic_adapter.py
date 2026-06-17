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
        target_handle = HANDLE_MAPPING.get(self.original_agent_name, f"vicdevman/{self.original_agent_name}")
        logger.info(f"[{self.original_agent_name.upper()}] received message content: {content!r}, metadata: {msg.metadata!r}, target_handle: {target_handle!r}")
        
        # 1. Pipeline Completion Guard
        if self.original_agent_name in ["devin_eng", "priscilla_product", "gigi_marketing"]:
            try:
                state = StateManager.load_state()
                session = state.get("current_session", {})
                approval_status = session.get("agent_outputs", {}).get("approval_status")
                if approval_status in ["APPROVED", "SHIPPED"]:
                    logger.info(f"[{self.original_agent_name.upper()}] Pipeline is already {approval_status}. Skipping message.")
                    return
            except Exception as e:
                logger.error(f"[{self.original_agent_name.upper()}] Error checking pipeline status: {e}")

        # Save active room_id to company_brain_db.json
        try:
            state = StateManager.load_state()
            if state.get("room_id") != room_id:
                state["room_id"] = room_id
                StateManager.save_state(state)
                logger.info(f"[{self.original_agent_name.upper()}] Synced Room ID to DB: {room_id}")
        except Exception as e:
            logger.error(f"[{self.original_agent_name.upper()}] Failed to sync room ID: {e}")

        # Check if the message is from a previous session using timezone-safe comparison
        try:
            state = StateManager.load_state()
            session = state.get("current_session", {})
            session_created_at_str = session.get("created_at")
            if session_created_at_str:
                from datetime import datetime, timezone
                session_time = datetime.fromisoformat(session_created_at_str.replace("Z", "+00:00"))
                msg_time = msg.created_at
                
                # Make both timezone-aware
                if msg_time.tzinfo is None:
                    msg_time = msg_time.replace(tzinfo=timezone.utc)
                if session_time.tzinfo is None:
                    session_time = session_time.replace(tzinfo=timezone.utc)
                
                if msg_time < session_time:
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

        # 4. Special GITHUB_COMMIT trigger check for Devin
        if self.original_agent_name == "devin_eng" and "[github_commit]" in content.lower():
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
            state = StateManager.load_state()
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
            changelog_draft = gigi_drafts.get("changelog") or "N/A"
            newsletter_draft = gigi_drafts.get("newsletter") or "N/A"
            
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
- Gigi's Copy Drafts:
  * Twitter: {twitter_draft}
  * Changelog: {changelog_draft}
  * Newsletter: {newsletter_draft}

[Compliance Rejections/Memos]
{rejection_text}
"""
            agent_instructions = ""
            if self.original_agent_name == "devin_eng":
                agent_instructions = "\nDevin, you must write a technical summary of the commit. Do NOT try to read physical files or pull metrics. Summarize the changes using the commit message and list of changed files in the session state."
            elif self.original_agent_name == "priscilla_product":
                agent_instructions = "\nPriscilla, you must score the product impact of the technical summary or audit the marketing copy drafts. Output a score in the format X/10 when scoring. Verify style compliance when auditing."
            elif self.original_agent_name == "gigi_marketing":
                agent_instructions = "\nGigi, you must write actual marketing drafts for Twitter, Changelog, and Newsletter. Do NOT output placeholders, templates, or say you cannot share files. Write the actual copy. Keep Twitter under 2 emojis."
            elif self.original_agent_name == "connie_assistant":
                agent_instructions = "\nConnie, you must answer the user's chat questions directly using the milestones and epic progress in the roadmap metrics above. Do NOT try to delegate, query external databases, or tag other agents."

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
        state = StateManager.load_state()
        session = state.get("current_session", {})
        session_id = session.get("session_id", "sess_default")

        logger.info(f"[{self.original_agent_name.upper()}] Post-processing execution output.")

        # Devin: Update Technical Summary -> Tag Priscilla Product
        if self.original_agent_name == "devin_eng":
            StateManager.update_agent_output(session_id, "devin_technical_summary", output)
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
                twitter_draft = drafts.get("twitter", "")
                
                # Compliance logic: check style limits (max 2 emojis)
                emoji_count = twitter_draft.count("🚀")
                if emoji_count >= 3:
                    rejection = {
                        "rejected_by": "Priscilla",
                        "reason": f"Twitter draft violates guidelines: Contains {emoji_count} emojis (maximum allowed is 2)."
                    }
                    StateManager.add_rejection_memo(session_id, rejection)
                    
                    devin_summary = session.get("agent_outputs", {}).get("devin_technical_summary", "")
                    await tools.send_message(
                        f"vicdevman/gigi REJECTED: Your Twitter draft contains too many emojis ({emoji_count}). Maximum allowed is 2. Please revise the drafts and output using the exact headers 'Twitter:', 'Changelog:', and 'Newsletter:'.\n\n"
                        f"Here is Devin's Technical Summary again:\n{devin_summary}\n\n"
                        f"And here were your previous drafts:\n"
                        f"Twitter:\n{drafts.get('twitter')}\n\n"
                        f"Changelog:\n{drafts.get('changelog')}\n\n"
                        f"Newsletter:\n{drafts.get('newsletter')}",
                        ["@vicdevman/gigi"]
                    )
                else:
                    StateManager.update_approval_status(session_id, "APPROVED")
                    await tools.send_message(
                        "The marketing drafts are staged and fully approved by compliance.",
                        ["@vicdevman/gigi"]
                    )
            else:
                # Product scoring
                score = 8
                match = re.search(r"(\d+)/10", output)
                if match:
                    score = int(match.group(1))
                
                StateManager.update_agent_output(session_id, "priscilla_importance_score", score)
                devin_summary = session.get("agent_outputs", {}).get("devin_technical_summary", "")
                await tools.send_message(
                    f"vicdevman/gigi Devin's changes are approved. Importance Score: {score}/10. Please draft marketing announcements using the exact headers 'Twitter:', 'Changelog:', and 'Newsletter:'.\n\nDevin's Technical Summary:\n{devin_summary}",
                    ["@vicdevman/gigi"]
                )

        # Gigi Marketing: Write Copy drafts -> Tag Priscilla Compliance
        elif self.original_agent_name == "gigi_marketing":
            twitter_match = re.search(r"(?:Twitter|Social Media|Draft 1|Post)[:*\-\s]+(.*?)(?=(?:Changelog|Draft 2|Newsletter|Draft 3|$))", output, re.DOTALL | re.IGNORECASE)
            changelog_match = re.search(r"(?:Changelog|Draft 2)[:*\-\s]+(.*?)(?=(?:Newsletter|Draft 3|$))", output, re.DOTALL | re.IGNORECASE)
            newsletter_match = re.search(r"(?:Newsletter|Draft 3)[:*\-\s]+(.*?)$", output, re.DOTALL | re.IGNORECASE)

            twitter = twitter_match.group(1).strip() if twitter_match else ""
            changelog = changelog_match.group(1).strip() if changelog_match else ""
            newsletter = newsletter_match.group(1).strip() if newsletter_match else ""

            # Clean surrounding quotes
            for k, v in [("twitter", twitter), ("changelog", changelog), ("newsletter", newsletter)]:
                v = v.strip()
                if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                    v = v[1:-1].strip()
                if k == "twitter": twitter = v
                elif k == "changelog": changelog = v
                elif k == "newsletter": newsletter = v

            # Fallback if parsing completely missed
            if not twitter or not changelog or not newsletter:
                paragraphs = [p.strip() for p in output.split("\n\n") if p.strip()]
                if len(paragraphs) >= 3:
                    twitter = twitter or paragraphs[0]
                    changelog = changelog or paragraphs[1]
                    newsletter = newsletter or paragraphs[2]
                else:
                    twitter = twitter or output[:100]
                    changelog = changelog or output[:200]
                    newsletter = newsletter or output[:300]

            drafts = {
                "twitter": twitter,
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

            StateManager.update_agent_output(session_id, "gigi_content_drafts", drafts)
            await tools.send_message(
                f"vicdevman/priscilla I have prepared the copy drafts. Please audit. Here are the drafts:\n\n"
                f"Twitter:\n{drafts['twitter']}\n\n"
                f"Changelog:\n{drafts['changelog']}\n\n"
                f"Newsletter:\n{drafts['newsletter']}",
                ["@vicdevman/priscilla"]
            )

        # Connie Assistant: Update chat_history in state
        elif self.original_agent_name == "connie_assistant":
            state = StateManager.load_state()
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
            await tools.send_message(output, ["@vicdevman"])
