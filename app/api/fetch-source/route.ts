import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      accept: "application/rss+xml, application/xml, text/xml, text/html, application/json, */*",
      "user-agent": "OpportunityRadar/0.1",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: `HTTP ${response.status}` }, { status: response.status });
  }

  const contentType = response.headers.get("content-type") || "text/plain";
  const body = await response.text();

  return NextResponse.json({ contentType, body });
}
