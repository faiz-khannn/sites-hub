import { Github, Linkedin, Mail } from "lucide-react";

export default function Contact({ profile }) {
  return (
    <footer id="contact" className="relative border-t border-line/60 px-6 sm:px-8 py-24 scroll-mt-20">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-ember mb-4">Contact</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-5">
          Let&rsquo;s build something together.
        </h2>
        <p className="text-sm sm:text-base text-muted mb-8">
          Have a project in mind, or just want to talk shop? My inbox is open.
        </p>

        {profile.socials?.email && (
          <a
            href={profile.socials.email}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ember text-base text-sm font-semibold hover:opacity-90 transition-opacity mb-10"
          >
            <Mail className="w-4 h-4" /> {profile.socials.email.replace("mailto:", "")}
          </a>
        )}

        <div className="flex items-center justify-center gap-4">
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
        </div>
      </div>

      <p className="text-center text-[11px] text-muted/60 mt-16">
        © {new Date().getFullYear()} {profile.name}. Built with Next.js &amp; Tailwind.
      </p>
    </footer>
  );
}
