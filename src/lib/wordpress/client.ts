import "server-only";

import { WordPressError } from "./errors";
import type { WordPressConnection } from "./validation";

export async function authenticateWordPress(
  { baseUrl, username, applicationPassword }: WordPressConnection,
  fetchWordPress: typeof fetch = fetch,
): Promise<string> {
  const endpoint = new URL("wp-json/wp/v2/users/me", baseUrl);
  const credentials = Buffer.from(
    `${username}:${applicationPassword}`,
  ).toString("base64");

  let response: Response;
  try {
    response = await fetchWordPress(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    throw new WordPressError(
      error instanceof Error && error.name === "TimeoutError"
        ? "TIMEOUT"
        : "NETWORK_ERROR",
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new WordPressError("AUTH_FAILED");
  }

  if (!response.ok) {
    throw new WordPressError("UPSTREAM_REJECTED");
  }

  try {
    // Preserve permissive JSON handling and the existing username fallback.
    // Validating the WordPress user schema is a separate behavior change.
    const user: { name?: unknown } = await response.json();
    return `${user.name || username}`;
  } catch {
    throw new WordPressError("INVALID_RESPONSE");
  }
}
