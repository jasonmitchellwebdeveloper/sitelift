import { NextRequest, NextResponse } from "next/server";
import { authenticateWordPress } from "@/lib/wordpress/client";
import { toPublicError, WordPressError } from "@/lib/wordpress/errors";
import { validateConnection } from "@/lib/wordpress/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new WordPressError("INVALID_REQUEST");
    }

    const connection = validateConnection(
      input,
      process.env.WORDPRESS_ALLOWED_HOST,
    );
    const displayName = await authenticateWordPress(connection);

    return NextResponse.json({
      success: true,
      message: `Connected successfully as ${displayName}!`,
    });
  } catch (error) {
    const { status, message } = toPublicError(error);
    return NextResponse.json(
      { success: false, message },
      { status },
    );
  }
}
