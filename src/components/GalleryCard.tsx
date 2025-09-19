import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export interface Gallery {
  id: string;
  title: string;
  image: string;
  tags: string[];
  year: string;
  mediaCount: number;
  isPublic: boolean;
  category: string;
  accessType?: string;
  galerie: string; // Original gallery folder name for URL construction (required)
}

interface GalleryCardProps {
  gallery: Gallery;
  onClick: () => void;
}

export const GalleryCard = ({ gallery, onClick }: GalleryCardProps) => {
  const isPasswordProtected = gallery.accessType === 'password';
  
  return (
    <Card
      onClick={onClick}
      className="fade-card bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      <div className="aspect-video relative overflow-hidden">
        <img
          src={gallery.image}
          alt={gallery.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isPasswordProtected ? 'blur-md' : ''
          }`}
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        
        {/* Removed lock/text overlay for password-protected galleries; keep blur only */}
        
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-lg font-bold mb-2">{gallery.title}</h3>
          <div className="flex items-center flex-wrap gap-2 mb-3">
            {gallery.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="tag" className="bg-primary/20 text-primary-foreground border-primary/30">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Card footer */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-base text-foreground mb-1">{gallery.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{gallery.year}</span>
            <span>•</span>
            <span>{gallery.mediaCount} Medien</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {gallery.category}
            </Badge>
          </div>
          
          {(() => {
            const access = gallery.accessType;
            const color = access === 'password'
              ? 'text-yellow-500 border-yellow-500/30'
              : access === 'admin'
                ? 'text-blue-500 border-blue-500/30'
                : 'text-green-500 border-green-500/30';
            const label = access === 'password' ? 'Passwort' : access === 'admin' ? 'Admin' : 'Öffentlich';
            return (
              <Badge 
                variant="outline"
                className={`text-xs ${color} opacity-70 bg-transparent`}
              >
                {label}
              </Badge>
            );
          })()}
        </div>
        
        {/* Tags */}
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-xs text-muted-foreground mr-1 leading-none">TAGS:</span>
          {gallery.tags.map((tag, index) => (
            <Badge key={index} variant="tag" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};