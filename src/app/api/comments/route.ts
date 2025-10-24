// src/app/api/comments/route.ts
import { NextResponse } from "next/server";

const WP_BASE = process.env.WP_BASE_URL || "https://somekindofgame.com";

export async function POST(req: Request) {
  try {
    const { postId, author_name, author_email, content } = await req.json();

    if (!postId || !content?.trim()) {
      return NextResponse.json(
        { error: "postId and content are required" },
        { status: 400 }
      );
    }

    // WordPress REST: create a public (unauthenticated) comment
    const res = await fetch(`${WP_BASE}/wp-json/wp/v2/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post: Number(postId),
        author_name: author_name || undefined,
        author_email: author_email || undefined,
        content,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "WordPress rejected the comment" },
        { status: res.status }
      );
    }

    // status can be "approved" or "hold"
    return NextResponse.json({
      id: data.id,
      status: data.status, // "approved" | "hold"
      message:
        data.status === "hold"
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
