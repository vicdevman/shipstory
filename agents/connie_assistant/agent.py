# agents/connie_assistant/agent.py
import asyncio
import logging
import os
from dotenv import load_dotenv
from shared.state_manager import StateManager
from band import Agent, AdapterFeatures, Emit
from band.adapters import CrewAIAdapter

# Initialize clean logging outputs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    # Load env variables from your main agents/.env file
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

    # 1. Load our verified credentials dynamically out of the central YAML config
    try:
        agent_id, api_key = StateManager.load_configuration("connie_assistant")
        logger.info(f"Successfully loaded Connie credentials from configuration path. ID: {agent_id[:8]}...")
    except Exception as e:
        logger.error(f"Failed to resolve configuration keys: {e}")
        return

    # 2. Configure the Model Adapter Layer (using our OpenAI-compatible Hackathon endpoints)
    adapter = CrewAIAdapter(
        model="gpt-4o", # Handled via OpenAI format layer
        role="Dual-Facing Operations Assistant",
        goal="Provide internal operations assistance, answer customer Q&As, and manage sanitized public channel communications.",
        backstory="""You are a highly capable Chief of Staff. You interact with developers internally to report system progress, and communicate with external users to answer product questions, always routing public replies through security compliance first.""",
        features=AdapterFeatures(emit={Emit.EXECUTION}),
        verbose=True
    )

    # 3. Instantiate the connection worker client bound to Band platform runtime
    agent = Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
        ws_url=os.getenv("BAND_WS_URL", os.getenv("THENVOI_WS_URL", "wss://app.band.ai/api/v1/socket/websocket")),
        rest_url=os.getenv("BAND_REST_URL", os.getenv("THENVOI_REST_URL", "https://app.band.ai/"))
    )

    logger.info("Connie Assistant Agent initialized. Establishing live connections to the Band room...")
    
    # 4. Spin up the long-running persistent listener socket
    await agent.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Process manually terminated by developer. Shutting down connection layers cleanly.")
