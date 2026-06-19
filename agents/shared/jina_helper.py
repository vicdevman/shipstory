# agents/shared/jina_helper.py
import urllib.request
import urllib.error
import urllib.parse
import json
import logging

logger = logging.getLogger(__name__)

def scrape_page_with_jina(url: str) -> str:
    """
    Scrapes a webpage via Jina AI Reader (r.jina.ai) and returns clean markdown content.
    Automatically formats query with timestamp to bypass potential caching layers.
    """
    import time
    clean_url = url.strip()
    # Normalize protocol if missing
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = "https://" + clean_url
        
    jina_url = f"https://r.jina.ai/{clean_url}?t={int(time.time() * 1000)}"
    logger.info(f"[Jina Scraper] Directing scrape request to: {jina_url}")
    
    headers = {
        "Accept": "application/json",
        "X-Return-Format": "markdown",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        req = urllib.request.Request(
            jina_url,
            headers=headers,
            method="GET"
        )
        # 30 seconds timeout to handle slow competitor pages
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if isinstance(res_data, dict):
                # Jina returns { "data": { "content": "..." } } when JSON is accepted
                content = res_data.get("data", {}).get("content", "")
                if content:
                    return content
                return res_data.get("content", "") or str(res_data)
            return str(res_data)
    except Exception as e:
        logger.warning(f"[Jina Scraper] JSON request failed: {e}. Falling back to plain text request...")
        # Plain text fallback
        try:
            req_plain = urllib.request.Request(
                jina_url,
                headers={"User-Agent": headers["User-Agent"]},
                method="GET"
            )
            with urllib.request.urlopen(req_plain, timeout=30) as response:
                return response.read().decode("utf-8")
        except Exception as fallback_err:
            logger.error(f"[Jina Scraper] Critical failure scraping {url}: {fallback_err}")
            return f"Error: Failed to scrape page content via Jina Reader. {str(fallback_err)}"
