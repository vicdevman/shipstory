smaple of jina used in js 

export async function scrapePage(url) {

  const timestamp = Date.now()

  try {
    console.log('Scraping with Jina AI:', url);
    const jinaUrl = `https://r.jina.ai/${url}?t=${timestamp}`;

    const response = await axios.get(jinaUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown'
      },
      timeout: 30000
    });

    return {
      url,
      data: response.data,
      scrapedAt: new Date().toISOString(),
      method: 'jina'
    };

  } catch (error) {
    console.error('Scraping failed:', error);
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

taht works, 


ALSO I SUGGEST WE POWER UP MARSHALL TO INCORPORATE JINA SCRAPER ASWELL. TO GO AS FAR AS SCRAPING WEBSITES DURINGN ITS RESAERCH. ALSO iD LIEK TO SEE Marshall seriosly in action telling me what hes doing what tool hes using now that it will have a scarper tool i want to knwo what propt hes searchin tavily with and what tool what website ehs scrapign i want to see that as hes logs whilen working and after on teh frontend clean ux 


ao i want the agent to have a  plan that looks likt  thsi 

## Phase 1: Tactical Analysis (Competitive Intelligence)
**Primary Goal**: Rapidly map the existing competitive landscape using real-time data.

1.  **Site Intelligence Scanning**: Perform deep-structure scraping of identified competitor websites (e.g., `acme-widgets.com`) to identify:
    * **Pricing Models**: Subscription tiers, one-time costs, feature gating, and freemium entry points.
    * **SEO Content Strategy**: Analyze top-ranking landing pages, blog topics, and keyword targeting via:
        * **Tavily Search**: Identify high-traffic, low-difficulty content gaps.
        * **Jina Scraper (NEW)**: Extract full MD body for in-depth analysis of product features and hidden CTAs.
2.  **Product Valuation Scorecard**: Compare the feature set, UX quality, and pricing of competitors against the baseline product to generate a quantitative `score`.
3.  **Roadmap Pivoting**: Based on the gap between the current product and the competitive landscape, generate specific, actionable recommendations for product pivots or feature prioritization.