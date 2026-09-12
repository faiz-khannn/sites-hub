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
    <main className="relative w-full min-h-screen bg-base text-ink">
      <RolodexDrum sites={sitesWithAccent} />
    </main>
  );
}
