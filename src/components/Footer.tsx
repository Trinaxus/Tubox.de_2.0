import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Github, Instagram, Mail, ChevronUp, ChevronDown } from 'lucide-react';

export const Footer = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <footer className="relative border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Centered toggle button at hairline */}
      <button
        type="button"
        aria-label={expanded ? 'Footer einklappen' : 'Footer ausklappen'}
        onClick={() => setExpanded(v => !v)}
        className="group absolute -top-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center justify-center p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-6 w-6 animate-arrow-pulse" />
        ) : (
          <ChevronUp className="h-6 w-6 animate-arrow-pulse" />
        )}
      </button>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8">
        {/* Compact bar on desktop with toggle */}
        <div className="hidden md:flex items-center justify-center py-3">
          <button
            className="group inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Footer einklappen' : 'Footer ausklappen'}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary">
              <span className="tracking-wide">Made with</span>
              <Heart className="h-3 w-3 text-red-500 fill-current" />
              <span className="tracking-wide">for Dennis Lach Photography</span>
            </span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 animate-pulse" />
            ) : (
              <ChevronUp className="h-4 w-4 animate-pulse" />
            )}
          </button>
        </div>

        {/* Mobile tagline always visible */}
        <div className="flex md:hidden items-center justify-center py-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <span className="tracking-wide text-sm">Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span className="tracking-wide text-sm">for Dennis Lach Photography</span>
          </div>
        </div>

        {/* Link sections: collapsible on all breakpoints (mobile too) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 text-sm justify-items-center overflow-hidden transition-[max-height,opacity] duration-300 ${expanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} md:px-2`}>
          {/* Navigation */}
          <div className="space-y-3 w-full max-w-xs text-left">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Navigation</div>
            <div className="grid grid-cols-2 gap-2 justify-items-start">
              <Link to="/" className="hover:text-foreground transition-colors">Portfolio</Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-3 w-full max-w-xs text-left">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Rechtliches</div>
            <div className="grid grid-cols-2 gap-2 justify-items-start">
              <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
              <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-3 w-full max-w-xs text-left">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Social</div>
            <div className="grid grid-cols-2 gap-2 justify-items-start">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-2 justify-self-start">
                <Github className="h-4 w-4" /> GitHub
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-2 justify-self-start">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
              <a href="mailto:contact@tubox.de" className="hover:text-foreground transition-colors inline-flex items-center gap-2 col-span-2 sm:col-span-1 justify-self-start">
                <Mail className="h-4 w-4" /> Kontakt
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar (collapsible on all breakpoints) */}
        <div
          className={`border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground overflow-hidden transition-[max-height,opacity,margin,padding] duration-300
            ${expanded
              ? 'mt-8 pt-6 pb-6 max-h-[200px] opacity-100'
              : 'mt-0 pt-0 pb-0 max-h-0 opacity-0 pointer-events-none'}`}
        >
          <div className="order-2 md:order-1"> {new Date().getFullYear()} Dennis Lach Photography • Alle Rechte vorbehalten</div>
          <div className="order-1 md:order-2 inline-flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary/60" />
            <span className="tracking-wider">Leipzig, Germany</span>
          </div>
        </div>
      </div>
    </footer>
  );
};