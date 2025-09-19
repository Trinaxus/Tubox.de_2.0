import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Home, Image, User } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const Header = () => {
  const logoRef = useRef<HTMLImageElement | null>(null);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/100 bg-background/0 backdrop-blur-sm supports-[backdrop-filter]:bg-background/0 bg-clip-padding"
      style={{ WebkitBackdropFilter: 'blur(6px)' }}
    >
      {/* Uniform dark overlay (50% black) */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>
      
      <div className="relative max-w-[1400px] mx-auto flex items-center justify-between py-4 px-4 sm:px-6 md:py-6 md:px-8">
        {/* Logo */}
        <Link to="/" className="group select-none">
          <img 
            ref={logoRef}
            src={logo} 
            alt="Dennis Lach Photography" 
            className="h-10 w-auto md:h-12 transform transition-transform duration-300 ease-out will-change-transform active:scale-95"
            onMouseEnter={() => {
              const el = logoRef.current; if (!el) return;
              el.classList.remove('animate-flicker');
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              el.offsetWidth;
              el.classList.add('animate-flicker');
            }}
            onClick={(e) => {
              const el = logoRef.current; if (!el) return;
              el.classList.remove('animate-pop2','animate-flash','animate-flicker');
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              el.offsetWidth; // reflow to restart
              el.classList.add('animate-pop2','animate-flash','animate-flicker');
            }}
            onTouchStart={() => {
              const el = logoRef.current; if (!el) return;
              el.classList.remove('animate-pop2','animate-flash','animate-flicker');
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              el.offsetWidth;
              el.classList.add('animate-pop2','animate-flash','animate-flicker');
            }}
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
    {/* Spacer to prevent content from sliding under the fixed header */}
    <div className="h-16 md:h-24" aria-hidden="true" />
    </>
  );
};