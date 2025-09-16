import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';
import { GalleryCard } from '@/components/GalleryCard';
import { useGalleries } from '@/hooks/useGalleries';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState('ALLE');
  const { galleries, loading, error } = useGalleries();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Admin-Status prüfen

  // Filter galleries based on access permissions
  const accessFilteredGalleries = galleries.filter(gallery => {
    const accessType = gallery.accessType || 'public';
    
    switch (accessType) {
      case 'locked':
        return false; // Gesperrt - nie anzeigen
      case 'admin':
        return isAuthenticated; // Nur Admins - nur wenn eingeloggt
      case 'public':
      case 'password':
      default:
        return true; // Öffentlich und Passwort - immer anzeigen (Passwort wird geblurt)
    }
  });

  const filteredGalleries = activeCategory === 'ALLE' 
    ? accessFilteredGalleries 
    : accessFilteredGalleries.filter(gallery => gallery.category === activeCategory);

  // Sort galleries by year (descending). If years are equal, use uploadDate as tiebreaker.
  const sortedGalleries = [...filteredGalleries].sort((a, b) => {
    const ya = parseInt((a.year || '0').toString(), 10);
    const yb = parseInt((b.year || '0').toString(), 10);
    if (yb !== ya) return yb - ya; // primary: year desc
    // secondary: uploadDate desc if same year
    const da = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
    const db = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
    return db - da;
  });

  const handleGalleryClick = (galleryId: string) => {
    const gallery = sortedGalleries.find(g => g.id === galleryId);
    if (gallery) {
      // Always use the galerie property for the correct folder name
      const encodedGalleryName = encodeURIComponent(gallery.galerie);
      console.log(`Navigating to: /gallery/${gallery.year}/${encodedGalleryName}`);
      console.log(`Gallery data:`, { title: gallery.title, galerie: gallery.galerie });
      navigate(`/gallery/${gallery.year}/${encodedGalleryName}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-visible">
      <Header />
      
      <main className="relative z-10 max-w-[1200px] mx-auto px-8 py-8 flex-1">
        <Navigation 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Galerien werden geladen...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-destructive">Fehler beim Laden der Galerien: {error}</div>
          </div>
        ) : sortedGalleries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="text-muted-foreground mb-4 text-lg">
              Keine Galerien gefunden
            </div>
            <div className="text-sm text-muted-foreground mb-6 max-w-md">
              Es sind noch keine Galerien auf dem Server vorhanden. 
              {isAuthenticated && (
                <span> Gehe zum <a href="/admin" className="text-primary hover:underline">Admin-Bereich</a>, um deine erste Galerie zu erstellen.</span>
              )}
            </div>
            {isAuthenticated && (
              <Button onClick={() => navigate('/admin')} variant="default">
                Zur Galerie-Verwaltung
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-grid">
            {sortedGalleries.map((gallery, idx) => (
              <div key={gallery.id} className="fade-card" style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}>
                <GalleryCard
                  gallery={gallery}
                  onClick={() => handleGalleryClick(gallery.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
