# agents/vinci_design/agent.py
import asyncio
import logging
import os
from dotenv import load_dotenv
from shared.state_manager import StateManager
from band import Agent, AdapterFeatures, Emit
from shared.deterministic_adapter import DeterministicAgentAdapter

# Initialize clean logging outputs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    # Load env variables from your main agents/.env file
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

    # 1. Load our verified credentials dynamically out of the central YAML config
    try:
        agent_id, api_key = StateManager.load_configuration("vinci_design")
        logger.info(f"Successfully loaded Vinci credentials from configuration path. ID: {agent_id[:8]}...")
    except Exception as e:
        logger.error(f"Failed to resolve configuration keys: {e}")
        return

    # 2. Configure the Model Adapter Layer (using our OpenAI-compatible Hackathon endpoints)
    adapter = DeterministicAgentAdapter(
        agent_name="vinci_design",
        role="Art Director",
        goal="Extract metaphors from approved copy and generate clean, professional schematic graphic prompts or SVGs that align with the brand’s minimalist styling.",
        backstory="""You are an Art Director with a strong eye for minimalist and professional visual designs. You translate marketing concepts into clean, schematic illustrations and precise design prompts, avoiding cheesy or generic imagery.""",
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

    logger.info("Vinci Design Agent initialized. Establishing live connections to the Band room...")
    
    # 4. Spin up the long-running persistent listener socket
    await agent.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Process manually terminated by developer. Shutting down connection layers cleanly.")
