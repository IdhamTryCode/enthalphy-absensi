"use client";

import { useEffect } from "react";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global root error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          maxWidth: "32rem",
          margin: "4rem auto",
          textAlign: "center",
        }}
      >
        <h1
          style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}
        >
          Aplikasi mengalami error
        </h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Maaf, ada masalah serius. Silakan refresh halaman.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.6rem 1.2rem",
            background: "#087683",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
