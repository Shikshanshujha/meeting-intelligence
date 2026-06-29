import { createServiceClient } from "@/lib/auth/demo-users";
import type { EnrichmentContext, EnrichmentData } from "./types";

function normalizeWebsite(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.origin;
  } catch {
    return url;
  }
}

async function getCached(website: string): Promise<EnrichmentData | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("enrichment_cache")
      .select("data")
      .eq("website", website)
      .maybeSingle();

    if (!data?.data) return null;
    return data.data as EnrichmentData;
  } catch {
    return null;
  }
}

async function setCache(website: string, data: EnrichmentData) {
  try {
    const supabase = createServiceClient();
    await supabase.from("enrichment_cache").upsert({
      website,
      data,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("enrichment cache write:", error);
  }
}

async function scrapeWithFirecrawl(url: string): Promise<EnrichmentData | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error("Firecrawl error:", response.status);
      return null;
    }

    const payload = await response.json();
    const markdown: string = payload?.data?.markdown ?? "";
    const excerpt = markdown.slice(0, 1200);

    return {
      company_summary: excerpt.slice(0, 400) || `Website content from ${url}`,
      industry: inferIndustry(excerpt),
      buying_signals: inferBuyingSignals(excerpt),
    };
  } catch (error) {
    console.error("Firecrawl scrape failed:", error);
    return null;
  }
}

function inferIndustry(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/saas|software|platform/.test(lower)) return "B2B SaaS";
  if (/ecommerce|d2c|shopify|retail/.test(lower)) return "D2C";
  if (/agency|marketing services/.test(lower)) return "Agency";
  if (/fintech|payments|bank/.test(lower)) return "Fintech";
  if (/healthcare|clinical|medical/.test(lower)) return "Healthcare";
  return undefined;
}

function inferBuyingSignals(text: string): string[] {
  const signals: string[] = [];
  const lower = text.toLowerCase();
  if (/scale|growth|expand/.test(lower)) signals.push("Growth-oriented positioning");
  if (/seo|content|blog/.test(lower)) signals.push("Content/SEO focus on site");
  if (/customers|clients|trusted by/.test(lower)) signals.push("Social proof on website");
  return signals.slice(0, 3);
}

export async function enrichCompanyWebsite(
  website: string
): Promise<EnrichmentContext | null> {
  const normalized = normalizeWebsite(website);
  const cached = await getCached(normalized);
  if (cached) return cached;

  const scraped = await scrapeWithFirecrawl(normalized);
  if (!scraped) return null;

  await setCache(normalized, scraped);
  return scraped;
}
