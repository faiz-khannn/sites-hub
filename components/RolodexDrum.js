"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const FRAME_SIZE = 1440; // virtual desktop size each site is rendered at, then scaled down

function buildPlaceholder(name, color) {
  const div = document.createElement("div");
  div.setAttribute("data-placeholder", "true");
  div.style.cssText = `
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    text-align:center; padding:0 16px; font-weight:600; font-size:0.85rem; color:#0A0B10;
    background:${color};
  `;
  div.textContent = name;
  return div;
}

export default function RolodexDrum({ sites }) {
  const stageRef = useRef(null);
  const drumRef = useRef(null);
  const cardShellRefs = useRef([]);
  const cardFaceRefs = useRef([]);
  const loadedRef = useRef(new Set());
  const activeIndexRef = useRef(-1);
  const interactiveRef = useRef(false);

  const [dims, setDims] = useState({ cardW: 220, cardH: 340, radius: 900 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactive, setInteractive] = useState(false);

  const N = sites.length;
  const step = 360 / N;

  // size everything relative to the stage's own width, so it holds up on mobile
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const cardW = Math.min(260, Math.max(150, width * 0.34));
      const cardH = cardW * 1.5;
      const radius = Math.max(cardW / (2 * Math.tan(Math.PI / N)), cardW * 1.1);
      setDims({ cardW, cardH, radius });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [N]);

  const setFace = useCallback(
    (i, load) => {
      const face = cardFaceRefs.current[i];
      if (!face) return;
      const isLoaded = loadedRef.current.has(i);
      if (load && !isLoaded) {
        loadedRef.current.add(i);
        face.innerHTML = "";
        const wrap = document.createElement("div");
        wrap.style.cssText = `width:${FRAME_SIZE}px;height:${FRAME_SIZE}px;transform:scale(${
          dims.cardW / FRAME_SIZE
        });transform-origin:top left;`;
        const iframe = document.createElement("iframe");
        iframe.src = sites[i].url;
        iframe.loading = "lazy";
        iframe.title = sites[i].name;
        iframe.sandbox =
          "allow-scripts allow-same-origin allow-forms allow-popups";
        iframe.style.cssText = `width:${FRAME_SIZE}px;height:${FRAME_SIZE}px;border:0;pointer-events:none;`;
        iframe.setAttribute("data-iframe", "true");
        wrap.appendChild(iframe);
        face.appendChild(wrap);
      } else if (!load && isLoaded) {
        loadedRef.current.delete(i);
        face.innerHTML = "";
        face.appendChild(buildPlaceholder(sites[i].name, sites[i].accent));
      }
    },
    [sites, dims.cardW],
  );

  const update = useCallback(() => {
    const stage = stageRef.current;
    const drum = drumRef.current;
    if (!stage || !drum) return;

    const rect = stage.parentElement.getBoundingClientRect();
    const total = stage.parentElement.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    const progress = Math.min(Math.max(scrolled / Math.max(total, 1), 0), 1);

    const rotation = progress * 360; // one full turn shows every card once
    drum.style.transform = `rotateY(${-rotation}deg)`;

    let bestI = 0;
    let bestFrontness = -Infinity;

    for (let i = 0; i < N; i += 1) {
      const angle = (i * step + rotation) % 360;
      const norm = ((angle + 180) % 360) - 180;
      const rad = (norm * Math.PI) / 180;
      const frontness = Math.cos(rad);

      const el = cardShellRefs.current[i];
      if (el) el.style.opacity = Math.max(0.12, (frontness + 1) / 2);

      setFace(i, frontness > 0.5);

      if (frontness > bestFrontness) {
        bestFrontness = frontness;
        bestI = i;
      }
    }

    if (bestI !== activeIndexRef.current) {
      activeIndexRef.current = bestI;
      setActiveIndex(bestI);
      if (interactiveRef.current) {
        interactiveRef.current = false;
        setInteractive(false);
      }
    }
  }, [N, step, setFace]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll);
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [update]);

  // toggle pointer-events on the current front card's iframe
  useEffect(() => {
    const face = cardFaceRefs.current[activeIndex];
    const iframe = face?.querySelector("[data-iframe]");
    if (iframe) iframe.style.pointerEvents = interactive ? "auto" : "none";
  }, [activeIndex, interactive]);

  return (
    <div style={{ position: "relative", height: "3200vh" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* desk / environment backdrop — no footage required */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 78%, rgba(255,107,74,0.10), transparent 70%), radial-gradient(ellipse 80% 60% at 50% 100%, #1c1710 0%, #0A0B10 60%)",
          }}
        />

        <div
          ref={stageRef}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 900,
            height: dims.cardH,
            perspective: dims.radius * 2,
          }}
        >
          <div
            ref={drumRef}
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: dims.cardW,
              height: dims.cardH,
              marginLeft: -dims.cardW / 2,
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            {sites.map((site, i) => (
              <div
                key={site.url}
                ref={(el) => {
                  cardShellRefs.current[i] = el;
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: dims.cardW,
                  height: dims.cardH,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#14151C",
                  border: "1px solid #23242E",
                  boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
                  backfaceVisibility: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transform: `rotateY(${i * step}deg) translateZ(${dims.radius}px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 10,
                    padding: "7px 0",
                    background: "#0d0e13",
                  }}
                  aria-hidden="true"
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#05060a",
                      border: "1px solid #2c2d38",
                    }}
                  />
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#05060a",
                      border: "1px solid #2c2d38",
                    }}
                  />
                </div>

                <div
                  ref={(el) => {
                    cardFaceRefs.current[i] = el;
                  }}
                  style={{ position: "relative", flex: 1, overflow: "hidden" }}
                />

                {i === activeIndex && (
                  <button
                    type="button"
                    onClick={() => {
                      interactiveRef.current = !interactiveRef.current;
                      setInteractive(interactiveRef.current);
                    }}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      fontSize: 11,
                      color: "#F5F3EF",
                      background: "rgba(20,21,28,0.85)",
                      border: "1px solid #23242E",
                      borderRadius: 20,
                      padding: "4px 9px",
                      cursor: "pointer",
                    }}
                  >
                    {interactive ? "Release scroll" : "Click to interact"}
                  </button>
                )}

                <div
                  style={{
                    padding: "9px 11px",
                    fontSize: 12,
                    color: "#F5F3EF",
                    background: "#14151C",
                    borderTop: "1px solid #23242E",
                  }}
                >
                  {site.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <span
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 12,
            color: "#8B8D98",
            background: "rgba(20,21,28,0.85)",
            padding: "7px 13px",
            borderRadius: 20,
            whiteSpace: "nowrap",
          }}
        >
          {activeIndex + 1} / {N} — scroll to keep turning
        </span>
      </div>
    </div>
  );
}
