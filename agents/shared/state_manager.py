# agents/shared/state_manager.py
import json
import yaml
import os
from pathlib import Path

class StateManager:
    """Orchestrates loading configuration files and compiling dynamic Company Brain structures from markdown assets."""
    
    DB_FILE = Path(__file__).resolve().parent / "company_brain_db.json"
    
    @staticmethod
    def load_configuration(agent_key: str) -> tuple[str, str]:
        """Reads agent_config.yaml and returns a tuple of (agent_id, api_key)."""
        config_path = Path(__file__).resolve().parents[1] / "agent_config.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file missing at: {config_path}")
            
        with open(config_path, "r") as file:
            config_data = yaml.safe_load(file)
            
        agent_section = config_data.get(agent_key)
        if not agent_section:
            raise KeyError(f"Configuration block '{agent_key}' missing from agent_config.yaml")
            
        return agent_section.get("agent_id"), agent_section.get("api_key")

    @classmethod
    def load_state(cls) -> dict:
        """Loads the current Company Brain state from the JSON database file."""
        if not cls.DB_FILE.exists():
            # Fallback compile and persist if database file is missing
            state = cls.compile_dynamic_company_brain()
            cls.save_state(state)
            return state
            
        with open(cls.DB_FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    @classmethod
    def save_state(cls, state: dict) -> None:
        """Saves the Company Brain state back to the JSON database file."""
        # Ensure parent directory exists
        cls.DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(cls.DB_FILE, "w", encoding="utf-8") as file:
            json.dump(state, file, indent=2)

    @classmethod
    def update_agent_output(cls, session_id: str, agent_key: str, output_data: any) -> None:
        """Updates a specific agent's output in the current session state."""
        state = cls.load_state()
        state["current_session"]["session_id"] = session_id
        state["current_session"]["agent_outputs"][agent_key] = output_data
        cls.save_state(state)

    @classmethod
    def add_rejection_memo(cls, session_id: str, rejection_data: dict) -> None:
        """Appends a rejection critique memo to the current session state."""
        state = cls.load_state()
        state["current_session"]["session_id"] = session_id
        if "rejections_and_memos" not in state["current_session"]:
            state["current_session"]["rejections_and_memos"] = []
        state["current_session"]["rejections_and_memos"].append(rejection_data)
        cls.save_state(state)

    @classmethod
    def update_approval_status(cls, session_id: str, status: str) -> None:
        """Updates the session approval status."""
        state = cls.load_state()
        state["current_session"]["session_id"] = session_id
        state["current_session"]["agent_outputs"]["approval_status"] = status
        cls.save_state(state)

    @classmethod
    def initialize_new_session(cls, session_id: str, trigger_source: str, raw_inputs: dict) -> dict:
        """Initializes a brand new session with default empty states in the database."""
        from datetime import datetime, timezone
        state = cls.load_state()
        state["current_session"] = {
            "session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "trigger_source": trigger_source,
            "status": "PROCESSING",
            "raw_inputs": raw_inputs,
            "agent_outputs": {
                "devin_technical_summary": None,
                "priscilla_importance_score": None,
                "gigi_content_drafts": {
                  "twitter": None,
                  "changelog": None,
                  "newsletter": None
                },
                "approval_status": "PENDING"
            },
            "rejections_and_memos": []
        }
        cls.save_state(state)
        return state

    @staticmethod
    def compile_dynamic_company_brain() -> dict:
        """Reads text and markdown assets to assemble an on-demand, flexible Company Brain dictionary payload."""
        template_dir = Path(__file__).resolve().parent / "company_profile_templates"
        
        # Define secure fallbacks if configuration files do not exist
        brand_data = "Default corporate profile"
        prd_data = "Default roadmap metrics"
        milestone_data = {}
        pitch_data = "Seed phase startup context"
        
        if (template_dir / "brand_guidelines.txt").exists():
            brand_data = (template_dir / "brand_guidelines.txt").read_text()
            
        if (template_dir / "product_requirement_document.md").exists():
            prd_data = (template_dir / "product_requirement_document.md").read_text()
            
        if (template_dir / "current_milestones.json").exists():
            with open(template_dir / "current_milestones.json", "r") as f:
                milestone_data = json.load(f)
                
        if (template_dir / "pitch_deck_raw.txt").exists():
            pitch_data = (template_dir / "pitch_deck_raw.txt").read_text()

        # Build our dynamic multi-agent context state canvas
        return {
            "company_metadata": {
                "raw_brand_voice_constraints": brand_data,
                "security_clearance_level": "RESTRICTED"
            },
            "operational_assets": {
                "active_prd_epics": prd_data,
                "milestone_tracking": milestone_data,
                "investor_pitch_deck_baseline": pitch_data
            },
            "current_session": {
                "status": "INGRESS_INITIALIZED",
                "trigger_source": "MANUAL_PULL",
                "agent_outputs": {},
                "rejections_and_memos": []
            },
            "evolutionary_feedback_loop": {
                "incoming_community_signals": [],
                "active_recommendations": []
            }
        }