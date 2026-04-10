import React, { useState, useRef } from "react";
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

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink: #0a0a0a;
    --paper: #fafaf8;
    --accent: #c8f53d;
    --muted: #7a7a72;
    --border: #e2e2dc;
    --surface: #f2f2ec;
    --red: #ff3b3b;
    --mono: 'JetBrains Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  body { background: var(--paper); color: var(--ink); font-family: var(--sans); }

  .app {
    min-height: 100vh;
    max-width: 680px;
    margin: 0 auto;
    padding: 0 24px 80px;
  }

  .header {
    padding: 56px 0 48px;
    border-bottom: 1.5px solid var(--ink);
    margin-bottom: 56px;
  }

  .header-label {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 12px;
  }

  .header h1 {
    font-size: clamp(32px, 6vw, 52px);
    font-weight: 800;
    line-height: 1.0;
    letter-spacing: -0.03em;
  }

  .header h1 span {
    background: var(--ink);
    color: var(--accent);
    padding: 0 6px;
    display: inline-block;
  }

  .section {
    margin-bottom: 56px;
  }

  .section-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 28px;
  }

  .section-num {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .field {
    margin-bottom: 16px;
  }

  .field label {
    display: block;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--muted);
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .field input {
    width: 100%;
    padding: 14px 16px;
    font-family: var(--mono);
    font-size: 14px;
    color: var(--ink);
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 0;
    outline: none;
    transition: border-color 0.15s;
    -webkit-appearance: none;
    appearance: none;
  }

  .field input:focus {
    border-color: var(--ink);
    background: #fff;
  }

  .field input::placeholder { color: #b0b0a8; }

  .field input[type="datetime-local"] {
    color-scheme: light;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1.5px solid var(--ink);
    background: var(--ink);
    color: var(--accent);
    border-radius: 0;
    transition: transform 0.1s, background 0.15s, color 0.15s;
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }

  .btn:hover {
    background: var(--accent);
    color: var(--ink);
    border-color: var(--ink);
  }

  .btn:active { transform: scale(0.98); }

  .btn svg { flex-shrink: 0; }

  .result-card {
    margin-top: 24px;
    border: 1.5px solid var(--ink);
    background: var(--ink);
    color: var(--accent);
    padding: 20px;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .result-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(200,245,61,0.15);
  }

  .result-row:last-child { border-bottom: none; padding-bottom: 0; }
  .result-row:first-child { padding-top: 0; }

  .result-key {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.5;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .result-val {
    font-family: var(--mono);
    font-size: 13px;
    text-align: right;
    word-break: break-all;
  }

  .result-val a {
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px solid rgba(200,245,61,0.4);
  }

  .result-val a:hover { border-color: var(--accent); }

  .copy-btn {
    flex-shrink: 0;
    background: none;
    border: 1px solid rgba(200,245,61,0.3);
    color: var(--accent);
    font-family: var(--mono);
    font-size: 10px;
    padding: 3px 8px;
    cursor: pointer;
    transition: background 0.1s;
    letter-spacing: 0.05em;
  }

  .copy-btn:hover { background: rgba(200,245,61,0.1); }

  .stats-card {
    margin-top: 24px;
    border: 1.5px solid var(--border);
    background: #fff;
    animation: slideIn 0.2s ease;
  }

  .stats-header {
    background: var(--surface);
    padding: 12px 20px;
    border-bottom: 1.5px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stats-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    border: 1.5px solid var(--ink);
    flex-shrink: 0;
  }

  .stats-code {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  .click-count {
    margin-left: auto;
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1;
  }

  .click-label {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .stats-body {
    padding: 0 20px;
  }

  .stats-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }

  .stats-row:last-child { border-bottom: none; }

  .stats-key {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    flex-shrink: 0;
    padding-top: 2px;
  }

  .stats-val {
    font-family: var(--mono);
    font-size: 12px;
    text-align: right;
    word-break: break-all;
    color: var(--ink);
  }

  .expire-pill {
    display: inline-block;
    padding: 2px 8px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.05em;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .error-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #fff0f0;
    border: 1.5px solid var(--red);
    color: var(--red);
    font-family: var(--mono);
    font-size: 12px;
    margin-top: 16px;
    animation: slideIn 0.2s ease;
  }

  .divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0 0 56px;
  }
`;

export const App: React.FC = () => {
  const [url, setUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [shortData, setShortData] = useState<ShortenResponse | null>(null);
  const [statsCode, setStatsCode] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyRef = useRef<string>("");

  const handleShorten = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStats(null);
    setLoading1(true);
    try {
      const response = await fetch(`${API_BASE_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, expiresAt: expiresAt || undefined }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to shorten URL");
      setShortData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading1(false);
    }
  };

  const handleStats = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading2(true);
    try {
      const response = await fetch(`${API_BASE_URL}/stats/${statsCode}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to fetch stats");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading2(false);
    }
  };

  const handleCopy = (text: string) => {
    copyRef.current = text;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <p className="header-label">Tool — 001</p>
          <h1>
            URL
            <br />
            <span>Shortener</span>
          </h1>
        </header>

        <section className="section">
          <div className="section-header">
            <span className="section-num">01</span>
            <span className="section-title">Shorten a URL</span>
          </div>

          <form onSubmit={handleShorten}>
            <div className="field">
              <label>Destination URL</label>
              <input
                type="url"
                required
                placeholder="https://your-very-long-url.com/path/to/something"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Expiry (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={loading1}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 7h12M7 1l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {loading1 ? "Creating…" : "Create Short URL"}
            </button>
          </form>

          {shortData && (
            <div className="result-card">
              <div className="result-row">
                <span className="result-key">Short URL</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <span className="result-val">
                    <a
                      href={shortData.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shortData.shortUrl}
                    </a>
                  </span>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(shortData.shortUrl)}
                  >
                    {copied && copyRef.current === shortData.shortUrl
                      ? "✓ copied"
                      : "copy"}
                  </button>
                </div>
              </div>
              <div className="result-row">
                <span className="result-key">Code</span>
                <span className="result-val">{shortData.code}</span>
              </div>
              {shortData.expiresAt && (
                <div className="result-row">
                  <span className="result-key">Expires</span>
                  <span className="result-val">
                    {new Date(shortData.expiresAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        <hr className="divider" />

        <section className="section">
          <div className="section-header">
            <span className="section-num">02</span>
            <span className="section-title">Check stats</span>
          </div>

          <form onSubmit={handleStats}>
            <div className="field">
              <label>Short code</label>
              <input
                type="text"
                required
                placeholder="e.g. ab3xk9"
                value={statsCode}
                onChange={(e) => setStatsCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={loading2}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect
                  x="1"
                  y="7"
                  width="2.5"
                  height="5"
                  rx="0.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <rect
                  x="5.75"
                  y="4"
                  width="2.5"
                  height="8"
                  rx="0.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <rect
                  x="10.5"
                  y="1"
                  width="2.5"
                  height="11"
                  rx="0.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
              {loading2 ? "Fetching…" : "Fetch Stats"}
            </button>
          </form>

          {stats && (
            <div className="stats-card">
              <div className="stats-header">
                <span className="stats-dot" />
                <span className="stats-code">{stats.code}</span>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div className="click-count">
                    {stats.clicks.toLocaleString()}
                  </div>
                  <div className="click-label">clicks</div>
                </div>
              </div>
              <div className="stats-body">
                <div className="stats-row">
                  <span className="stats-key">Original URL</span>
                  <span className="stats-val" style={{ maxWidth: 340 }}>
                    {stats.originalUrl}
                  </span>
                </div>
                <div className="stats-row">
                  <span className="stats-key">Created</span>
                  <span className="stats-val">
                    {new Date(stats.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="stats-row">
                  <span className="stats-key">Expires</span>
                  <span className="stats-val">
                    {stats.expiresAt ? (
                      <span className="expire-pill">
                        {new Date(stats.expiresAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="expire-pill">Never</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="error-bar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle
                cx="7"
                cy="7"
                r="6"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M7 4v3.5M7 10h.01"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {error}
          </div>
        )}
      </div>
    </>
  );
};
