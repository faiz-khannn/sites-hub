"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ExternalLink,
  Maximize2,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Film,
  X,
  List,
  CheckCircle2,
} from "lucide-react";

// How much scroll (as a fraction of viewport height) is allocated to each card
// while the 3D stage is pinned. Lower = shorter scroll, snappier; higher = more
// breathing room per project.
const SEGMENT_RATIO = 0.55;

// ---------------------------------------------------------------------------
// Designed fallback card face. This is the ONLY thing rendered inside the
// scroll-rail and grid cards. Real live sites are only ever embedded inside
// the fullscreen preview modal — most hosts (Vercel/Netlify/etc.) send
// X-Frame-Options / CSP headers that silently block being iframed from
// another origin, so auto-embedding 30+ live sites inside spinning 3D cards
// produced blank boxes and heavy jank. A single, consistent, fast card face
// is more reliable and looks more intentional — and reads as an achievement
// badge rather than a broken preview.
// ---------------------------------------------------------------------------
function CardFace({ site, index, total }) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-6 select-none overflow-hidden"
      style={{
        background: `radial-gradient(circle at 50% 15%, ${site.accent}22 0%, #10121A 70%)`,
      }}
    >
      {/* sprocket-hole strip, film-reel motif */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 flex flex-col justify-around py-3 opacity-40">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 mx-auto rounded-[2px] bg-line" />
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-2.5 flex flex-col justify-around py-3 opacity-40">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 mx-auto rounded-[2px] bg-line" />
        ))}
      </div>

      <div className="flex items-center justify-between pl-3 pr-3">
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
          style={{ background: site.accent, color: "#0A0B10" }}
        >
          {site.category}
        </span>
        <span className="text-[10px] font-mono text-muted/60 tabular">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="my-auto text-center py-4 px-3">
        <div
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold font-display shadow-lg mb-4 border border-white/10"
          style={{ background: `${site.accent}20`, color: site.accent }}
        >
          {site.name.charAt(0)}
        </div>
        <h3 className="text-xl font-bold text-ink mb-2 font-display line-clamp-1">
          {site.name}
        </h3>
        <p className="text-xs text-muted max-w-[230px] mx-auto line-clamp-2 leading-relaxed">
          {site.description}
        </p>
      </div>

      <div className="pt-3 border-t border-line/60 flex items-center justify-between text-[11px] pl-3 pr-3">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3 h-3" /> Live
        </span>
        <span className="flex items-center gap-1 text-ember font-medium shrink-0">
          Preview <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export default function RolodexDrum({ sites }) {
  const outerRef = useRef(null); // tall scroll-length container
  const stageRef = useRef(null); // sticky, pinned 100vh viewport
  const drumRef = useRef(null); // the rotating 3D drum
  const cardShellRefs = useRef([]);

  const targetRotationRef = useRef(0);
  const currentRotationRef = useRef(0);
  const activeIndexRef = useRef(0);
  const rafRef = useRef(null);

  const [mode, setMode] = useState("rail"); // "rail" (3D scroll drum) | "grid"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalSite, setModalSite] = useState(null);
  const [showDirectory, setShowDirectory] = useState(false);
  const [dims, setDims] = useState({ cardW: 340, cardH: 460, radius: 650 });
  const [railHeight, setRailHeight] = useState(0);

  // Respect reduced-motion preference: default straight to grid.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setMode("grid");
    }
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(sites.map((s) => s.category)));
    return ["All", ...cats];
  }, [sites]);

  const filteredSites = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sites.filter((site) => {
      const matchesCategory = selectedCategory === "All" || site.category === selectedCategory;
      const matchesSearch =
        site.name.toLowerCase().includes(q) ||
        site.description.toLowerCase().includes(q) ||
        site.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [sites, selectedCategory, searchQuery]);

  const N = filteredSites.length;
  const step = N > 0 ? 360 / N : 0;

  // ---- Responsive card + rail sizing -------------------------------------
  useEffect(() => {
    const recompute = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isMobile = vw < 640;

      const cardW = isMobile ? Math.min(280, vw * 0.78) : Math.min(380, Math.max(300, vw * 0.24));
      const cardH = Math.min(vh * 0.6, cardW * 1.32);

      const minRadius = cardH * 1.05;
      const radius = Math.max(
        cardH / (2 * Math.tan(Math.PI / Math.max(N, 6))),
        minRadius
      );

      setDims({ cardW, cardH, radius });
      setRailHeight(N > 0 ? N * vh * SEGMENT_RATIO + vh : vh);
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [N]);

  // ---- Reset scroll position whenever the filtered set changes ----------
  useEffect(() => {
    targetRotationRef.current = 0;
    currentRotationRef.current = 0;
    activeIndexRef.current = 0;
    setActiveIndex(0);
    if (mode === "rail" && outerRef.current) {
      const top = outerRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "auto" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N, selectedCategory, searchQuery]);

  // ---- Core render loop: reads real scroll progress every frame ---------
  const getProgress = useCallback(() => {
    const el = outerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height - vh;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / total));
  }, []);

  const renderFrame = useCallback(() => {
    if (mode !== "rail" || N === 0) return;

    const progress = getProgress();
    const virtualIndex = progress * (N - 1);
    targetRotationRef.current = virtualIndex * step;

    currentRotationRef.current += (targetRotationRef.current - currentRotationRef.current) * 0.14;
    const rot = currentRotationRef.current;

    const drum = drumRef.current;
    if (drum) drum.style.transform = `rotateX(${rot}deg)`;

    let bestIndex = 0;
    let maxFrontness = -Infinity;

    for (let i = 0; i < N; i += 1) {
      const angle = (i * step - rot) % 360;
      const normalized = ((angle + 180) % 360) - 180;
      const rad = (normalized * Math.PI) / 180;
      const frontness = Math.cos(rad);

      const el = cardShellRefs.current[i];
      if (el) {
        const opacity = Math.max(0.1, (frontness + 1) / 2);
        el.style.opacity = opacity;
        el.style.pointerEvents = frontness > 0.94 ? "auto" : "none";
        if (frontness > 0.94) {
          const accent = filteredSites[i]?.accent || "#FF6B4A";
          el.style.borderColor = accent;
          el.style.boxShadow = `0 25px 60px rgba(0,0,0,0.85), 0 0 35px ${accent}40`;
        } else {
          el.style.borderColor = "#23242E";
          el.style.boxShadow = "0 20px 45px rgba(0,0,0,0.7)";
        }
      }

      if (frontness > maxFrontness) {
        maxFrontness = frontness;
        bestIndex = i;
      }
    }

    if (bestIndex !== activeIndexRef.current) {
      activeIndexRef.current = bestIndex;
      setActiveIndex(bestIndex);
    }
  }, [N, step, mode, getProgress, filteredSites]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      renderFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  // ---- Programmatic navigation (dots, arrows, directory, keyboard) ------
  const scrollToIndex = useCallback(
    (index) => {
      if (N === 0 || !outerRef.current) return;
      const clamped = Math.max(0, Math.min(N - 1, index));
      const rect = outerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const targetTop = window.scrollY + rect.top + (total * clamped) / Math.max(N - 1, 1);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    },
    [N]
  );

  const goToDirectoryItem = useCallback(
    (globalIndex) => {
      const site = sites[globalIndex];
      const idxInFiltered = filteredSites.findIndex((s) => s.url === site.url);
      setShowDirectory(false);
      if (idxInFiltered === -1) return;
      if (mode !== "rail") setMode("rail");
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToIndex(idxInFiltered)));
    },
    [sites, filteredSites, mode, scrollToIndex]
  );

  // ---- Keyboard navigation -------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modalSite || showDirectory || mode !== "rail") return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        scrollToIndex(activeIndexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToIndex(activeIndexRef.current - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalSite, showDirectory, mode, scrollToIndex]);

  const activeSite = filteredSites[activeIndex] || filteredSites[0];

  return (
    <section id="work" className="relative scroll-mt-16">
      {/* ---------------- Section heading ---------------- */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 pt-20 pb-10 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-ember mb-4">Achievements</p>
        <h2 className="font-display text-3xl sm:text-5xl font-semibold text-ink leading-[1.1] mb-4">
          {sites.length} projects, shipped and live.
        </h2>
        <p className="text-sm sm:text-base text-muted max-w-xl mx-auto">
          Scroll to spin through them like a reel — tap Preview on any card for the live site.
        </p>
      </div>

      {/* ---------------- Sticky toolbar (search / filter / view) ---------------- */}
      <div className="sticky top-16 z-30 bg-base/85 backdrop-blur-md border-y border-line/50">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 sm:px-8 py-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface/80 border border-line rounded-lg pl-8 pr-7 py-1.5 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border shrink-0 ${
                  selectedCategory === cat
                    ? "bg-ink text-base border-ink font-semibold"
                    : "bg-surface/50 text-muted border-line/70 hover:text-ink hover:border-muted/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-line shrink-0">
            <button
              onClick={() => setMode("rail")}
              title="3D scroll rail"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mode === "rail" ? "bg-ember text-base font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode("grid")}
              title="Flat grid"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mode === "grid" ? "bg-ember text-base font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowDirectory(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-medium text-muted hover:text-ink hover:border-muted transition-all shrink-0"
          >
            <List className="w-3.5 h-3.5" /> Directory
          </button>
        </div>
      </div>

      {mode === "grid" ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site, i) => (
            <div
              key={site.url}
              className="group relative bg-surface/90 border border-line rounded-2xl overflow-hidden hover:border-ember/60 transition-all duration-300 shadow-xl flex flex-col"
            >
              <div className="relative h-56 bg-base overflow-hidden">
                <CardFace site={site} index={i} total={N} />
              </div>
              <div className="p-4 bg-surface border-t border-line flex items-center justify-between">
                <button
                  onClick={() => setModalSite(site)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Live Preview
                </button>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-ember hover:underline"
                >
                  Visit Site <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={outerRef} style={{ height: railHeight, position: "relative" }}>
          <div
            ref={stageRef}
            className="sticky top-16 h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden"
          >
            <div
              className="absolute inset-0 pointer-events-none transition-colors duration-700"
              style={{
                background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${
                  activeSite?.accent || "#FF6B4A"
                }14, transparent 70%), radial-gradient(ellipse 90% 70% at 50% 100%, #161722 0%, #0A0B10 85%)`,
              }}
            />

            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{ perspective: dims.radius * 2.5 }}
            >
              <div
                ref={drumRef}
                className="absolute preserve-3d will-change-transform"
                style={{
                  width: dims.cardW,
                  height: dims.cardH,
                  top: "50%",
                  left: "50%",
                  marginTop: -dims.cardH / 2,
                  marginLeft: -dims.cardW / 2,
                }}
              >
                {filteredSites.map((site, i) => {
                  const angle = i * step;
                  const transformStr = `rotateX(${-angle}deg) translateZ(${dims.radius}px)`;
                  const isActive = i === activeIndex;

                  return (
                    <div
                      key={site.url}
                      ref={(el) => (cardShellRefs.current[i] = el)}
                      className={`absolute inset-0 rounded-2xl overflow-hidden bg-surface border transition-colors duration-300 backface-hidden flex flex-col ${
                        isActive ? "glow-active ring-1 ring-white/20" : "glow-card"
                      }`}
                      style={{ width: dims.cardW, height: dims.cardH, transform: transformStr }}
                    >
                      <div className="flex-1 relative">
                        <CardFace site={site} index={i} total={N} />
                      </div>
                      <div className="px-4 py-2.5 bg-surface border-t border-line flex items-center justify-between text-xs shrink-0">
                        <h4 className="font-bold text-ink truncate text-sm mr-2">{site.name}</h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setModalSite(site)}
                            className="p-1.5 rounded-lg bg-base/80 border border-line text-muted hover:text-ink hover:border-muted transition-colors"
                            title="Fullscreen live preview"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-ember text-base font-bold hover:opacity-90 transition-opacity"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* position scrubber */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 bg-surface/90 border border-line/80 px-4 py-1.5 rounded-full shadow-2xl">
                <button onClick={() => scrollToIndex(activeIndex - 1)} className="p-1 text-muted hover:text-ink">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-ink font-semibold tabular">
                  <span className="text-ember">{activeIndex + 1}</span> / {N}
                </span>
                <button onClick={() => scrollToIndex(activeIndex + 1)} className="p-1 text-muted hover:text-ink">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Fullscreen live preview modal ---------------- */}
      {modalSite && (
        <div className="fixed inset-0 z-50 bg-base/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
          <div className="relative w-full max-w-6xl h-[88vh] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-base border-b border-line">
              <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                {modalSite.name}
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${modalSite.accent}20`, color: modalSite.accent }}
                >
                  {modalSite.category}
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={modalSite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-ember text-base hover:opacity-90 transition-opacity"
                >
                  Open Live Site <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setModalSite(null)}
                  className="p-1.5 text-muted hover:text-ink rounded-lg bg-surface border border-line"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="relative flex-1 bg-base">
              <iframe src={modalSite.url} title={modalSite.name} className="w-full h-full border-0" />
              <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted/70 bg-base/80 px-2 py-0.5 rounded">
                If this looks blank, the site blocks embedding — use &ldquo;Open Live Site&rdquo; above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Directory drawer ---------------- */}
      {showDirectory && (
        <div className="fixed inset-0 z-50 bg-base/80 backdrop-blur-md flex justify-end">
          <div className="relative w-full max-w-lg h-full bg-surface border-l border-line shadow-2xl flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <h2 className="text-lg font-bold font-display text-ink">Sites Directory</h2>
              <button
                onClick={() => setShowDirectory(false)}
                className="p-1.5 text-muted hover:text-ink rounded-lg bg-base border border-line"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {sites.map((site, index) => (
                <div
                  key={site.url}
                  onClick={() => goToDirectoryItem(index)}
                  className="flex items-center justify-between p-3 rounded-xl bg-base/50 border border-line/60 hover:border-ember/60 hover:bg-base cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: site.accent }} />
                    <div>
                      <h4 className="text-xs font-semibold text-ink">{site.name}</h4>
                      <p className="text-[10px] text-muted line-clamp-1">{site.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted bg-surface px-2 py-0.5 rounded border border-line">
                    {site.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
