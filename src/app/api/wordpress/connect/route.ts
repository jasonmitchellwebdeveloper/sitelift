
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, username, applicationPassword } =
      await request.json();

    if (
      typeof siteUrl !== "string" ||
      typeof username !== "string" ||
      typeof applicationPassword !== "string" ||
      !username.trim() ||
      !applicationPassword.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const url = new URL(siteUrl);
    const allowedHost = process.env.WORDPRESS_ALLOWED_HOST;

    if (
      !allowedHost ||
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== allowedHost.toLowerCase() ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return NextResponse.json(
        { success: false, message: "This WordPress URL is not allowed." },
        { status: 403 }
      );
    }

    const baseUrl = url.href.replace(/\/?$/, "/");
    const endpoint = new URL("wp-json/wp/v2/users/me", baseUrl);

    const credentials = Buffer.from(
      `${username}:${applicationPassword}`
    ).toString("base64");

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        {
          success: false,
          message: "WordPress authentication failed. Check your credentials.",
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "WordPress did not accept the connection.",
        },
        { status: 502 }
      );
    }

    const user = await response.json();

    return NextResponse.json({
      success: true,
      message: `Connected successfully as ${user.name || username}!`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to WordPress. Check the site URL.",
      },
      { status: 400 }
    );
  }
}
