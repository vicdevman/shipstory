import os
from pathlib import Path

def load_env():
    # Load env variables from the shared .env file in the agents/ folder
    # Path(__file__) is this file (agents/shared/state_manager.py)
    # parent.parent is the agents/ directory
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip comments and empty lines
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    # Clean up quotes if present
                    val = val.strip().strip('"').strip("'")
                    os.environ[key.strip()] = val
    else:
        print(f"Warning: .env not found at {env_path}")

# Run load_env automatically when this module is imported
load_env()

class StateManager:
    def __init__(self):
        pass

    def get_api_key(self):
        return os.environ.get("BAND_API_KEY")
