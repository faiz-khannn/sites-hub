"use client";

import { useEffect, useRef, useState } from "react";

// Sites are rendered at a fixed desktop size, then scaled down visually to
// fit the card. This is what stops elements overlapping: the site never
// actually has to reflow into a tiny width, it's just shown smaller.
const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 900;

function ExternalIcon({ className }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2M9 3h4v4M13 3 7 9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SiteCard({ site, index, accent }) {
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(!site.embeddable);
  const [scale, setScale] = useState(0.2);
  const [visible, setVisible] = useState(false);
  const frameRef = useRef(null);
  const cardRef = useRef(null);

  // Recalculate scale whenever the card's own width changes (resize, new
  // breakpoint, etc.) so the preview always fills its box without overlap.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) setScale(width / FRAME_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll-reveal: fade + rise into place once, the first time a card enters
  // the viewport. Respects prefers-reduced-motion via the global CSS rule.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const num = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={cardRef}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-700 ease-out hover:border-[var(--accent)] hover:shadow-[0_0_50px_-18px_var(--accent)] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{ transitionDelay: `${(index % 6) * 70}ms`, "--accent": accent }}
    >
      {/* preview */}
      <div
        ref={frameRef}
        className="relative aspect-[16/10] w-full overflow-hidden border-b border-line bg-[#05060a]"
      >
        {!failed ? (
          <>
            <div
              style={{
                width: FRAME_WIDTH,
                height: FRAME_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                pointerEvents: active ? "auto" : "none",
              }}
            >
              <iframe
                src={site.url}
                title={site.name}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onError={() => setFailed(true)}
                style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, border: 0 }}
              />
            </div>

            {!active && (
              <button
                onClick={() => setActive(true)}
                className="absolute inset-0 flex items-center justify-center bg-base/0 text-sm opacity-0 transition-opacity duration-150 hover:bg-base/50 hover:opacity-100 focus-visible:opacity-100"
              >
                <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink">
                  Click to interact
                </span>
              </button>
            )}

            {active && (
              <button
                onClick={() => setActive(false)}
                className="absolute right-3 top-3 rounded-full border border-line bg-surface/90 px-2.5 py-1 text-xs text-muted hover:text-ink"
              >
                Release scroll
              </button>
            )}
          </>
        ) : (
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted transition-colors hover:text-ink"
          >
            <span className="text-sm">Preview not available here</span>
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: accent }}
            >
              Open the live site <ExternalIcon className="h-3 w-3" />
            </span>
          </a>
        )}

        <span className="tabular absolute left-3 top-3 text-xs text-muted">
          {num}
        </span>
      </div>

      {/* meta */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-medium leading-snug text-ink">
            {site.name}
          </h2>
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: accent }}
            aria-hidden="true"
          />
        </div>
        {site.description && (
          <p className="text-sm leading-snug text-muted">{site.description}</p>
        )}
        <div className="mt-auto pt-3">
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-[var(--accent)]"
          >
            Open site <ExternalIcon className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
