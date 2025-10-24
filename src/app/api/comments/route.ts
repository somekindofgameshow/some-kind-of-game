// src/app/api/comments/route.ts
import { NextResponse } from "next/server";

/**
 * Configure your WordPress base URL in Vercel env if you like:
 *   WP_BASE_URL = https://somekindofgame.com
 */
const WP_BASE = process.env.WP_BASE_URL || "https://somekindofgame.com";

/**
 * Optional (recommended for reliability across all devices):
 * Create a WordPress Application Password and set these env vars:
 *   WP_BASIC_USER=<your-wp-username-or-email>
 *   WP_BASIC_APP_PASSWORD=<generated-application-password>
 *
 * If both are present, this route will authenticate to WP and bypass the
 * “must be logged in to comment” gate even if your WP requires it.
 */
const WP_USER = process.env.WP_BASIC_USER;
const WP_APP_PASS = process.env.WP_BASIC_APP_PASSWORD;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept both snake_case and camelCase from the client
    const postId = Number(body.postId ?? body.postID ?? body.post);
    const author_name = (body.author_name ?? body.authorName ?? "").trim();
    const author_email = (body.author_email ?? body.authorEmail ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!postId || !content) {
      return NextResponse.json(
        { error: "postId and content are required" },
        { status: 400 }
      );
    }

    const url = `${WP_BASE}/wp-json/wp/v2/comments`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // If credentials are provided, authenticate the request to WP.
    if (WP_USER && WP_APP_PASS) {
      const token = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString("base64");
      headers.Authorization = `Basic ${token}`;
    }

    const payload: Record<string, any> = {
      post: postId,
      content,
    };
    if (author_name) payload.author_name = author_name;
    if (author_email) payload.author_email = author_email;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      // don't cache comment posts
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      // Pass through the WP message when available
      return NextResponse.json(
        { error: data?.message || "WordPress rejected the comment" },
        { status: res.status }
      );
    }

    // WP returns "approved" or "hold" (awaiting moderation)
    const status: string = data?.status || "hold";
    return NextResponse.json({
      id: data?.id ?? null,
      status,
      message:
        status === "hold"
          ? "Thanks! Your comment was submitted for moderation."
          : "Thanks! Your comment is posted.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
