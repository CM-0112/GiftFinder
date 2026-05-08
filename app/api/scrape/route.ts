import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/supabase/server";
import type { ScrapeResult } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const result = await scrapeUrl(url);

  // Log the attempt regardless of outcome (required by PRD)
  const supabase = createServiceClient();
  await supabase.from("scrape_logs").insert({
    // @ts-ignore — id attached in session callback
    user_id: session.user.id ?? null,
    url,
    domain,
    success: result.success,
    fields_found: result.fields_found,
    error_message: result.error ?? null,
  });

  return NextResponse.json(result);
}

async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const fields_found: string[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        // Mimic a real browser to reduce bot-detection rejections
        "User-Agent":
          "Mozilla/5.0 (compatible; WishlistBot/1.0; +https://yourapp.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!response.ok) {
      return { success: false, fields_found, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    const name = extractMeta(html, [
      'og:title',
      'twitter:title',
      'title', // fallback to <title> tag
    ]);

    const price = extractMeta(html, [
      'product:price:amount',
      'og:price:amount',
      'twitter:data1',
    ]) ?? extractPriceFromSchema(html);

    const brand = extractMeta(html, [
      'og:site_name',
      'product:brand',
    ]);

    const image = extractMeta(html, [
      'og:image',
      'twitter:image',
    ]);

    if (name) fields_found.push("name");
    if (price) fields_found.push("price");
    if (brand) fields_found.push("brand");
    if (image) fields_found.push("image");

    const success = fields_found.includes("name") && fields_found.includes("price");

    return {
      success,
      name: name ?? undefined,
      price_display: price ? formatPrice(price) : undefined,
      brand: brand ?? undefined,
      image_url: image ?? undefined,
      fields_found,
    };
  } catch (err: any) {
    return {
      success: false,
      fields_found,
      error: err?.message ?? "Unknown error",
    };
  }
}

// Extract a meta tag value — tries multiple property names in order
function extractMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    // og:, twitter:, product: meta tags
    const ogMatch = html.match(
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escapeRegex(name)}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    ) ?? html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegex(name)}["']`,
        "i"
      )
    );

    if (ogMatch?.[1]) return ogMatch[1].trim();

    // <title> tag fallback
    if (name === "title") {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) return titleMatch[1].trim();
    }
  }
  return null;
}

// Attempt to extract price from JSON-LD schema markup
function extractPriceFromSchema(html: string): string | null {
  try {
    const schemaMatch = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (!schemaMatch) return null;
    const schema = JSON.parse(schemaMatch[1]);
    const price =
      schema?.offers?.price ??
      schema?.offers?.[0]?.price ??
      schema?.price;
    return price != null ? String(price) : null;
  } catch {
    return null;
  }
}

// Format a raw price string into a display value e.g. "45.99" → "$45.99"
function formatPrice(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return raw;
  return `$${num.toFixed(2)}`;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
