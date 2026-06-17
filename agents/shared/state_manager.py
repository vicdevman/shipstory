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

    _mongo_collection = None
    _mongo_initialized = False
    _mongo_client = None

    @classmethod
    def get_mongo_collection(cls):
        """Initializes and returns the MongoDB collection if URI is configured.
        Retries the connection if the previous attempt failed or client has gone stale.
        """
        # If we have a live collection already, do a quick health check
        if cls._mongo_initialized and cls._mongo_collection is not None:
            try:
                cls._mongo_client.admin.command('ping')
                return cls._mongo_collection
            except Exception:
                # Connection went stale — reset so we reconnect
                cls._mongo_initialized = False
                cls._mongo_collection = None
                cls._mongo_client = None

        if cls._mongo_initialized:
            # Previously attempted and confirmed no URI — skip
            return cls._mongo_collection

        cls._mongo_initialized = True
        uri = os.getenv("MONGDB_URI") or os.getenv("MONGODB_URI")
        if not uri:
            print("[StateManager] MongoDB URI environment variable not set. Using local JSON fallback.")
            return None

        try:
            from pymongo import MongoClient
            client = MongoClient(
                uri,
                serverSelectionTimeoutMS=15000,
                connectTimeoutMS=15000,
                socketTimeoutMS=30000,
                directConnection=False,
                retryWrites=True,
                retryReads=True,
                # Limit pool size per process to avoid overwhelming Atlas free tier
                maxPoolSize=3,
                minPoolSize=1,
                maxIdleTimeMS=45000,
            )
            client.admin.command('ping')
            db = client["shipstory"]
            cls._mongo_client = client
            cls._mongo_collection = db["company_brain"]
            print("[StateManager] Connected to MongoDB Atlas successfully.")
        except Exception as e:
            print(f"[StateManager] Failed to connect to MongoDB: {e}. Falling back to local JSON.")
            cls._mongo_collection = None
            cls._mongo_client = None
            # Reset so next call can retry
            cls._mongo_initialized = False

        return cls._mongo_collection

    @classmethod
    def save_local_state(cls, state: dict) -> None:
        """Helper to write state to the local JSON file."""
        cls.DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        # Avoid serializing MongoDB objects (like ObjectId) just in case
        serialized_state = json.loads(json.dumps(state, default=str))
        with open(cls.DB_FILE, "w", encoding="utf-8") as file:
            json.dump(serialized_state, file, indent=2)

    @classmethod
    def load_state(cls) -> dict:
        """Loads the current Company Brain state from MongoDB (with local JSON fallback)."""
        collection = cls.get_mongo_collection()
        if collection is not None:
            try:
                state = collection.find_one({"_id": "nexus_labs_brain"})
                if state:
                    return state
                else:
                    print("[StateManager] nexus_labs_brain document not found in MongoDB. Initializing state...")
                    state = cls.compile_dynamic_company_brain()
                    state["_id"] = "nexus_labs_brain"
                    collection.insert_one(state)
                    cls.save_local_state(state)
                    return state
            except Exception as e:
                print(f"[StateManager] Error reading from MongoDB: {e}. Falling back to local JSON.")

        if not cls.DB_FILE.exists():
            state = cls.compile_dynamic_company_brain()
            cls.save_local_state(state)
            return state
            
        with open(cls.DB_FILE, "r", encoding="utf-8") as file:
            try:
                return json.load(file)
            except Exception as e:
                print(f"[StateManager] Error reading local JSON file: {e}. Using compiled dynamic state.")
                return cls.compile_dynamic_company_brain()

    @classmethod
    def save_state(cls, state: dict) -> None:
        """Saves the Company Brain state back to MongoDB and synchronizes the local JSON file."""
        state["_id"] = "nexus_labs_brain"
        
        collection = cls.get_mongo_collection()
        if collection is not None:
            try:
                collection.replace_one({"_id": "nexus_labs_brain"}, state, upsert=True)
            except Exception as e:
                print(f"[StateManager] Error saving to MongoDB: {e}.")

        cls.save_local_state(state)

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

        # Extract structured fields from raw text assets where possible
        _name = "Nexus Labs"
        _value_prop = "Local-first, AI-powered knowledge management tool with sub-10ms peer-to-peer sync."
        _target_persona = "Developers, technical founders, power note-takers"
        _pitch_summary = str(pitch_data)[:300] if pitch_data else "N/A"

        # Parse milestones from milestone_data JSON
        _active_milestones = []
        _epic_progress = {}
        if isinstance(milestone_data, dict):
            target = milestone_data.get("active_milestone_target", "")
            if target:
                _active_milestones = [target]
            _epic_progress = milestone_data.get("epic_progress_percentages", {})

        # Build state with schema keys that match both the Next.js frontend
        # (page.tsx reads: name, value_proposition, target_persona, style_guide,
        #  pitch_deck_summary, active_milestones, epic_progress_percentages)
        # and the deterministic_adapter.py agent context injector.
        return {
            "company_metadata": {
                "name": _name,
                "value_proposition": _value_prop,
                "target_persona": _target_persona,
                "style_guide": {
                    "tone": "Minimalist, professional, developer-focused",
                    "restrictions": [
                        "Max 2 emojis per post",
                        "Avoid marketing jargon like 'revolutionizing'"
                    ]
                },
                "security_filters": {
                    "restricted_keywords": ["auth_key", "password", "vulnerability", "leak_test", "private_beta_v1"],
                    "allow_public_roadmap": False
                },
                # Keep raw assets for agent backstory injection
                "raw_brand_voice_constraints": brand_data,
                "security_clearance_level": "RESTRICTED"
            },
            "operational_assets": {
                "pitch_deck_summary": _pitch_summary,
                "active_milestones": _active_milestones,
                "epic_progress_percentages": _epic_progress,
                # Keep raw assets for agent context
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