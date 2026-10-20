import { WordPressError } from "./errors";

export type WordPressConnection = {
  baseUrl: URL;
  username: string;
  applicationPassword: string;
};

export function validateConnection(
  input: unknown,
  allowedHost: string | undefined,
): WordPressConnection {
  // Destructuring null originally reached the route's generic error response.
  if (input === null || input === undefined) {
    throw new WordPressError("INVALID_REQUEST");
  }

  const { siteUrl, username, applicationPassword } = input as {
    siteUrl?: unknown;
    username?: unknown;
    applicationPassword?: unknown;
  };

  if (
    typeof siteUrl !== "string" ||
    typeof username !== "string" ||
    typeof applicationPassword !== "string" ||
    !username.trim() ||
    !applicationPassword.trim()
  ) {
    throw new WordPressError("INVALID_INPUT");
  }

  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new WordPressError("INVALID_URL");
  }

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
    throw new WordPressError("URL_NOT_ALLOWED");
  }

  return {
    baseUrl: new URL(url.href.replace(/\/?$/, "/")),
    username,
    applicationPassword,
  };
}
