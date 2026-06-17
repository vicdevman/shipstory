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
    chat_history = session.get("chat_history", [])
    
    # Get last message from user
    user_messages = [msg for msg in chat_history if msg.get("sender") == "user"]
    if not user_messages:
        print("ERROR: No user messages found in chat history.", file=sys.stderr)
        sys.exit(1)
        
    last_user_msg = user_messages[-1].get("message", "")
    
    # Load connie_assistant credentials to get Connie's agent_id for the mention tag
    try:
        connie_id, _ = StateManager.load_configuration("connie_assistant")
    except Exception as e:
        print(f"ERROR: Failed to load Connie configuration: {e}", file=sys.stderr)
        sys.exit(1)
        
    # We use devin_eng api_key to send the message so it triggers Connie's WebSocket listener as an external message
    try:
        _, sender_api_key = StateManager.load_configuration("devin_eng")
    except Exception:
        try:
            _, sender_api_key = StateManager.load_configuration("connie_assistant")
        except Exception as e:
            print(f"ERROR: Failed to load sender configuration: {e}", file=sys.stderr)
            sys.exit(1)
            
    rest_url = os.getenv("BAND_REST_URL", os.getenv("THENVOI_REST_URL", "https://app.band.ai/"))
    client = AsyncRestClient(api_key=sender_api_key, base_url=rest_url)
    
    content = f"vicdevman/connie {last_user_msg}"
    
    message = ChatMessageRequest(
        content=content,
        mentions=[{
            "id": connie_id,
            "handle": "vicdevman/connie",
            "name": "Connie"
        }]
    )
    
    try:
        response = await client.agent_api_messages.create_agent_chat_message(
            chat_id=room_id,
            message=message
        )
        print(f"SUCCESS: Chat trigger sent to room {room_id}. Response: {response}")
    except Exception as e:
        print(f"ERROR: Failed to send chat message: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
