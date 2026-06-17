import os
import sys
import asyncio
from dotenv import load_dotenv
from shared.state_manager import StateManager
from band.client.rest import AsyncRestClient, ChatMessageRequest

async def main():
    # Load dotenv from agents/.env
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
    
    state = StateManager.load_state()
    room_id = state.get("room_id")
    if not room_id:
        print("ERROR: No active room ID found. The agent processes must be running and connected first.", file=sys.stderr)
        sys.exit(1)
        
    session = state.get("current_session", {})
    inputs = session.get("raw_inputs", {})
    commit_msg = inputs.get("commit_message", "No commit message provided")
    changed_files = inputs.get("changed_files", [])
    
    # Load connie_assistant credentials to send the trigger message (representing Connie coordinates)
    # If Connie credentials aren't found, we'll fall back to devin_eng
    sender_key = "connie_assistant"
    try:
        _, api_key = StateManager.load_configuration(sender_key)
    except Exception:
        sender_key = "devin_eng"
        try:
            _, api_key = StateManager.load_configuration(sender_key)
        except Exception as e:
            print(f"ERROR: Failed to load agent configuration for trigger: {e}", file=sys.stderr)
            sys.exit(1)
            
    # Load Devin's target agent_id for the mention tag
    try:
        devin_id, _ = StateManager.load_configuration("devin_eng")
    except Exception as e:
        print(f"ERROR: Failed to load Devin configuration: {e}", file=sys.stderr)
        sys.exit(1)
        
    rest_url = os.getenv("BAND_REST_URL", os.getenv("THENVOI_REST_URL", "https://app.band.ai/"))
    
    client = AsyncRestClient(api_key=api_key, base_url=rest_url)
    
    content = f"[GITHUB_COMMIT] New commit triggered:\nMessage: {commit_msg}\nFiles: {', '.join(changed_files)}\n\n@vicdevman/devin please review."
    
    message = ChatMessageRequest(
        content=content,
        mentions=[{
            "id": devin_id,
            "handle": "vicdevman/devin",
            "name": "Devin"
        }]
    )
    
    try:
        response = await client.agent_api_messages.create_agent_chat_message(
            chat_id=room_id,
            message=message
        )
        print(f"SUCCESS: Trigger message sent to room {room_id} from {sender_key}. Response: {response}")
    except Exception as e:
        print(f"ERROR: Failed to send trigger message: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
