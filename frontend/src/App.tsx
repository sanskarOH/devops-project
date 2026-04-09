import React, { useState } from "react";
import { API_BASE_URL } from "./config";

interface ShortenResponse {
  code: string;
  shortUrl: string;
  originalUrl: string;
  expiresAt: string | null;
}

interface StatsResponse {
  code: string;
  originalUrl: string;
  clicks: number;
  createdAt: string;
  expiresAt: string | null;
}

export const App: React.FC = () => {
  const [url, setUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [shortData, setShortData] = useState<ShortenResponse | null>(null);
  const [statsCode, setStatsCode] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");

  const handleShorten = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStats(null);

    try {
      const response = await fetch(`${API_BASE_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          expiresAt: expiresAt || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to shorten URL");
      }

      setShortData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleStats = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/stats/${statsCode}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch stats");
      }
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <main style={{ maxWidth: "720px", margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h1>URL Shortener</h1>
      <p>Simple URL shortener with click analytics.</p>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Shorten URL</h2>
        <form onSubmit={handleShorten}>
          <input
            type="url"
            required
            placeholder="https://example.com/very/long/path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
          />
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
          />
          <button type="submit">Create Short URL</button>
        </form>

        {shortData && (
          <div style={{ marginTop: "1rem" }}>
            <p><strong>Short URL:</strong> <a href={shortData.shortUrl}>{shortData.shortUrl}</a></p>
            <p><strong>Code:</strong> {shortData.code}</p>
          </div>
        )}
      </section>

      <section>
        <h2>Check Stats</h2>
        <form onSubmit={handleStats}>
          <input
            type="text"
            required
            placeholder="Enter short code"
            value={statsCode}
            onChange={(e) => setStatsCode(e.target.value)}
            style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
          />
          <button type="submit">Fetch Stats</button>
        </form>

        {stats && (
          <div style={{ marginTop: "1rem" }}>
            <p><strong>Original URL:</strong> {stats.originalUrl}</p>
            <p><strong>Clicks:</strong> {stats.clicks}</p>
            <p><strong>Created:</strong> {new Date(stats.createdAt).toLocaleString()}</p>
            <p><strong>Expires:</strong> {stats.expiresAt ? new Date(stats.expiresAt).toLocaleString() : "Never"}</p>
          </div>
        )}
      </section>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
    </main>
  );
};
