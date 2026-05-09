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

  // Try Shopify JSON API first for known Shopify domains
  let result: ScrapeResult;
  if (isShopifyDomain(domain, url)) {
    result = await scrapeShopify(url);
    if (!result.success) {
      // Fall back to OG scrape if Shopify API fails
      result = await scrapeOG(url);
    }
  } else {
    result = await scrapeOG(url);
  }

  // Log attempt
  const supabase = createServiceClient();
  await supabase.from("scrape_logs").insert({
    // @ts-ignore
    user_id: (session.user as any).id ?? null,
    url,
    domain,
    success: result.success,
    fields_found: result.fields_found,
    error_message: result.error ?? null,
  });

  return NextResponse.json(result);
}

// ── Shopify detection ──────────────────────────────────────────
// Known Shopify-hosted domains + any URL with /products/ path
function isShopifyDomain(domain: string, url: string): boolean {
  const knownShopify = [
    "sephora.com",
    "skin1004.com",
    "glossier.com",
    "allbirds.com",
    "gymshark.com",
    "fashionnova.com",
    "kyliecosmetics.com",
    "taylorstitch.com",
    "bombas.com",
    "chubbiesshorts.com",
  ];
  if (knownShopify.some(d => domain.includes(d))) return true;
  // Any URL with /products/ in the path is likely Shopify
  try {
    const path = new URL(url).pathname;
    return path.includes("/products/");
  } catch {
    return false;
  }
}

// ── Shopify JSON API scraper ────────────────────────────────────
async function scrapeShopify(url: string): Promise<ScrapeResult> {
  const fields_found: string[] = [];
  try {
    const parsed = new URL(url);
    // Extract handle from path e.g. /products/some-product-handle?variant=123
    const pathMatch = parsed.pathname.match(/\/products\/([^/?]+)/);
    if (!pathMatch) return { success: false, fields_found, error: "Could not extract product handle" };

    const handle = pathMatch[1];
    const jsonUrl = `${parsed.origin}/products/${handle}.json`;

    const response = await fetch(jsonUrl, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return { success: false, fields_found, error: `Shopify API HTTP ${response.status}` };

    const data = await response.json();
    const product = data.product;
    if (!product) return { success: false, fields_found, error: "No product in response" };

    // Check if a specific variant is requested
    const variantId = parsed.searchParams.get("variant");
    let price: string | undefined;
    let variantTitle: string | undefined;

    if (variantId && product.variants) {
      const variant = product.variants.find((v: any) => String(v.id) === variantId);
      if (variant) {
        price = variant.price;
        // Only add variant title if it's not "Default Title"
        if (variant.title && variant.title !== "Default Title") {
          variantTitle = variant.title;
        }
      }
    }

    // Fall back to first variant price
    if (!price && product.variants?.[0]) {
      price = product.variants[0].price;
    }

    const name = product.title ?? undefined;
    const brand = product.vendor ?? undefined;
    const image = product.images?.[0]?.src ?? undefined;
    const formattedPrice = price ? formatPrice(price) : undefined;

    if (name) fields_found.push("name");
    if (formattedPrice) fields_found.push("price");
    if (brand) fields_found.push("brand");
    if (image) fields_found.push("image");

    return {
      success: !!(name && formattedPrice),
      name: name ? decodeHtmlEntities(name) : undefined,
      brand: brand ? decodeHtmlEntities(brand) : undefined,
      price_display: formattedPrice,
      image_url: image,
      note: variantTitle,
      fields_found,
    };
  } catch (err: any) {
    return { success: false, fields_found, error: err?.message ?? "Shopify scrape failed" };
  }
}

// ── OG tag scraper (improved headers) ──────────────────────────
async function scrapeOG(url: string): Promise<ScrapeResult> {
  const fields_found: string[] = [];
  try {
    const response = await fetch(url, {
      headers: {
        // Full Chrome-like headers to reduce bot detection
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { success: false, fields_found, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    const name = extractMeta(html, ["og:title", "twitter:title", "title"]);
    const price = extractMeta(html, ["product:price:amount", "og:price:amount", "twitter:data1"]) ?? extractPriceFromSchema(html);
    const brand = extractMeta(html, ["og:site_name", "product:brand"]);
    const image = extractMeta(html, ["og:image", "twitter:image"]);

    if (name) fields_found.push("name");
    if (price) fields_found.push("price");
    if (brand) fields_found.push("brand");
    if (image) fields_found.push("image");

    return {
      success: !!(name && price),
      name: name ? decodeHtmlEntities(name) : undefined,
      price_display: price ? formatPrice(price) : undefined,
      brand: brand ? decodeHtmlEntities(brand) : undefined,
      image_url: image ?? undefined,
      fields_found,
    };
  } catch (err: any) {
    return { success: false, fields_found, error: err?.message ?? "Unknown error" };
  }
}

function extractMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const ogMatch = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escapeRegex(name)}["'][^>]+content=["']([^"']+)["']`, "i")
    ) ?? html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegex(name)}["']`, "i")
    );
    if (ogMatch?.[1]) return ogMatch[1].trim();
    if (name === "title") {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) return titleMatch[1].trim();
    }
  }
  return null;
}

function extractPriceFromSchema(html: string): string | null {
  try {
    const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of matches) {
      try {
        const schema = JSON.parse(match[1]);
        const schemas = Array.isArray(schema) ? schema : [schema];
        for (const s of schemas) {
          const price = s?.offers?.price ?? s?.offers?.[0]?.price ?? s?.price;
          if (price != null) return String(price);
        }
      } catch { continue; }
    }
    return null;
  } catch {
    return null;
  }
}

function formatPrice(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return raw;
  return `$${num.toFixed(2)}`;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .trim();
}

