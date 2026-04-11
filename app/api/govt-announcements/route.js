import { XMLParser } from 'fast-xml-parser';
import { groq } from '@/lib/groq';

const FALLBACK_ANNOUNCEMENTS = [
  {
    title: 'PM-KISAN 18th Installment Released',
    description: 'The 18th installment of PM-KISAN scheme has been released, benefiting over 9 crore farmer families across India with direct benefit transfer.',
    link: 'https://pib.gov.in',
    pubDate: new Date().toISOString(),
    farmerImpact: '₹2000 transferred to farmer accounts',
  },
  {
    title: 'MSP Hike Approved for Kharif Crops 2024',
    description: 'Cabinet Committee on Economic Affairs approves increase in Minimum Support Prices for all mandated Kharif crops for the marketing season.',
    link: 'https://pib.gov.in',
    pubDate: new Date().toISOString(),
    farmerImpact: 'Higher minimum price for your harvest',
  },
  {
    title: 'Digital Agriculture Mission Launched',
    description: 'Ministry of Agriculture launches Digital Agriculture Mission to create digital identities for farmers and digitize agricultural practices across the country.',
    link: 'https://pib.gov.in',
    pubDate: new Date().toISOString(),
    farmerImpact: 'Free digital ID for all farmers',
  },
];

function stripHtmlTags(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function GET() {
  try {
    // --- Fetch PIB RSS Feed ---
    const rssUrl = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3';
    const rssResponse = await fetch(rssUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'User-Agent': 'AgroLink/1.0',
      },
    });

    if (!rssResponse.ok) {
      throw new Error(`PIB fetch failed: ${rssResponse.status}`);
    }

    const xmlText = await rssResponse.text();

    // --- Parse XML ---
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
    });
    const parsed = parser.parse(xmlText);

    const items = parsed?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) {
      throw new Error('No items found in RSS feed');
    }

    // Extract latest 8 items
    const announcements = items.slice(0, 8).map((item) => ({
      title: stripHtmlTags(item.title || ''),
      description: stripHtmlTags(item.description || '').substring(0, 200),
      link: item.link || 'https://pib.gov.in',
      pubDate: item.pubDate || new Date().toISOString(),
    }));

    // --- AI Farmer Impact via Groq ---
    let impacts = [];

    if (groq) {
      try {
        const titles = announcements.map((a) => a.title).join('\n');

        const aiResponse = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `You are an agricultural expert helping Indian farmers understand government announcements. For each title below, write a simple 6-8 word "farmer impact" summary in plain English a rural farmer would understand.
Focus on: money, subsidies, crops, loans, insurance.
Return ONLY a JSON array, no explanation, no markdown:
[{"index": 0, "impact": "₹2000 subsidy for wheat farmers"}, ...]

Titles:
${titles}`,
            },
          ],
        });

        const raw = aiResponse.choices[0].message.content;
        impacts = JSON.parse(raw.replace(/```json|```/g, '').trim());
      } catch (e) {
        console.error('Groq AI error:', e.message);
        impacts = announcements.map((_, i) => ({
          index: i,
          impact: 'See full announcement',
        }));
      }
    } else {
      // No GROQ_API_KEY — skip AI step
      impacts = announcements.map((_, i) => ({
        index: i,
        impact: 'Government update for farmers',
      }));
    }

    // --- Merge impacts into announcements ---
    const enriched = announcements.map((item, i) => ({
      ...item,
      farmerImpact:
        impacts.find((x) => x.index === i)?.impact || 'Govt update for farmers',
    }));

    return Response.json({ announcements: enriched });
  } catch (error) {
    console.error('Govt announcements error:', error.message);
    // Return fallback announcements on any failure
    return Response.json({ announcements: FALLBACK_ANNOUNCEMENTS });
  }
}
