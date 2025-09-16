import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Heart, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for Dennis Lach Photography
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/datenschutz" className="hover:text-foreground transition-colors">
              Datenschutz
            </Link>
            <Link to="/impressum" className="hover:text-foreground transition-colors">
              Impressum
            </Link>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <span>2025</span>
          </div>
        </div>
      </div>
    </footer>
  );
};