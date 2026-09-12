import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";

export default function Hero({ profile }) {
  return (
    <section
      id="top"
      className="relative min-h-screen flex flex-col justify-center px-6 sm:px-8 pt-24 pb-16 scroll-mt-16"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 20%, rgba(255,107,74,0.09), transparent 70%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {profile.eyebrow && (
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-ember mb-5">
            {profile.eyebrow}
          </p>
        )}

        <h1 className="font-display font-semibold text-4xl sm:text-6xl md:text-7xl text-ink leading-[1.05] mb-6">
          {profile.name}
        </h1>

        <p className="text-lg sm:text-xl text-ink/90 font-display mb-5">{profile.tagline}</p>

        <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          {profile.bio}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <a
            href="#work"
            className="px-6 py-2.5 rounded-full bg-ember text-base text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            View my work
          </a>
          <a
            href="#contact"
            className="px-6 py-2.5 rounded-full border border-line text-ink text-sm font-semibold hover:border-muted transition-colors"
          >
            Get in touch
          </a>
        </div>

        <div className="flex items-center justify-center gap-4 mb-16">
          {profile.socials?.github && (
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-surface border border-line text-muted hover:text-ink hover:border-muted transition-colors"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {profile.socials?.linkedin && (
            <a
              href={profile.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-surface border border-line text-muted hover:text-ink hover:border-muted transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          {profile.socials?.email && (
            <a
              href={profile.socials.email}
              className="p-2.5 rounded-full bg-surface border border-line text-muted hover:text-ink hover:border-muted transition-colors"
              title="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>

        {profile.stats?.length > 0 && (
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {profile.stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display font-bold text-2xl sm:text-3xl text-ink mb-1">
                  {stat.value}
                </div>
                <div className="text-[11px] text-muted uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted/60 animate-bounce-hint">
        <span className="text-[10px] uppercase tracking-wider">Scroll</span>
        <ArrowDown className="w-4 h-4" />
      </div>
    </section>
  );
}
