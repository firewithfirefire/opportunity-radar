"use client";

import { findMatchedKeywords, parseOpportunity } from "@/lib/parser";
import type { ParsedOpportunity, RawItem, Source } from "@/types/opportunity";

type FetchResult = {
  rawItems: Array<Omit<RawItem, "id" | "status">>;
  opportunities: ParsedOpportunity[];
};

function textFromHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script,style,noscript").forEach((node) => node.remove());
  return document.body.textContent?.replace(/\s+/g, " ").trim() || "";
}

function parseRss(xmlText: string, source: Source) {
  const document = new DOMParser().parseFromString(xmlText, "text/xml");
  const entries = [...document.querySelectorAll("item, entry")].slice(0, 30);

  return entries.map((entry) => {
    const title = entry.querySelector("title")?.textContent?.trim() || "Untitled";
    const link =
      entry.querySelector("link")?.getAttribute("href") ||
      entry.querySelector("link")?.textContent?.trim() ||
      undefined;
    const publishedAt =
      entry.querySelector("pubDate")?.textContent?.trim() ||
      entry.querySelector("published")?.textContent?.trim() ||
      entry.querySelector("updated")?.textContent?.trim() ||
      undefined;
    const description =
      entry.querySelector("description")?.textContent?.trim() ||
      entry.querySelector("summary")?.textContent?.trim() ||
      entry.querySelector("content")?.textContent?.trim() ||
      "";
    const rawText = textFromHtml(description || title);
    const matchedKeywords = findMatchedKeywords(`${title}\n${rawText}`, source.keywords);

    return {
      title,
      url: link,
      sourceName: source.name,
      sourceType: source.type,
      publishedAt,
      rawText,
      fetchedAt: new Date().toISOString(),
      matchedKeywords,
    };
  });
}

function parseApi(json: unknown, source: Source) {
  const items = Array.isArray(json) ? json : Array.isArray((json as { items?: unknown[] }).items) ? (json as { items: unknown[] }).items : [json];

  return items.slice(0, 30).map((item) => {
    const record = item as Record<string, unknown>;
    const title = String(record.title || record.name || record.headline || "Untitled");
    const url = typeof record.url === "string" ? record.url : undefined;
    const rawText = String(record.description || record.summary || record.content || record.body || JSON.stringify(record)).slice(0, 4000);
    const publishedAt = typeof record.publishedAt === "string" ? record.publishedAt : undefined;
    const matchedKeywords = findMatchedKeywords(`${title}\n${rawText}`, source.keywords);

    return {
      title,
      url,
      sourceName: source.name,
      sourceType: source.type,
      publishedAt,
      rawText,
      fetchedAt: new Date().toISOString(),
      matchedKeywords,
    };
  });
}

export async function fetchSource(source: Source): Promise<FetchResult> {
  let rawItems: Array<Omit<RawItem, "id" | "status">> = [];

  if (source.type === "manual_text") {
    const title = source.name;
    const rawText = source.url;
    rawItems = [
      {
        title,
        sourceName: source.name,
        sourceType: source.type,
        rawText,
        fetchedAt: new Date().toISOString(),
        matchedKeywords: findMatchedKeywords(`${title}\n${rawText}`, source.keywords),
      },
    ];
  } else {
    const response = await fetch(source.url);
    if (!response.ok) {
      throw new Error(`抓取失败：HTTP ${response.status}`);
    }

    if (source.type === "rss") {
      rawItems = parseRss(await response.text(), source);
    } else if (source.type === "api") {
      rawItems = parseApi(await response.json(), source);
    } else {
      const html = await response.text();
      const title = new DOMParser().parseFromString(html, "text/html").title || source.name;
      const rawText = textFromHtml(html).slice(0, 6000);
      rawItems = [
        {
          title,
          url: source.url,
          sourceName: source.name,
          sourceType: source.type,
          rawText,
          fetchedAt: new Date().toISOString(),
          matchedKeywords: findMatchedKeywords(`${title}\n${rawText}`, source.keywords),
        },
      ];
    }
  }

  const opportunities = rawItems
    .map((item) => parseOpportunity({ ...item, status: "new" }))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return { rawItems, opportunities };
}
