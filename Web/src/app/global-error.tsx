"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#faf9f7", color: "#202124" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 480, padding: 28, border: "1px solid #eae8e3", borderRadius: 14, background: "white" }}>
            <h1>Clipbook is temporarily unavailable</h1>
            <p>Please retry. Your saved data is unchanged.</p>
            <button onClick={reset}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
