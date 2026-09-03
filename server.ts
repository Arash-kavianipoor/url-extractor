import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    ),
  });
});

// Helper to sanitize/normalize URLs
function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

// Scrape URL or parse provided HTML
app.post("/api/scrape", async (req, res) => {
  try {
    const { url, rawHtml, customUserAgent, headers: customHeaders } = req.body;

    let html = "";
    let finalUrl = url || "";
    let statusCode = 200;
    let contentType = "text/html";
    let contentLength = 0;
    let responseTimeMs = 0;
    let responseHeaders: Record<string, string> = {};

    if (rawHtml) {
      html = rawHtml;
      contentLength = Buffer.byteLength(rawHtml, "utf-8");
      finalUrl = url || "https://local-snippet.preview";
    } else {
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "A valid URL is required" });
      }

      let parsedTargetUrl: URL;
      try {
        let normalized = url.trim();
        if (!/^https?:\/\//i.test(normalized)) {
          normalized = "https://" + normalized;
        }
        parsedTargetUrl = new URL(normalized);
        finalUrl = parsedTargetUrl.href;
      } catch (err: any) {
        return res.status(400).json({ error: `Invalid URL format: ${err?.message || "Invalid URL"}` });
      }

      const defaultUserAgent =
        customUserAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const fetchHeaders: Record<string, string> = {
          "User-Agent": defaultUserAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          ...(customHeaders || {}),
        };

        const response = await fetch(finalUrl, {
          headers: fetchHeaders,
          redirect: "follow",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseTimeMs = Date.now() - startTime;
        statusCode = response.status;
        contentType = response.headers.get("content-type") || "text/html";
        finalUrl = response.url || finalUrl;

        response.headers.forEach((val, key) => {
          if (["content-type", "server", "date", "content-length", "etag", "cache-control"].includes(key.toLowerCase())) {
            responseHeaders[key] = val;
          }
        });

        html = await response.text();
        contentLength = Buffer.byteLength(html, "utf-8");
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        return res.status(502).json({
          error: `Failed to fetch URL: ${fetchErr?.name === "AbortError" ? "Request timed out after 20 seconds" : fetchErr.message}`,
        });
      }
    }

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $("title").text().trim() || $('meta[property="og:title"]').attr("content") || "";
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";
    const canonical = $('link[rel="canonical"]').attr("href") || "";
    const robots = $('meta[name="robots"]').attr("content") || "";
    const lang = $("html").attr("lang") || "en";

    // Favicon
    let favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      "/favicon.ico";
    favicon = resolveUrl(favicon, finalUrl);

    // OpenGraph & Twitter
    const openGraph: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
      const prop = $(el).attr("property");
      const content = $(el).attr("content");
      if (prop && content) openGraph[prop] = content;
    });

    const twitterCard: Record<string, string> = {};
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr("name");
      const content = $(el).attr("content");
      if (name && content) twitterCard[name] = content;
    });

    // JSON-LD schema
    const jsonLd: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).html()?.trim();
        if (text) {
          jsonLd.push(JSON.parse(text));
        }
      } catch {
        // ignore malformed JSON-LD
      }
    });

    // Headings
    const headings: Array<{ level: string; text: string }> = [];
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) {
        headings.push({
          level: (el as any).name || (el as any).tagName || "h",
          text: text.slice(0, 200),
        });
      }
    });

    // Links (Top 150)
    const links: Array<{ text: string; href: string; isExternal: boolean }> = [];
    const baseHost = new URL(finalUrl).host;
    $("a[href]").each((_, el) => {
      if (links.length >= 150) return;
      const hrefAttr = $(el).attr("href") || "";
      if (!hrefAttr || hrefAttr.startsWith("javascript:") || hrefAttr.startsWith("#")) return;

      const fullHref = resolveUrl(hrefAttr, finalUrl);
      let isExternal = false;
      try {
        isExternal = new URL(fullHref).host !== baseHost;
      } catch {
        isExternal = false;
      }

      const linkText = $(el).text().replace(/\s+/g, " ").trim() || $(el).attr("title") || fullHref;
      links.push({
        text: linkText.slice(0, 100),
        href: fullHref,
        isExternal,
      });
    });

    // Images (Top 100)
    const images: Array<{ src: string; alt: string; dimensions?: string }> = [];
    $("img").each((_, el) => {
      if (images.length >= 100) return;
      const srcAttr = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("srcset") || "";
      if (!srcAttr || srcAttr.startsWith("data:")) return;

      const fullSrc = resolveUrl(srcAttr.split(" ")[0], finalUrl);
      const alt = $(el).attr("alt") || "";
      const width = $(el).attr("width");
      const height = $(el).attr("height");
      const dimensions = width && height ? `${width}x${height}` : undefined;

      images.push({
        src: fullSrc,
        alt: alt.slice(0, 120),
        dimensions,
      });
    });

    // Tables
    const tables: Array<{ headers: string[]; rows: string[][] }> = [];
    $("table").each((_, tbl) => {
      if (tables.length >= 10) return;
      const headers: string[] = [];
      $(tbl)
        .find("th")
        .each((_, th) => {
          headers.push($(th).text().replace(/\s+/g, " ").trim());
        });

      const rows: string[][] = [];
      $(tbl)
        .find("tr")
        .each((_, tr) => {
          const cells: string[] = [];
          $(tr)
            .find("td")
            .each((_, td) => {
              cells.push($(td).text().replace(/\s+/g, " ").trim());
            });
          if (cells.length > 0) rows.push(cells);
        });

      if (rows.length > 0 || headers.length > 0) {
        tables.push({ headers, rows: rows.slice(0, 50) });
      }
    });

    // Element counts
    const stats = {
      h1: $("h1").length,
      h2: $("h2").length,
      h3: $("h3").length,
      paragraphs: $("p").length,
      links: $("a[href]").length,
      images: $("img").length,
      tables: $("table").length,
      forms: $("form").length,
      scripts: $("script").length,
      stylesheets: $('link[rel="stylesheet"]').length,
    };

    // Clean text preview
    // Clone and remove scripts/styles for text extraction
    const text$ = cheerio.load(html);
    text$("script, style, noscript, svg, iframe").remove();
    const cleanText = text$("body").text().replace(/\s+/g, " ").trim();

    res.json({
      url: finalUrl,
      statusCode,
      contentType,
      contentLength,
      responseTimeMs,
      responseHeaders,
      metadata: {
        title,
        description,
        canonical: canonical ? resolveUrl(canonical, finalUrl) : "",
        favicon,
        robots,
        lang,
        openGraph,
        twitterCard,
        jsonLd,
      },
      stats,
      headings: headings.slice(0, 100),
      links,
      images,
      tables,
      cleanTextSnippet: cleanText.slice(0, 5000),
      cleanTextLength: cleanText.length,
      htmlPreview: html.slice(0, 50000),
    });
  } catch (err: any) {
    console.error("Scrape error:", err);
    res.status(500).json({ error: err.message || "Failed to parse page" });
  }
});

// Custom CSS selector query
app.post("/api/scrape/selector", async (req, res) => {
  try {
    const { html, selector, attribute, fields, baseUrl } = req.body;

    if (!html || !selector) {
      return res.status(400).json({ error: "Missing html or selector parameter" });
    }

    const $ = cheerio.load(html);

    // If multi-field structured extraction is requested (e.g. record selector: '.item', fields: [{ name: 'title', selector: 'h2' }])
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const records: Array<Record<string, any>> = [];
      $(selector).each((_, parentEl) => {
        if (records.length >= 200) return;
        const itemObj: Record<string, any> = {};

        for (const f of fields) {
          if (!f.name) continue;
          const targetEl = f.selector ? $(parentEl).find(f.selector) : $(parentEl);

          if (!f.attribute || f.attribute === "text") {
            itemObj[f.name] = targetEl.first().text().replace(/\s+/g, " ").trim();
          } else if (f.attribute === "html") {
            itemObj[f.name] = targetEl.first().html()?.trim() || "";
          } else {
            let attrVal = targetEl.first().attr(f.attribute) || "";
            if (baseUrl && (f.attribute === "href" || f.attribute === "src") && attrVal) {
              attrVal = resolveUrl(attrVal, baseUrl);
            }
            itemObj[f.name] = attrVal;
          }
        }
        records.push(itemObj);
      });

      return res.json({
        selector,
        totalMatched: $(selector).length,
        extractedCount: records.length,
        isStructured: true,
        data: records,
      });
    }

    // Standard single selector query
    const results: Array<{ index: number; text: string; value: string; html: string; tag: string }> = [];
    const matched = $(selector);

    matched.each((index, el) => {
      if (results.length >= 200) return;

      const $el = $(el);
      const text = $el.text().replace(/\s+/g, " ").trim();
      let val = text;

      if (attribute && attribute !== "text") {
        if (attribute === "html") {
          val = $el.html()?.trim() || "";
        } else if (attribute === "outerHTML") {
          val = $.html(el) || "";
        } else {
          val = $el.attr(attribute) || "";
          if (baseUrl && (attribute === "href" || attribute === "src") && val) {
            val = resolveUrl(val, baseUrl);
          }
        }
      }

      results.push({
        index,
        text: text.slice(0, 500),
        value: val,
        html: ($el.html() || "").slice(0, 500),
        tag: (el as any).name || (el as any).tagName || "element",
      });
    });

    res.json({
      selector,
      totalMatched: matched.length,
      extractedCount: results.length,
      isStructured: false,
      data: results,
    });
  } catch (err: any) {
    res.status(400).json({ error: `Selector evaluation error: ${err.message}` });
  }
});

// AI Structured Extraction using Gemini 3.8 Flash
app.post("/api/scrape/ai-extract", async (req, res) => {
  try {
    const { htmlText, prompt, customFields } = req.body;

    if (!htmlText) {
      return res.status(400).json({ error: "Missing text or HTML content to extract" });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error:
          "Gemini API key is not configured. Please ensure GEMINI_API_KEY is configured in Settings > Secrets.",
      });
    }

    // Limit text input size for prompt to stay well within token limits and fast latency
    const truncatedContent = htmlText.slice(0, 35000);

    const systemInstruction = `You are an expert web data extractor and scraper assistant.
Your job is to accurately extract structured information from webpage content as valid, clean JSON.
Always output pure JSON without markdown code fences or conversational filler.`;

    const userPrompt = `Extract structured data from the following webpage content according to these instructions:
Instructions: "${prompt || "Extract all main items, products, articles, or listings found on this page into a structured array."}"
${customFields && customFields.length > 0 ? `Target fields to capture: ${customFields.join(", ")}` : ""}

Content snippet:
${truncatedContent}

Return a valid JSON object matching this structure:
{
  "summary": "Short 1-sentence summary of what was found",
  "totalItems": number,
  "items": [
    { ... extracted fields ... }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "{}";
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(responseText.trim());
    } catch {
      // Clean possible stray characters
      const clean = responseText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      parsedJson = JSON.parse(clean);
    }

    res.json(parsedJson);
  } catch (err: any) {
    console.error("AI extraction error:", err);
    res.status(500).json({ error: err.message || "Failed to extract with AI" });
  }
});

// Vite middleware for dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web Scraper server running on http://localhost:${PORT}`);
  });
}

startServer();
