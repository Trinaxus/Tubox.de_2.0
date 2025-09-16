import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Search, Sparkles, Shield, Home, Image, User } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-xl">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background to-accent/5 pointer-events-none"></div>
      
      <div className="relative max-w-[1400px] mx-auto flex items-center justify-between py-6 px-8">
        {/* Logo */}
        <Link to="/" className="hover:opacity-80 transition-opacity duration-300">
          <img 
            src={logo} 
            alt="Dennis Lach Photography" 
            className="h-12 w-auto"
          />
        </Link>
        
        {/* Navigation */}
        <nav className="flex items-center gap-3">
          {/* Home Button */}
          <Link to="/">
            <Button
              variant="ghost"
              size="lg"
              className="font-medium tracking-wide"
            >
              <span>PORTFOLIO</span>
            </Button>
          </Link>

          {/* Blog Button */}
          <Link to="/blog">
            <Button
              variant="ghost"
              size="lg"
              className="font-medium tracking-wide"
            >
              <span>BLOG</span>
            </Button>
          </Link>

          {/* Admin Button */}
          <Link to="/admin">
            <Button
              variant="ghost"
              size="lg"
              className="font-medium tracking-wide"
            >
              <span>ADMIN</span>
            </Button>
          </Link>
        </nav>
      </div>
      
      {/* Bottom Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
    </header>
  );
};