"use client";

import { useState } from "react";

export default function WordPressConnection() {
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setMessage("Checking connection...");
  const normalizedUrl = `https://${siteUrl.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;

  try {
    const response = await fetch("/api/wordpress/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        siteUrl: normalizedUrl,
        username,
        applicationPassword,
      }),
    });

    const data = await response.json();

    setMessage(
      data.message ??
        (response.ok ? "Connection successful." : "Connection failed.")
    );
  } catch {
    setMessage("Unable to contact the SiteLift server.");
  }
}

  return (
    <form onSubmit={handleSubmit}>
      <h2>Connect to WordPress</h2>

      <label htmlFor="siteUrl">Website URL</label>
      <input
        id="siteUrl"
        type="text"
        placeholder="https://example.com"
        value={siteUrl}
        onChange={(event) => setSiteUrl(event.target.value)}
        required
      />

      <label htmlFor="username">Username</label>
      <input
        id="username"
        type="text"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />

      <label htmlFor="applicationPassword">Application Password</label>
      <input
        id="applicationPassword"
        type="password"
        autoComplete="off"
        value={applicationPassword}
        onChange={(event) => setApplicationPassword(event.target.value)}
        required
      />

      <button type="submit">Connect</button>
      <p role="status" aria-live="polite">
  {message}
</p>
    </form>
  );
}
