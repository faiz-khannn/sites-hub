import sites from "../data/sites.json";
import RolodexDrum from "../components/RolodexDrum.js";

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

export default function Home() {
  const sitesWithAccent = sites.map((site) => ({
    ...site,
    accent: CATEGORY_COLORS[site.category] || FALLBACK_COLOR,
  }));

  return (
    <main className="relative">
      <header className="relative mx-auto max-w-2xl px-6 pt-20 sm:px-10">
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
          Keep scrolling — the rack turns as you go. Click the front card to use
          that site directly, or open it in its own tab.
        </p>
      </header>

      <RolodexDrum sites={sitesWithAccent} />

      {/* Plain link list: the 3D drum isn't navigable by screen readers, search
          engines, or anyone with JS disabled, so this keeps every site reachable. */}
      <nav
        aria-label="All sites"
        className="mx-auto max-w-3xl px-6 pb-24 pt-8 sm:px-10"
      >
        <h2 className="mb-6 text-sm text-muted">All sites</h2>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {sitesWithAccent.map((site) => (
            <li key={site.url} className="flex items-baseline gap-3">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: site.accent }}
                aria-hidden="true"
              />
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink underline decoration-line underline-offset-4 hover:decoration-ember"
              >
                {site.name}
              </a>
              <span className="text-xs text-muted">{site.category}</span>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
