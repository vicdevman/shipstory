import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

def search_tavily(query: str) -> str:
    """
    Performs a web search via Tavily and returns a string summary of top results
    and a synthesized AI answer if available.
    """
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        logger.warning("[Tavily] TAVILY_API_KEY not found in environment.")
        return "Tavily API key not found in environment."
        
    url = "https://api.tavily.com/search"
    headers = {"Content-Type": "application/json"}
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "advanced", # advanced search depth for high-quality competitor scan
        "include_answer": True,
        "max_results": 5
    }
    
    try:
        logger.info(f"[Tavily] Executing supercharged search query: {query}")
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            answer = res_data.get("answer")
            results = res_data.get("results", [])
            
            output_blocks = []
            if answer:
                output_blocks.append(f"Synthesized Market Intelligence Answer:\n{answer}")
                
            formatted_results = []
            for r in results[:3]:
                formatted_results.append(f"- Title: {r.get('title')}\n  URL: {r.get('url')}\n  Snippet: {r.get('content')}")
            
            if formatted_results:
                output_blocks.append("Top Web References:\n" + "\n".join(formatted_results))
                
            return "\n\n".join(output_blocks) if output_blocks else "No competitor intelligence results found."
    except Exception as e:
        logger.error(f"[Tavily] Search request failed: {e}")
        return f"Error executing search: {str(e)}"
