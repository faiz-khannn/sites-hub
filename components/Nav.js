"use client";

import { useState } from "react";
import { Menu, X as XIcon, Github, Linkedin, Mail } from "lucide-react";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function Nav({ profile }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-base/70 backdrop-blur-md border-b border-line/50">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-5 sm:px-8">
        <a href="#top" className="font-display font-bold text-ink text-lg tracking-tight">
          {profile.name}
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {profile.socials?.github && (
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-ink transition-colors"
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
              className="text-muted hover:text-ink transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          <a
            href="#contact"
            className="px-4 py-1.5 rounded-full bg-ember text-base text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Get in touch
          </a>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="md:hidden text-ink p-1" aria-label="Toggle menu">
          {open ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line/50 bg-base/95 backdrop-blur-md px-5 py-4 flex flex-col gap-4">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-ink">
              {l.label}
            </a>
          ))}
          <div className="flex items-center gap-4 pt-3 border-t border-line/50">
            {profile.socials?.github && (
              <a href={profile.socials.github} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 text-muted" />
              </a>
            )}
            {profile.socials?.linkedin && (
              <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4 text-muted" />
              </a>
            )}
            {profile.socials?.email && (
              <a href={profile.socials.email}>
                <Mail className="w-4 h-4 text-muted" />
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
