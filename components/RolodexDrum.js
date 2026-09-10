"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ExternalLink,
  Maximize2,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers,
  MousePointer,
  RotateCw,
  Grid,
  X,
  List,
  Sparkles
} from "lucide-react";

const VIRTUAL_WIDTH = 1360;
const VIRTUAL_HEIGHT = 880;

// High-fidelity fallback preview card generator
function CardFallback({ site }) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-6 select-none"
      style={{
        background: `radial-gradient(circle at 50% 20%, ${site.accent}25 0%, #10121A 75%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
          style={{ background: site.accent, color: "#0A0B10" }}
        >
          {site.category}
        </span>
        <span className="text-[10px] font-mono text-muted/70 bg-surface/80 px-2 py-0.5 rounded border border-line">
          {site.embeddable ? "Live Preview Ready" : "External Site"}
        </span>
      </div>

      <div className="my-auto text-center py-4">
        <div
          className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold font-display shadow-lg mb-3 border border-white/10"
          style={{ background: `${site.accent}20`, color: site.accent }}
        >
          {site.name.charAt(0)}
        </div>
        <h3 className="text-xl font-bold text-ink mb-1.5 line-clamp-1">{site.name}</h3>
        <p className="text-xs text-muted max-w-[220px] mx-auto line-clamp-2 leading-relaxed">
          {site.description}
        </p>
      </div>

      <div className="pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-muted">
        <span className="truncate max-w-[150px] font-mono opacity-80">
          {site.url.replace("https://", "")}
        </span>
        <span className="flex items-center gap-1 text-ember font-medium">
          Preview <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export default function RolodexDrum({ sites }) {
  const stageRef = useRef(null);
  const drumRef = useRef(null);
  const cardShellRefs = useRef([]);
  const cardFaceRefs = useRef([]);
  const loadedRef = useRef(new Set());
  
  // Rotation animation refs for smooth wheel lerping
  const targetRotationRef = useRef(0);
  const currentRotationRef = useRef(0);
  const activeIndexRef = useRef(0);
  const animFrameRef = useRef(null);

  // States
  const [mode, setMode] = useState("vertical"); // "vertical" (Rolodex wheel), "horizontal" (Carousel drum), "grid"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactiveIndex, setInteractiveIndex] = useState(null);
  const [modalSite, setModalSite] = useState(null);
  const [showDirectory, setShowDirectory] = useState(false);
  const [iframeErrors, setIframeErrors] = useState({});

  // Touch & Drag state
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef(0);
  const dragStartRotRef = useRef(0);

  // Responsive dimensions
  const [dims, setDims] = useState({ cardW: 340, cardH: 460, radius: 650 });

  // Categories list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(sites.map((s) => s.category)));
    return ["All", ...cats];
  }, [sites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesCategory =
        selectedCategory === "All" || site.category === selectedCategory;
      const matchesSearch =
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [sites, selectedCategory, searchQuery]);

  const N = filteredSites.length;
  const step = N > 0 ? 360 / N : 0;

  // Responsive scaling setup
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const height = entries[0].contentRect.height || window.innerHeight;
      
      const isMobile = width < 640;
      const cardW = isMobile
        ? Math.min(290, width * 0.82)
        : Math.min(380, Math.max(280, width * 0.3));
      const cardH = mode === "vertical" ? cardW * 1.32 : cardW * 1.25;
      
      // Radius calculation for 3D wheel
      const minRadius = mode === "vertical" ? cardH * 1.05 : cardW * 1.05;
      const radius = Math.max(
        (mode === "vertical" ? cardH : cardW) / (2 * Math.tan(Math.PI / Math.max(N, 6))),
        minRadius
      );

      setDims({ cardW, cardH, radius });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [N, mode]);

  // Lazy loading iframes into card slots
  const setFaceContent = useCallback(
    (index, shouldLoad) => {
      const face = cardFaceRefs.current[index];
      const site = filteredSites[index];
      if (!face || !site) return;

      const isLoaded = loadedRef.current.has(index);

      if (shouldLoad && !isLoaded) {
        loadedRef.current.add(index);
        face.innerHTML = "";

        const container = document.createElement("div");
        container.style.cssText = `
          width: 100%; height: 100%; position: relative; overflow: hidden; background: #0A0B10;
        `;

        const scaleX = dims.cardW / VIRTUAL_WIDTH;
        const scaleY = (dims.cardH - 85) / VIRTUAL_HEIGHT;

        const wrap = document.createElement("div");
        wrap.style.cssText = `
          width: ${VIRTUAL_WIDTH}px;
          height: ${VIRTUAL_HEIGHT}px;
          transform: scale(${scaleX}, ${scaleY});
          transform-origin: top left;
          pointer-events: none;
          user-select: none;
        `;
        wrap.setAttribute("data-iframe-wrap", "true");

        const iframe = document.createElement("iframe");
        iframe.src = site.url;
        iframe.title = site.name;
        iframe.loading = "lazy";
        iframe.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";
        iframe.style.cssText = `
          width: ${VIRTUAL_WIDTH}px;
          height: ${VIRTUAL_HEIGHT}px;
          border: 0;
          pointer-events: none;
          background: #ffffff;
        `;
        iframe.setAttribute("data-iframe", "true");

        iframe.onerror = () => {
          setIframeErrors((prev) => ({ ...prev, [site.url]: true }));
        };

        wrap.appendChild(iframe);
        container.appendChild(wrap);
        face.appendChild(container);
      } else if (!shouldLoad && isLoaded) {
        loadedRef.current.delete(index);
        face.innerHTML = "";
      }
    },
    [filteredSites, dims.cardW, dims.cardH]
  );

  // Render loop using lerp for silky smooth 60fps wheel rotation
  const renderDrum = useCallback(() => {
    const drum = drumRef.current;
    if (!drum || N === 0 || mode === "grid") return;

    // Smooth lerp rotation towards target
    currentRotationRef.current += (targetRotationRef.current - currentRotationRef.current) * 0.12;
    const rot = currentRotationRef.current;

    if (mode === "vertical") {
      drum.style.transform = `rotateX(${rot}deg)`;
    } else {
      drum.style.transform = `rotateY(${-rot}deg)`;
    }

    let bestIndex = 0;
    let maxFrontness = -Infinity;

    for (let i = 0; i < N; i += 1) {
      const angle =
        mode === "vertical"
          ? (i * step - rot) % 360
          : (i * step + rot) % 360;
      const normalizedAngle = ((angle + 180) % 360) - 180;
      const rad = (normalizedAngle * Math.PI) / 180;
      const frontness = Math.cos(rad);

      const el = cardShellRefs.current[i];
      if (el) {
        const opacity = Math.max(0.12, (frontness + 1) / 2);
        el.style.opacity = opacity;
        
        if (frontness > 0.94) {
          el.style.borderColor = filteredSites[i]?.accent || "#FF6B4A";
          el.style.boxShadow = `0 25px 60px rgba(0,0,0,0.85), 0 0 35px ${filteredSites[i]?.accent || "#FF6B4A"}40`;
        } else {
          el.style.borderColor = "#23242E";
          el.style.boxShadow = "0 20px 45px rgba(0,0,0,0.7)";
        }
      }

      setFaceContent(i, frontness > 0.35);

      if (frontness > maxFrontness) {
        maxFrontness = frontness;
        bestIndex = i;
      }
    }

    if (bestIndex !== activeIndexRef.current) {
      activeIndexRef.current = bestIndex;
      setActiveIndex(bestIndex);
    }
  }, [N, step, mode, setFaceContent, filteredSites]);

  // Animation frame ticker loop
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      renderDrum();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderDrum]);

  // Mouse wheel listener attached to stage/window for effortless drum spinning
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return undefined;

    const handleWheel = (e) => {
      // If interactive preview mode is locked on the active card, let iframe consume wheel
      if (interactiveIndex !== null) return;

      e.preventDefault();

      // Normalize delta
      const delta = e.deltaY;
      const sensitivity = 0.25;

      targetRotationRef.current += delta * sensitivity;
    };

    stageEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => stageEl.removeEventListener("wheel", handleWheel);
  }, [interactiveIndex]);

  // Also enable window wheel listener when not scrolling grid
  useEffect(() => {
    if (mode === "grid" || interactiveIndex !== null) return undefined;

    const handleWindowWheel = (e) => {
      // Only hijack if user isn't scrolling inside directory or modal
      if (showDirectory || modalSite) return;
      e.preventDefault();
      const sensitivity = 0.25;
      targetRotationRef.current += e.deltaY * sensitivity;
    };

    window.addEventListener("wheel", handleWindowWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWindowWheel);
  }, [mode, interactiveIndex, showDirectory, modalSite]);

  // Keyboard navigation (Arrow keys, PageUp/PageDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modalSite || showDirectory || interactiveIndex !== null) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        rotateToCard(activeIndexRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        rotateToCard(activeIndexRef.current - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalSite, showDirectory, interactiveIndex, N]);

  // Pointer/Touch Drag handlers for turning the wheel directly
  const handlePointerDown = (e) => {
    if (mode === "grid" || interactiveIndex !== null) return;
    isDraggingRef.current = true;
    dragStartPosRef.current = mode === "vertical" ? e.clientY : e.clientX;
    dragStartRotRef.current = targetRotationRef.current;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const currentPos = mode === "vertical" ? e.clientY : e.clientX;
    const delta = dragStartPosRef.current - currentPos;
    const sensitivity = 0.6;
    targetRotationRef.current = dragStartRotRef.current + delta * sensitivity;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Jump smoothly to a specific card index
  const rotateToCard = useCallback(
    (index) => {
      if (N === 0) return;
      const clampedIndex = (index + N) % N;
      targetRotationRef.current = clampedIndex * step;
      setActiveIndex(clampedIndex);
      activeIndexRef.current = clampedIndex;
    },
    [N, step]
  );

  // Enable/disable interactive pointer events for active card iframe
  useEffect(() => {
    cardShellRefs.current.forEach((face, idx) => {
      if (!face) return;
      const wrap = face.querySelector("[data-iframe-wrap]");
      const iframe = face.querySelector("[data-iframe]");
      if (wrap && iframe) {
        if (idx === interactiveIndex) {
          wrap.style.pointerEvents = "auto";
          iframe.style.pointerEvents = "auto";
        } else {
          wrap.style.pointerEvents = "none";
          iframe.style.pointerEvents = "none";
        }
      }
    });
  }, [interactiveIndex]);

  // Reset indices on filter/search change
  useEffect(() => {
    setActiveIndex(0);
    activeIndexRef.current = 0;
    targetRotationRef.current = 0;
    currentRotationRef.current = 0;
    loadedRef.current.clear();
    setInteractiveIndex(null);
  }, [filteredSites.length, selectedCategory, searchQuery]);

  const activeSite = filteredSites[activeIndex] || filteredSites[0];

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Header Bar & Control Panel */}
      <header className="relative z-40 px-4 sm:px-8 pt-4 pb-2 border-b border-line/50 bg-base/80 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Title & Count Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="font-display font-bold text-lg sm:text-xl text-ink tracking-tight">
                Sites Hub
              </h1>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface border border-line text-ember font-semibold">
              {sites.length} Live Sites
            </span>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by name, category, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface/80 border border-line rounded-xl pl-9 pr-8 py-1.5 text-xs sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Toggles & Directory Trigger */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-line">
              <button
                onClick={() => setMode("vertical")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  mode === "vertical"
                    ? "bg-ember text-base font-semibold shadow-md"
                    : "text-muted hover:text-ink hover:bg-base/50"
                }`}
                title="3D Rolodex Wheel (Vertical Scroll)"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rolodex</span>
              </button>
              <button
                onClick={() => setMode("horizontal")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  mode === "horizontal"
                    ? "bg-ember text-base font-semibold shadow-md"
                    : "text-muted hover:text-ink hover:bg-base/50"
                }`}
                title="3D Drum Carousel (Horizontal Spin)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drum</span>
              </button>
              <button
                onClick={() => setMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  mode === "grid"
                    ? "bg-ember text-base font-semibold shadow-md"
                    : "text-muted hover:text-ink hover:bg-base/50"
                }`}
                title="Flat Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            <button
              onClick={() => setShowDirectory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-line text-xs font-medium text-muted hover:text-ink hover:border-muted transition-all"
              title="View All Sites Directory"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Directory</span>
            </button>
          </div>

        </div>

        {/* Category Pills Bar */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? "bg-ink text-base border-ink font-semibold shadow-md scale-105"
                  : "bg-surface/50 text-muted border-line/70 hover:text-ink hover:border-muted/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Main 3D Drum Wheel Canvas Container */}
      <main className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center select-none">
        
        {/* Environment Backdrop Light Glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-1000"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${
              activeSite?.accent || "#FF6B4A"
            }15, transparent 70%), radial-gradient(ellipse 90% 70% at 50% 100%, #161722 0%, #0A0B10 85%)`,
          }}
        />

        {mode === "grid" ? (
          /* FLAT GRID VIEW */
          <div className="relative z-10 w-full h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredSites.map((site) => (
                <div
                  key={site.url}
                  className="group relative bg-surface/90 border border-line rounded-2xl overflow-hidden hover:border-ember/60 transition-all duration-300 shadow-xl flex flex-col"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-base/80 border-b border-line text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[11px] font-mono text-muted/70 truncate max-w-[140px]">
                      {site.name}
                    </span>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-ember transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="relative h-56 bg-base overflow-hidden">
                    {site.embeddable && !iframeErrors[site.url] ? (
                      <iframe
                        src={site.url}
                        title={site.name}
                        loading="lazy"
                        className="w-[1280px] h-[800px] origin-top-left scale-[0.27] pointer-events-none border-0"
                      />
                    ) : (
                      <CardFallback site={site} />
                    )}
                  </div>

                  <div className="p-4 bg-surface flex flex-col justify-between flex-1 border-t border-line">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-semibold text-ink text-sm group-hover:text-ember transition-colors">
                          {site.name}
                        </h4>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${site.accent}20`, color: site.accent }}
                        >
                          {site.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {site.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-line/50 flex items-center justify-between">
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
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 3D ROLODEX STAGE */
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            style={{
              perspective: dims.radius * 2.5,
            }}
          >
            {/* Instruction Banner overlay on stage */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-surface/70 border border-line/60 text-[11px] text-muted backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-ember" />
              <span>Scroll anywhere or drag cards to spin the drum</span>
            </div>

            {/* 3D Revolving Drum */}
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
                const isVertical = mode === "vertical";
                const transformStr = isVertical
                  ? `rotateX(${-angle}deg) translateZ(${dims.radius}px)`
                  : `rotateY(${angle}deg) translateZ(${dims.radius}px)`;

                const isActive = i === activeIndex;

                return (
                  <div
                    key={site.url}
                    ref={(el) => (cardShellRefs.current[i] = el)}
                    className={`absolute inset-0 rounded-2xl overflow-hidden bg-surface border transition-all duration-300 backface-hidden flex flex-col ${
                      isActive ? "glow-active ring-1 ring-white/20" : "glow-card"
                    }`}
                    style={{
                      width: dims.cardW,
                      height: dims.cardH,
                      transform: transformStr,
                    }}
                  >
                    {/* Browser Chrome Header */}
                    <div className="flex items-center justify-between px-3.5 py-2 bg-base/90 border-b border-line text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-0.5 bg-surface/80 rounded-md border border-line text-[11px] font-mono text-muted/80 truncate max-w-[160px]">
                        <Lock className="w-3 h-3 text-green-400 shrink-0" />
                        <span className="truncate">{site.url.replace("https://", "")}</span>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: site.accent }}
                      />
                    </div>

                    {/* Live Preview Container / Face */}
                    <div className="relative flex-1 bg-base overflow-hidden">
                      <div
                        ref={(el) => (cardFaceRefs.current[i] = el)}
                        className="w-full h-full"
                      >
                        <CardFallback site={site} />
                      </div>

                      {/* Interactive Mode Overlay */}
                      {isActive && interactiveIndex !== i && (
                        <div className="absolute inset-0 bg-base/10 backdrop-blur-[1px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-t from-base/90 via-transparent to-transparent p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInteractiveIndex(i);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-ember text-base font-bold text-xs shadow-xl hover:scale-105 transition-transform"
                          >
                            <MousePointer className="w-3.5 h-3.5" /> Click to Interact
                          </button>
                        </div>
                      )}

                      {isActive && interactiveIndex === i && (
                        <div className="absolute top-2 right-2 z-30">
                          <button
                            onClick={() => setInteractiveIndex(null)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-base/90 border border-line text-[11px] text-ink shadow-lg"
                          >
                            <RotateCw className="w-3 h-3 text-ember" /> Release Scroll
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Footer info bar */}
                    <div className="px-4 py-2.5 bg-surface border-t border-line flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <h4 className="font-bold text-ink truncate text-sm">
                          {site.name}
                        </h4>
                        <span className="text-[11px] text-muted truncate block">
                          {site.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setModalSite(site)}
                          className="p-1.5 rounded-lg bg-base/80 border border-line text-muted hover:text-ink hover:border-muted transition-colors"
                          title="Fullscreen Preview"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-ember text-base font-bold hover:opacity-90 transition-opacity"
                          title="Open site in new tab"
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
        )}

        {/* Bottom Position Scrubber & Controls */}
        {mode !== "grid" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 glass-panel bg-surface/90 border border-line/80 px-4 py-1.5 rounded-full shadow-2xl">
              <button
                onClick={() => rotateToCard(activeIndex - 1)}
                className="p-1 text-muted hover:text-ink transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-ink font-semibold">
                <span className="text-ember">{activeIndex + 1}</span> / {N}
              </span>
              <button
                onClick={() => rotateToCard(activeIndex + 1)}
                className="p-1 text-muted hover:text-ink transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Scrubber dots */}
            <div className="flex items-center gap-1 max-w-xs overflow-x-auto py-1 px-2 no-scrollbar">
              {filteredSites.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => rotateToCard(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeIndex
                      ? "w-5 bg-ember"
                      : "w-1.5 bg-line hover:bg-muted/60"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen Live Preview Modal */}
      {modalSite && (
        <div className="fixed inset-0 z-50 bg-base/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          <div className="relative w-full max-w-6xl h-[88vh] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-base border-b border-line">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <h3 className="font-bold text-ink text-sm flex items-center gap-2">
                  {modalSite.name}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${modalSite.accent}20`, color: modalSite.accent }}
                  >
                    {modalSite.category}
                  </span>
                </h3>
              </div>
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
              <iframe
                src={modalSite.url}
                title={modalSite.name}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Directory Modal Drawer */}
      {showDirectory && (
        <div className="fixed inset-0 z-50 bg-base/80 backdrop-blur-md flex justify-end animate-fadeIn">
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
                  onClick={() => {
                    rotateToCard(index);
                    setShowDirectory(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-base/50 border border-line/60 hover:border-ember/60 hover:bg-base cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: site.accent }}
                    />
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
    </div>
  );
}
