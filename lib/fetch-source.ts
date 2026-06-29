"use client";

import { classifyRawItem } from "@/lib/parser";
import type { RawItem, Source } from "@/types/opportunity";

type FetchResult = {
  rawItems: Array<Omit<RawItem, "id" | "status">>;
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
    const classification = classifyRawItem({
      title,
      rawText,
      sourceProfile: source.sourceProfile,
      sourceKeywords: source.keywords,
    });

    return {
      title,
      url: link,
      sourceName: source.name,
      sourceType: source.type,
      publishedAt,
      rawText,
      fetchedAt: new Date().toISOString(),
      ...classification,
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
    const classification = classifyRawItem({
      title,
      rawText,
      sourceProfile: source.sourceProfile,
      sourceKeywords: source.keywords,
    });

    return {
      title,
      url,
      sourceName: source.name,
      sourceType: source.type,
      publishedAt,
      rawText,
      fetchedAt: new Date().toISOString(),
      ...classification,
    };
  });
}

async function fetchExternal(url: string) {
  const response = await fetch(`/api/fetch-source?url=${encodeURIComponent(url)}`);
  const payload = (await response.json()) as { body?: string; error?: string };

  if (!response.ok || !payload.body) {
    throw new Error(`抓取失败：${payload.error || `HTTP ${response.status}`}`);
  }

  return payload.body;
}

export async function fetchSource(source: Source): Promise<FetchResult> {
  let rawItems: Array<Omit<RawItem, "id" | "status">> = [];

  if (source.type === "manual_text") {
    const title = source.name;
    const rawText = source.url;
    const classification = classifyRawItem({
      title,
      rawText,
      sourceProfile: source.sourceProfile,
      sourceKeywords: source.keywords,
    });
    rawItems = [
      {
        title,
        sourceName: source.name,
        sourceType: source.type,
        rawText,
        fetchedAt: new Date().toISOString(),
        ...classification,
      },
    ];
  } else {
    const body = await fetchExternal(source.url);

    if (source.type === "rss") {
      rawItems = parseRss(body, source);
    } else if (source.type === "api") {
      rawItems = parseApi(JSON.parse(body), source);
    } else {
      const html = body;
      const title = new DOMParser().parseFromString(html, "text/html").title || source.name;
      const rawText = textFromHtml(html).slice(0, 6000);
      const classification = classifyRawItem({
        title,
        rawText,
        sourceProfile: source.sourceProfile,
        sourceKeywords: source.keywords,
      });
      rawItems = [
        {
          title,
          url: source.url,
          sourceName: source.name,
          sourceType: source.type,
          rawText,
          fetchedAt: new Date().toISOString(),
          ...classification,
        },
      ];
    }
  }

  return { rawItems };
}
