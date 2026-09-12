export default function About({ profile }) {
  return (
    <section id="about" className="relative max-w-5xl mx-auto px-6 sm:px-8 py-24 scroll-mt-20">
      <div className="grid md:grid-cols-[220px_1fr] gap-10 items-start">
        <div className="flex md:flex-col items-center md:items-start gap-4">
          <div className="w-24 h-24 md:w-full md:h-auto md:aspect-square rounded-3xl bg-surface border border-line flex items-center justify-center font-display font-bold text-4xl text-ember shrink-0">
            {profile.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{profile.name}</p>
            <p className="text-xs text-muted">
              {profile.role}
              {profile.location ? ` · ${profile.location}` : ""}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-ember mb-4">About</p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-5">
            A developer who ships.
          </h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed mb-8">{profile.bio}</p>

          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface border border-line text-ink/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
