# agents/shared/llm_provider.py
import os
import logging
from crewai import LLM

logger = logging.getLogger(__name__)

def get_llm(agent_name: str) -> LLM:
    """
    Abstractions layer for resolving LLM configurations from agents/.env file.
    Priority order:
    1. Agent-specific provider selection (e.g. DEVIN_PROVIDER, GIGI_PROVIDER)
    2. AI/ML API (Primary)
    3. Featherless API (Secondary/Fallback)
    4. Groq API (Fallback)
    5. OpenAI (Fallback)
    """
    # 1. Determine provider from env
    provider_env_var = f"{agent_name.upper()}_PROVIDER"  # e.g. DEVIN_PROVIDER
    # Strip "_ENG" or "_MARKETING" suffix from agent name to match env vars
    clean_name = agent_name.replace("_eng", "").replace("_marketing", "").replace("_product", "").replace("_assistant", "").replace("_research", "").replace("_design", "")
    provider_env_var_clean = f"{clean_name.upper()}_PROVIDER"
    
    provider = os.getenv(provider_env_var_clean) or os.getenv(provider_env_var) or "aiml"
    provider = provider.lower()
    
    # 2. Try the primary selected provider, fallback to others in priority order
    providers_to_try = [provider]
    for p in ["aiml", "featherless", "groq", "openai"]:
        if p not in providers_to_try:
            providers_to_try.append(p)
            
    for p in providers_to_try:
        api_key = None
        base_url = None
        model = None
        
        if p == "aiml":
            api_key = os.getenv("AIML_API_KEY")
            base_url = os.getenv("AIML_API_BASE", "https://api.aimlapi.com/v1")
            model = os.getenv("AIML_MODEL", "gpt-4o")
        elif p == "featherless":
            api_key = os.getenv("FEATHERLESS_API_KEY")
            base_url = os.getenv("FEATHERLESS_API_BASE", "https://api.featherless.ai/v1")
            model = os.getenv("FEATHERLESS_MODEL", "meta-llama/Meta-Llama-3.1-70B-Instruct")
        elif p == "groq":
            api_key = os.getenv("GROQ_API_KEY")
            base_url = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")
            model = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
        elif p == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            base_url = os.getenv("OPENAI_API_BASE")
            model = "gpt-4o"
            
        # Verify if api_key is configured and not a placeholder template
        if api_key and not any(placeholder in api_key.lower() for placeholder in ["your_key", "your-key", "your_api_key", "sk-your", "gsk_your"]):
            logger.info(f"[{agent_name.upper()}] Resolved provider: {p.upper()} (model: {model})")
            
            # CrewAI LLM requires passing base_url, api_key, model.
            # Use custom_openai prefix for custom compatible API endpoints to route properly in LiteLLM
            if p == "openai":
                litellm_model = f"openai/{model}"
            else:
                litellm_model = f"custom_openai/{model}"
                
            try:
                return LLM(
                    model=litellm_model,
                    base_url=base_url,
                    api_key=api_key
                )
            except Exception as e:
                logger.error(f"[{agent_name.upper()}] Failed to create LLM for provider {p}: {e}. Trying fallback...")
                
    # Ultimate fallback
    logger.warning(f"[{agent_name.upper()}] No valid LLM configuration found in env. Falling back to default gpt-4o.")
    return LLM(model="gpt-4o")
