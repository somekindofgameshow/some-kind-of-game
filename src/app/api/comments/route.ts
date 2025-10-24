import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { postId, authorName, authorEmail, content } = await req.json();

    if (!postId || !content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Basic input limits (anti-abuse)
    if (content.length > 4000) {
      return NextResponse.json({ error: "Comment too long." }, { status: 400 });
    }

    const base = process.env.WP_API_BASE?.replace(/\/+$/, "");
    const user = process.env.WP_APP_USER;
    const pass = process.env.WP_APP_PASSWORD;

    if (!base || !user || !pass) {
      return NextResponse.json(
        { error: "Server is not configured for WordPress comments." },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${user}:${pass}`).toString("base64");

    const wpRes = await fetch(`${base}/wp-json/wp/v2/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        post: Number(postId),
        content,
        author_name: authorName || "Anonymous",
        author_email: authorEmail || undefined, // optional; WP may require it depending on settings
      }),
    });

    const data = await wpRes.json();

    if (!wpRes.ok) {
      return NextResponse.json(
        { error: "WP error", details: data },
        { status: wpRes.status }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected error", details: String(e) }, { status: 500 });
  }
}
