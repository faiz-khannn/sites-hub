import sites from "../data/sites.json";
import SiteCard from "../components/SiteCard";

// Each category gets its own color, like tabs in a card catalog.
const CATEGORY_COLORS = {
  "Web App": "#5EEAD4",
  Tool: "#FBBF77",
  Education: "#93C5FD",
  Dashboard: "#D8B4FE",
  Game: "#FF8B6A",
  Gallery: "#F5A9C4",
  Business: "#86EFAC",
  Portfolio: "#FCD34D",
};
const FALLBACK_COLOR = "#9AA0A8";

function groupByCategory(items) {
  const map = new Map();
  items.forEach((site) => {
    const cat = site.category || "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(site);
  });
  return Array.from(map.entries());
}

export default function Home() {
  const groups = groupByCategory(sites);
  let globalIndex = 0;

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-20 sm:px-10">
      {/* one deliberate glow, only behind the header */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-[0.16] blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, #FF6B4A 0%, #6C4CFF 55%, transparent 75%)",
        }}
      />

      <header className="relative mb-20 max-w-2xl">
        <div className="mb-6 flex items-baseline gap-4">
          <span className="font-display text-7xl leading-none text-ink sm:text-8xl">
            {sites.length}
          </span>
          <span className="pb-1 text-sm text-muted">
            sites built, shipped, and running live
          </span>
        </div>
        <h1 className="font-display text-3xl leading-[1.15] text-ink sm:text-4xl">
          Everything I&rsquo;ve made, in one place.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          Every card below is the live site, not a screenshot. Click into one to
          use it directly, or open it in its own tab.
        </p>
      </header>

      {groups.map(([category, items]) => {
        const color = CATEGORY_COLORS[category] || FALLBACK_COLOR;
        return (
          <section key={category} className="relative mb-16">
            <div className="mb-6 flex items-center gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: color }}
                aria-hidden="true"
              />
              <h2 className="text-sm text-ink">{category}</h2>
              <div className="h-px flex-1 bg-line" />
              <span className="tabular text-xs text-muted">{items.length}</span>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((site) => {
                const i = globalIndex;
                globalIndex += 1;
                return (
                  <SiteCard
                    key={site.url}
                    site={site}
                    index={i}
                    accent={color}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
