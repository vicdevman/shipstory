import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const timestamp = Date.now();
    const jinaUrl = `https://r.jina.ai/${cleanUrl}?t=${timestamp}`;

    console.log(`[Onboard API] Scraping via Jina: ${jinaUrl}`);
    
    let markdownContent = '';
    try {
      const jinaResponse = await fetch(jinaUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'markdown'
        },
        // Set timeout to 15 seconds
        signal: AbortSignal.timeout(15000)
      });

      if (!jinaResponse.ok) {
        const errText = await jinaResponse.text();
        throw new Error(`Jina response status: ${jinaResponse.status}. ${errText}`);
      }

      const resData = await jinaResponse.json();
      if (resData && resData.data && resData.data.content) {
        markdownContent = resData.data.content;
      } else if (resData && resData.content) {
        markdownContent = resData.content;
      } else {
        markdownContent = JSON.stringify(resData);
      }
    } catch (scrapeError: any) {
      console.warn(`[Onboard API] Jina Scraper failed: ${scrapeError.message}. Attempting simple fetch fallback...`);
      try {
        const fallbackRes = await fetch(jinaUrl, {
          signal: AbortSignal.timeout(15000)
        });
        if (fallbackRes.ok) {
          markdownContent = await fallbackRes.text();
        } else {
          throw new Error(`Fallback Jina response status: ${fallbackRes.status}`);
        }
      } catch (fallbackErr: any) {
        console.error(`[Onboard API] All Jina scraper attempts failed:`, fallbackErr);
        return NextResponse.json({
          error: `Failed to scrape website. Jina Reader returned: ${scrapeError.message}`
        }, { status: 500 });
      }
    }

    if (!markdownContent || !markdownContent.trim()) {
      return NextResponse.json({ error: 'Scraped content is empty.' }, { status: 500 });
    }

    // Truncate markdown to avoid prompt size limits
    const truncatedMarkdown = markdownContent.slice(0, 7000);

    // Groq LLM API Call to extract structured profile
    const groqKey = process.env.GROQ_API_KEY || '';
    if (!groqKey) {
      console.warn('[Onboard API] GROQ_API_KEY not configured. Returning raw scraped content...');
      return NextResponse.json({
        raw_markdown: truncatedMarkdown,
        message: 'Scraping succeeded, but Groq extraction is not configured.'
      });
    }

    console.log('[Onboard API] Requesting structured profile extraction from Groq...');
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const systemPrompt = `You are an expert growth marketing parser and copywriter. Extract the following startup context from the provided landing page markdown, and generate a high-fidelity, comprehensive Brand Voice and Copywriting Guidelines profile tailored to this startup's specific niche:
- name: The name of the startup.
- value_proposition: A concise 1-sentence value proposition detailing their core product benefit.
- target_persona: The main audience or users (e.g. Solo devs, lean founders, marketing teams).
- tone: Suggest a brand writing tone matching their site voice (e.g. bold, technical, minimalist).
- milestones: A JSON array of 1 to 2 active roadmap milestones or feature highlights inferred from the site.
- raw_brand_voice_constraints: A highly detailed markdown document representing their official Brand Voice and Guidelines. It MUST NOT be a generic template. It should detail what a successful founder in this startup's niche would DO and should NOT DO to write compelling, high-converting copy. Include:
  1. Core Niche Strategy: How to establish immediate trust with the target persona.
  2. Tone & Style Rules: E.g., authoritative, utility-focused, transparent, or creative.
  3. Actionable Dos: Clear guidelines on what works in this niche (e.g. state concrete benchmarks, explain engineering reality, use benefit-focused storytelling).
  4. Restricted Don'ts: Clear restrictions on what to avoid (e.g. never use vague buzzwords, limit emojis, avoid abstract hyperbole, restrict specific cliché phrases).

You MUST return ONLY a valid JSON object matching this schema. Do NOT wrap it in markdown backticks or include any conversational prefix/suffix:
{
  "name": "startup name",
  "value_proposition": "value proposition details",
  "target_persona": "target audience",
  "tone": "suggested tone",
  "milestones": ["milestone 1", "milestone 2"],
  "raw_brand_voice_constraints": "markdown content of brand voice constraints"
}`;

    try {
      const groqResponse = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here is the website markdown:\n\n${truncatedMarkdown}` }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!groqResponse.ok) {
        const text = await groqResponse.text();
        throw new Error(`Groq API response status: ${groqResponse.status}. ${text}`);
      }

      const completions = await groqResponse.json();
      const rawText = completions.choices?.[0]?.message?.content || '{}';
      
      let structuredProfile: any = {};
      try {
        structuredProfile = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error('[Onboard API] Failed to parse JSON from Groq text:', rawText);
        structuredProfile = {
          name: 'Extracted Startup',
          value_proposition: 'Parsed from scraped landing page content.',
          target_persona: 'Developers',
          tone: 'Professional',
          milestones: [],
          raw_brand_voice_constraints: '# Brand Guidelines\n- Focus on engineering details.\n- Avoid generic buzzwords.'
        };
      }

      return NextResponse.json({
        success: true,
        extracted_data: structuredProfile
      });
    } catch (llmError: any) {
      console.error('[Onboard API] Groq extraction call failed:', llmError);
      return NextResponse.json({
        success: true,
        extracted_data: {
          name: 'Scraped Startup',
          value_proposition: 'Website content scraped successfully. Complete manual setup below.',
          target_persona: 'Developers',
          tone: 'Minimalist',
          milestones: [],
          raw_brand_voice_constraints: '# Brand Guidelines\n- Focus on engineering details.\n- Avoid generic buzzwords.'
        },
        message: `Website scraped but LLM extraction failed: ${llmError.message}`
      });
    }
  } catch (error: any) {
    console.error('[Onboard API] Endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error in onboard extractor API' }, { status: 500 });
  }
}
