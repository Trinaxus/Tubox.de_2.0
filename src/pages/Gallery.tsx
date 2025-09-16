import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchGalleryMetadata, fetchGalleryImages, verifyGalleryPassword, UPLOADS_BASE_URL } from '@/services/api';
import { Lightbox } from '@/components/gallery/Lightbox';

interface GalleryData {
  jahr: string;
  galerie: string;
  kategorie: string;
  tags: string[];
  isVideo: boolean;
  uploadDate: string;
  accessType?: string;
  images: string[];
}

const Gallery = () => {
  const { year, galleryName } = useParams<{ year: string; galleryName: string }>();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const loadGallery = async () => {
      if (!year || !galleryName) {
        setError('Ungültige Galerie-Parameter');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const decodedGalleryName = decodeURIComponent(galleryName);
        
        // Load metadata first
        const metadata = await fetchGalleryMetadata(year, decodedGalleryName).catch(() => null);
        const accessType = metadata?.accessType || 'public';
        if (accessType === 'password' && !verified) {
          setRequiresPassword(true);
          setGallery({
            jahr: year,
            galerie: decodedGalleryName,
            kategorie: metadata?.kategorie || 'Unbekannt',
            tags: metadata?.tags || [],
            isVideo: metadata?.isVideo || false,
            uploadDate: metadata?.uploadDate || new Date().toISOString(),
            accessType,
            images: []
          });
          return; // Wait for password
        }

        // If no password needed or already verified, load images
        const images = await fetchGalleryImages(year, decodedGalleryName);
        if (images && images.length > 0) {
          setGallery({
            jahr: year,
            galerie: decodedGalleryName,
            kategorie: metadata?.kategorie || 'Unbekannt',
            tags: metadata?.tags || [],
            isVideo: metadata?.isVideo || false,
            uploadDate: metadata?.uploadDate || new Date().toISOString(),
            accessType,
            images
          });
        } else {
          setError('Keine Bilder in dieser Galerie gefunden');
        }
      } catch (err) {
        setError('Fehler beim Laden der Galerie');
        console.error('Error loading gallery:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [year, galleryName]);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (selectedImageIndex !== null && gallery) {
      setSelectedImageIndex((selectedImageIndex + 1) % gallery.images.length);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex !== null && gallery) {
      setSelectedImageIndex(
        selectedImageIndex === 0 ? gallery.images.length - 1 : selectedImageIndex - 1
      );
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !galleryName) return;
    setPasswordError(null);
    const decodedGalleryName = decodeURIComponent(galleryName);
    const resp = await verifyGalleryPassword(year, decodedGalleryName, password);
    if (resp.success && resp.valid) {
      setVerified(true);
      setRequiresPassword(false);
      // Reload gallery now that we are verified
      setLoading(true);
      try {
        const images = await fetchGalleryImages(year, decodedGalleryName);
        const metadata = await fetchGalleryMetadata(year, decodedGalleryName).catch(() => null);
        setGallery({
          jahr: year,
          galerie: decodedGalleryName,
          kategorie: metadata?.kategorie || 'Unbekannt',
          tags: metadata?.tags || [],
          isVideo: metadata?.isVideo || false,
          uploadDate: metadata?.uploadDate || new Date().toISOString(),
          accessType: 'password',
          images
        });
      } catch (err) {
        setError('Fehler beim Laden der Galerie');
      } finally {
        setLoading(false);
      }
    } else {
      setPasswordError(resp.message || 'Falsches Passwort');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex items-center justify-center p-8 flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Galerie wird geladen...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="container mx-auto px-8 py-8 flex-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Galerie nicht gefunden</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')}>
              Zurück zur Übersicht
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-8 py-8 flex-1">
        {/* Gallery Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              ← Zurück
            </Button>
            <div className="h-6 w-px bg-border" />
            <Badge variant="outline">{gallery.kategorie}</Badge>
            {gallery.accessType === 'public' && (
              <Badge variant="success">Öffentlich</Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {gallery.galerie}
          </h1>
          
          <div className="flex items-center gap-4 text-muted-foreground mb-4">
            <span>{gallery.jahr}</span>
            <span>•</span>
            <span>{gallery.images.length} Bilder</span>
            <span>•</span>
            <span>{new Date(gallery.uploadDate).toLocaleDateString('de-DE')}</span>
          </div>
          
          {gallery.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Tags:</span>
              {gallery.tags.map((tag, index) => (
                <Badge key={index} variant="tag" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Password Gate */}
        {requiresPassword && !verified ? (
          <div className="max-w-md mx-auto bg-background/70 backdrop-blur-md border rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3">Diese Galerie ist passwortgeschützt</h2>
            <form onSubmit={submitPassword} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="w-full rounded-md border px-3 py-2 bg-background"
                autoFocus
              />
              {passwordError && (
                <div className="text-destructive text-sm">{passwordError}</div>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit">Freischalten</Button>
                <Button type="button" variant="ghost" onClick={() => navigate('/')}>Abbrechen</Button>
              </div>
            </form>
          </div>
        ) : (
        /* Image Grid */
        gallery.images.length > 0 ? (
          <>
            <div className="mb-6 text-sm text-muted-foreground">
              {gallery.images.length} Bilder gefunden
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.images.map((imageUrl, index) => (
                <div
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="group cursor-pointer relative aspect-square overflow-hidden rounded-lg bg-muted hover:shadow-xl transition-all duration-300"
                >
                  <img
                    src={(function toPreview(url: string) {
                      try {
                        const u = new URL(url);
                        const parts = u.pathname.split('/');
                        const file = parts.pop() || '';
                        parts.push('preview');
                        parts.push(file);
                        return `${u.origin}${parts.join('/')}${u.search}`;
                      } catch {
                        return url.replace(/\/([^\/]+)$/,'/preview/$1');
                      }
                    })(imageUrl)}
                    alt={`${gallery.galerie} - Bild ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const imgEl = e.currentTarget as HTMLImageElement & { __triedAlt?: boolean };
                      console.error(`Failed to load image: ${imageUrl}`);
                      // Try alternate URL variant once (encoded vs raw)
                      if (!imgEl.__triedAlt) {
                        imgEl.__triedAlt = true;
                        try {
                          const url = new URL(imgEl.src);
                          const parts = url.pathname.split('/');
                          const file = parts.pop() || '';
                          const folder = parts.pop() || '';
                          const year = parts.pop() || '';
                          const base = `${url.protocol}//${url.host}${parts.join('/')}`;
                          // If filename looks encoded, try decoded; else try encoded
                          const isEncoded = /%[0-9A-Fa-f]{2}/.test(file);
                          const altFile = isEncoded ? decodeURIComponent(file) : encodeURIComponent(file);
                          const altSrc = `${base}/${year}/${folder}/${altFile}`;
                          console.warn('Retrying with alternate image URL:', altSrc);
                          imgEl.src = altSrc;
                          return;
                        } catch {}
                      }
                      imgEl.src = '/placeholder.svg';
                    }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                  
                  {/* Image number */}
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Keine Bilder gefunden
            </h3>
            <p className="text-muted-foreground mb-4">
              Versucht: {`${UPLOADS_BASE_URL}/${year}/${galleryName?.replace(/%20/g, ' ')}/`}
            </p>
            <p className="text-sm text-muted-foreground">
              Überprüfen Sie die Konsole für Details zur Bildsuche.
            </p>
          </div>
        )
        )}
      </main>

      <Footer />

      {/* Lightbox */}
      {selectedImageIndex !== null && gallery && (
        <Lightbox
          images={gallery.images}
          currentIndex={selectedImageIndex}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
          galleryTitle={gallery.galerie}
        />
      )}
    </div>
  );
};

export default Gallery;