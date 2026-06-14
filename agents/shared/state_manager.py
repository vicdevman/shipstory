# agents/shared/state_manager.py
import json
import yaml
import os
from pathlib import Path

class StateManager:
    """Orchestrates loading configuration files and compiling dynamic Company Brain structures from markdown assets."""
    
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