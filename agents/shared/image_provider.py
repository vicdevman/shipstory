import os
import json
import logging
import urllib.request
import urllib.error
from shared.cloudinary_helper import upload_image_to_cloudinary

logger = logging.getLogger(__name__)

def generate_campaign_image(prompt: str) -> str | None:
    """
    Generates a campaign illustration using the configured provider.
    Specifically supports flux-2-pro model and direct payload formatting for AIML API.
    """
    provider = os.getenv("VINCI_PROVIDER") or os.getenv("AIML_PROVIDER") or "aiml"
    provider = provider.lower()
    
    providers_to_try = [provider]
    for p in ["aiml", "openai"]:
        if p not in providers_to_try:
            providers_to_try.append(p)
            
    for p in providers_to_try:
        api_key = None
        base_url = None
        
        if p == "aiml":
            api_key = os.getenv("AIML_API_KEY")
            # Directly use the working endpoint domain from the user's sample
            base_url = "https://ai.aimlapi.com"
        elif p == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            base_url = "https://api.openai.com/v1"
            
        if api_key and not any(placeholder in api_key.lower() for placeholder in ["your_key", "your-key", "your_api_key", "sk-your"]):
            logger.info(f"[Vinci Image Gen] Triggering image generation via: {p.upper()}")
            
            # Format endpoint URL
            if p == "aiml":
                endpoint = f"{base_url}/v1/images/generations"
                payload = {
                    "model": "flux-2-pro",
                    "prompt": prompt,
                    "image_size": "square",
                    "output_format": "png",
                    "seed": 42,
                    "enable_safety_checker": True,
                    "safety_tolerance": "2"
                }
            else:
                endpoint = f"{base_url}/images/generations"
                payload = {
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024"
                }
                
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            try:
                print(f">>> [VINCI IMAGE GEN] Sending request to {p.upper()} ({endpoint})...")
                req = urllib.request.Request(
                    endpoint,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                # flux-2-pro can take up to 90s on cold start
                with urllib.request.urlopen(req, timeout=90) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    
                    # Robust parsing for multiple potential format styles (OpenAI standard vs. custom Flux returns)
                    raw_url = None
                    data_list = res_data.get("data", [])
                    if data_list and isinstance(data_list, list) and data_list[0].get("url"):
                        raw_url = data_list[0].get("url")
                    elif res_data.get("url"):
                        raw_url = res_data.get("url")
                    elif isinstance(res_data.get("images"), list) and len(res_data["images"]) > 0:
                        raw_url = res_data["images"][0]
                        
                    if raw_url:
                        logger.info(f"[Vinci Image Gen] Image successfully generated: {raw_url}")
                        print(f">>> [VINCI IMAGE GEN] Image generated: {raw_url}")
                        # Attempt Cloudinary upload for long-term persistence; fall back to raw URL on any failure
                        try:
                            cloudinary_url = upload_image_to_cloudinary(raw_url)
                            print(f">>> [VINCI IMAGE GEN] Final URL (Cloudinary or fallback): {cloudinary_url}")
                            return cloudinary_url
                        except Exception as cloud_err:
                            logger.warning(f"[Vinci Image Gen] Cloudinary upload failed ({cloud_err}), returning raw URL.")
                            print(f">>> [VINCI IMAGE GEN] Cloudinary failed, using raw AIML URL: {raw_url}")
                            return raw_url
                    else:
                        err_msg = f"[Vinci Image Gen] Image generation response is missing image URL: {res_data}"
                        logger.error(err_msg)
                        print(f">>> [VINCI IMAGE GEN] ERROR: {err_msg}")
            except Exception as e:
                err_msg = f"[Vinci Image Gen] Failed to generate image with provider {p}: {e}. Trying fallback..."
                logger.error(err_msg)
                print(f">>> [VINCI IMAGE GEN] ERROR: {err_msg}")
                
    logger.error("[Vinci Image Gen] All image generation providers failed.")
    print(">>> [VINCI IMAGE GEN] CRITICAL: All providers failed. No image generated.")
    return None
