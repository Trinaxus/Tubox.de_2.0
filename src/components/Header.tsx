import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Home, Image, User } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
      
      <div className="relative max-w-[1400px] mx-auto flex items-center justify-between py-4 px-4 sm:px-6 md:py-6 md:px-8">
        {/* Logo */}
        <Link to="/" className="hover:opacity-80 transition-opacity duration-300">
          <img 
            src={logo} 
            alt="Dennis Lach Photography" 
            className="h-10 w-auto md:h-12"
          />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {/* Home Button */}
          <Link to="/">
            <Button
              variant="ghost"
              size="lg"
              className="font-medium tracking-wide h-10 px-5 rounded-2xl"
            >
              <span>PORTFOLIO</span>
            </Button>
          </Link>

          {/* Blog Button */}
          <Link to="/blog">
            <Button
              variant="ghost"
              size="lg"
              className="font-medium tracking-wide h-10 px-5 rounded-2xl"
            >
              <span>BLOG</span>
            </Button>
          </Link>

          {/* Admin Button */}
          <Link to="/admin">
            <Button
              variant="ghost"
              size="lg"
              className="font-medium tracking-wide h-10 px-5 rounded-2xl"
            >
              <span>ADMIN</span>
            </Button>
          </Link>
        </nav>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menü öffnen">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
                <span className="text-sm text-muted-foreground">Navigation</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-start text-base">Portfolio</Button>
                </Link>
                <Link to="/blog">
                  <Button variant="ghost" className="w-full justify-start text-base">Blog</Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost" className="w-full justify-start text-base">Admin</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Bottom Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
    </header>
  );
};