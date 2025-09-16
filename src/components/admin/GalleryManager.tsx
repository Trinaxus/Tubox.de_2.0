import { useState, useEffect } from 'react';
import { useGalleries } from '@/hooks/useGalleries';
import { createGallery, uploadImages, updateGalleryMetadata, Gallery, deleteImage, deleteGallery } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GalleryEditModal } from './GalleryEditModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Grip,
  Sparkles,
  FolderPlus,
  Images,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronDown,
  Upload,
  Settings,
  Trash2,
  Plus,
  X,
  Calendar,
  Tag,
  Film
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const categories = [
  'BEST OF TRINAX',
  'LOSTPLACES', 
  'VILLA - SOUNDLABOR',
  'LANDSCHAFT',
  'PORTRAIT',
  'URLAUB'
];

interface SortableGalleryRowProps {
  gallery: Gallery;
  onEdit: (gallery: Gallery) => void;
  onDelete: (gallery: Gallery) => void;
  onUpload: (galleryId: string) => void;
  onDeleteImage: (imageUrl: string, galleryData: Gallery) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const SortableGalleryRow = ({ gallery, onEdit, onDelete, onUpload, onDeleteImage, isExpanded, onToggleExpand }: SortableGalleryRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gallery.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  const galleryImages = gallery.images || [];

  const getAccessIcon = () => {
    switch (gallery.accessType) {
      case 'public': return <Unlock className="h-4 w-4" />;
      case 'password': return <Lock className="h-4 w-4" />;
      case 'admin': return <Eye className="h-4 w-4" />;
      default: return <EyeOff className="h-4 w-4" />;
    }
  };

  const getAccessLabel = () => {
    switch (gallery.accessType) {
      case 'public': return 'Öffentlich';
      case 'password': return 'Passwort';
      case 'admin': return 'Nur Admins';
      default: return 'Gesperrt';
    }
  };

  const getAccessColor = () => {
    switch (gallery.accessType) {
      case 'public': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'password': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'admin': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      default: return 'text-red-500 bg-red-500/10 border-red-500/30';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        {/* Main Gallery Header */}
        <div 
          className="flex items-center gap-6 p-6 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={onToggleExpand}
        >
          {/* Drag handle */}
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab hover:cursor-grabbing text-muted-foreground/50 group-hover:text-muted-foreground transition-colors p-2 hover:bg-primary/10 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Grip className="h-5 w-5" />
          </div>
          
          {/* Gallery Thumbnail */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border shadow-lg bg-muted/30">
              <img
                src={gallery.image}
                alt={gallery.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              {gallery.mediaCount}
            </div>
          </div>
          
          {/* Gallery Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors truncate">
                {gallery.galerie || gallery.title}
              </h3>
              <Badge variant="secondary" className="font-medium">
                {gallery.year}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Images className="h-4 w-4" />
                <span className="font-medium">{gallery.mediaCount} Medien</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>{gallery.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Erstellt: {new Date(gallery.uploadDate || '').toLocaleDateString('de-DE')}</span>
              </div>
            </div>
          </div>
          
          {/* Status & Actions */}
          <div className="flex items-center gap-4">
            {/* Access Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${getAccessColor()}`}>
              {getAccessIcon()}
              <span className="hidden lg:inline">{getAccessLabel()}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpload(gallery.id);
                }}
                className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(gallery);
                }}
                className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-3">
                      <div className="p-2 bg-destructive/10 rounded-lg">
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </div>
                      Galerie löschen
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base leading-relaxed">
                      Sind Sie sicher, dass Sie die Galerie <span className="font-semibold text-foreground">"{gallery.galerie || gallery.title}"</span> komplett löschen möchten? 
                      Diese Aktion kann nicht rückgängig gemacht werden und alle Bilder gehen verloren.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(gallery)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Galerie löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {/* Expand/Collapse Indicator */}
            <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>

        {/* Expanded Gallery Images */}
        {isExpanded && (
          <div className="border-t border-border/50 bg-gradient-to-br from-muted/10 to-muted/30 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Images className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg text-foreground">Galerie-Bilder ({galleryImages.length})</h4>
              </div>
              <p className="text-muted-foreground">
                Klicken Sie auf das Mülleimer-Symbol, um einzelne Bilder zu löschen, oder nutzen Sie das Plus-Symbol, um neue Bilder hinzuzufügen
              </p>
            </div>
            
            <div className="grid grid-cols-6 lg:grid-cols-10 xl:grid-cols-12 gap-4">
              {galleryImages.map((imageUrl, index) => (
                <div 
                  key={index} 
                  className="relative group/image"
                  onMouseEnter={() => setHoveredImage(index)}
                  onMouseLeave={() => setHoveredImage(null)}
                >
                  <div className="aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg">
                    <img
                      src={imageUrl}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive text-white shadow-lg transition-all duration-200 ${
                      hoveredImage === index ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}
                    onClick={() => onDeleteImage(imageUrl, gallery)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {/* Add new image button */}
              <div 
                className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group/add shadow-md hover:shadow-lg"
                onClick={() => onUpload(gallery.id)}
              >
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6 text-muted-foreground/50 group-hover/add:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground/70 group-hover/add:text-primary transition-colors font-medium">
                    Hinzufügen
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const GalleryManager = () => {
  const { galleries, loading, error, refreshGalleries } = useGalleries();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortedGalleries, setSortedGalleries] = useState<Gallery[]>([]);
  const [expandedGalleries, setExpandedGalleries] = useState<Set<string>>(new Set());
  const [isNewGalleryOpen, setIsNewGalleryOpen] = useState(false);
  const [newGallery, setNewGallery] = useState({
    jahr: new Date().getFullYear().toString(),
    galerie: '',
    kategorie: 'BEST OF TRINAX',
    tags: '',
    accessType: 'public'
  });

  const handleDeleteImage = async (imageUrl: string, galleryData: Gallery) => {
    try {
      const imageName = imageUrl.split('/').pop();
      if (!imageName) return;
      
      const success = await deleteImage(galleryData.year, galleryData.galerie, imageName);
      
      if (success) {
        toast({
          title: 'Bild gelöscht',
          description: `${imageName} wurde erfolgreich entfernt.`
        });
        refreshGalleries();
      } else {
        toast({
          title: 'Löschen fehlgeschlagen',
          description: 'Das Bild konnte nicht gelöscht werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler beim Löschen',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update sorted galleries when galleries change
  useEffect(() => {
    const sortedByDate = [...galleries].sort((a, b) => {
      const dateA = extractDateFromName(a.galerie || a.title);
      const dateB = extractDateFromName(b.galerie || b.title);
      
      if (a.id === '3000-Best-of-Trinax') return -1;
      if (b.id === '3000-Best-of-Trinax') return 1;
      
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      
      return (a.galerie || a.title).localeCompare(b.galerie || b.title);
    });
    
    setSortedGalleries(sortedByDate);
  }, [galleries]);

  const extractDateFromName = (name: string): Date | null => {
    if (!name) return null;
    
    const pattern1 = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
    const match1 = name.match(pattern1);
    if (match1) {
      const [, day, month, year] = match1;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    
    const pattern2 = /(\d{4})-(\d{1,2})-(\d{1,2})/;
    const match2 = name.match(pattern2);
    if (match2) {
      const [, year, month, day] = match2;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    
    const pattern3 = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match3 = name.match(pattern3);
    if (match3) {
      const [, month, day, year] = match3;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
    
    return null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedGalleries.findIndex((gallery) => gallery.id === active.id);
      const newIndex = sortedGalleries.findIndex((gallery) => gallery.id === over.id);

      const newSortedGalleries = arrayMove(sortedGalleries, oldIndex, newIndex);
      setSortedGalleries(newSortedGalleries);
      await saveGalleriesOrderToServer(newSortedGalleries);
    }
  };

  const saveGalleriesOrderToServer = async (galleries: Gallery[]) => {
    const orderData = {
      galleries: galleries.map((gallery, index) => ({
        id: gallery.id,
        year: gallery.year,
        name: gallery.galerie || gallery.title,
        order: index + 1,
        pinned: gallery.id === '3000-Best-of-Trinax'
      })),
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };

    try {
      const response = await fetch('/api/save-galleries-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        console.log('Galerie-Reihenfolge automatisch gespeichert');
      }
    } catch (error) {
      console.log('Reihenfolge konnte nicht gespeichert werden, verwende lokale Speicherung');
      localStorage.setItem('gallery-order', JSON.stringify(orderData));
    }
  };

  const toggleGalleryExpansion = (galleryId: string) => {
    setExpandedGalleries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(galleryId)) {
        newSet.delete(galleryId);
      } else {
        newSet.add(galleryId);
      }
      return newSet;
    });
  };

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const success = await createGallery({
        jahr: newGallery.jahr,
        galerie: newGallery.galerie,
        kategorie: newGallery.kategorie,
        tags: newGallery.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isVideo: false,
        uploadDate: new Date().toISOString(),
        accessType: newGallery.accessType
      });

      if (success) {
        toast({
          title: 'Galerie erstellt',
          description: `Die Galerie "${newGallery.galerie}" wurde erfolgreich erstellt.`
        });
        
        setNewGallery({
          jahr: new Date().getFullYear().toString(),
          galerie: '',
          kategorie: 'BEST OF TRINAX',
          tags: '',
          accessType: 'public'
        });
        
        setIsNewGalleryOpen(false);
        refreshGalleries();
      } else {
        toast({
          title: 'Fehler beim Erstellen',
          description: 'Die Galerie konnte nicht erstellt werden. Bitte versuchen Sie es erneut.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditGallery = (gallery: Gallery) => {
    setEditingGallery(gallery);
    setIsEditModalOpen(true);
  };

  const handleSaveGallery = async (updatedGallery: Gallery) => {
    try {
      await updateGalleryMetadata(
        updatedGallery.year, 
        updatedGallery.galerie || updatedGallery.title,
        {
          jahr: updatedGallery.year,
          galerie: updatedGallery.galerie || updatedGallery.title,
          kategorie: updatedGallery.category,
          tags: updatedGallery.tags,
          isVideo: false,
          uploadDate: updatedGallery.uploadDate || new Date().toISOString(),
          accessType: updatedGallery.accessType || 'public',
          // Include password when accessType is password; otherwise clear it
          password: (updatedGallery.accessType === 'password')
            ? (updatedGallery as any).password || ''
            : ''
        }
      );
      
      refreshGalleries();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Galerie konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteGallery = async (gallery: Gallery) => {
    if (window.confirm(`Möchten Sie die Galerie "${gallery.galerie || gallery.title}" wirklich komplett löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      try {
        const success = await deleteGallery(gallery.year, gallery.galerie || gallery.title);
        
        if (success) {
          toast({
            title: 'Galerie gelöscht',
            description: `Die Galerie "${gallery.galerie || gallery.title}" wurde komplett gelöscht.`
          });
          refreshGalleries();
        } else {
          toast({
            title: 'Löschen fehlgeschlagen',
            description: 'Die Galerie konnte nicht gelöscht werden.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast({
          title: 'Fehler beim Löschen',
          description: 'Ein unerwarteter Fehler ist aufgetreten.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleImageUpload = async (galleryId: string) => {
    const gallery = galleries.find(g => g.id === galleryId);
    if (!gallery) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*';
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          toast({
            title: 'Upload gestartet',
            description: `${files.length} Dateien werden hochgeladen...`
          });

          const success = await uploadImages(gallery.folderPath, files);
          
          if (success) {
            toast({
              title: 'Upload erfolgreich',
              description: `${files.length} Dateien wurden erfolgreich hochgeladen.`
            });
            refreshGalleries();
          } else {
            toast({
              title: 'Upload fehlgeschlagen',
              description: 'Die Dateien konnten nicht hochgeladen werden.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          toast({
            title: 'Upload-Fehler',
            description: 'Ein unerwarteter Fehler ist aufgetreten.',
            variant: 'destructive'
          });
        }
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          Galerien werden geladen...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Fehler beim Laden der Galerien: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Images className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Galerien-Verwaltung
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Verwalten Sie Ihre Fotogalerien • {sortedGalleries.length} Galerien verfügbar
                </CardDescription>
              </div>
            </div>
            
            {/* New Gallery Toggle */}
            <Button 
              size="lg"
              onClick={() => setIsNewGalleryOpen(!isNewGalleryOpen)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-200"
            >
              <FolderPlus className="h-5 w-5 mr-2" />
              Neue Galerie
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${isNewGalleryOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        {isNewGalleryOpen && (
          <CardContent className="pt-0">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6">
              <form onSubmit={handleCreateGallery} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Jahr</Label>
                  <Input
                    placeholder="2025"
                    value={newGallery.jahr}
                    onChange={(e) => setNewGallery({ ...newGallery, jahr: e.target.value })}
                    className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Galerie-Name</Label>
                  <Input
                    placeholder="z.B. Neue Landschafts-Serie"
                    value={newGallery.galerie}
                    onChange={(e) => setNewGallery({ ...newGallery, galerie: e.target.value })}
                    className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Kategorie</Label>
                  <Input
                    placeholder="z.B. LANDSCHAFT"
                    value={newGallery.kategorie}
                    onChange={(e) => setNewGallery({ ...newGallery, kategorie: e.target.value })}
                    className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                    list="categories-list"
                    required
                  />
                  <datalist id="categories-list">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Zugriff</Label>
                  <Select value={newGallery.accessType} onValueChange={(value) => setNewGallery({ ...newGallery, accessType: value })}>
                    <SelectTrigger className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50">
                      <SelectValue placeholder="Zugriff wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">🔓 Öffentlich</SelectItem>
                      <SelectItem value="password">🔒 Passwort</SelectItem>
                      <SelectItem value="admin">👤 Nur Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2 lg:col-span-4 space-y-2">
                  <Label className="text-sm font-medium text-foreground">Tags (kommagetrennt)</Label>
                  <Input
                    placeholder="z.B. natur, landschaft, outdoor"
                    value={newGallery.tags}
                    onChange={(e) => setNewGallery({ ...newGallery, tags: e.target.value })}
                    className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                  />
                </div>
                
                <div className="md:col-span-2 lg:col-span-4 flex gap-3 pt-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsNewGalleryOpen(false);
                      setNewGallery({
                        jahr: new Date().getFullYear().toString(),
                        galerie: '',
                        kategorie: 'BEST OF TRINAX',
                        tags: '',
                        accessType: 'public'
                      });
                    }}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isCreating || !newGallery.galerie}
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full" />
                        Erstellen...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Galerie erstellen
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Galleries List */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Alle Galerien ({sortedGalleries.length})
              </CardTitle>
              <CardDescription className="mt-1">
                Automatisch sortiert nach Datum • Drag & Drop zum Anpassen der Reihenfolge
              </CardDescription>
            </div>
            {sortedGalleries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (expandedGalleries.size === sortedGalleries.length) {
                    setExpandedGalleries(new Set());
                  } else {
                    setExpandedGalleries(new Set(sortedGalleries.map(g => g.id)));
                  }
                }}
              >
                {expandedGalleries.size === sortedGalleries.length ? 'Alle zuklappen' : 'Alle aufklappen'}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {sortedGalleries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
              <div className="p-4 bg-muted/30 rounded-full mb-4">
                <Images className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="text-muted-foreground text-center">
                <p className="text-lg mb-1">Noch keine Galerien vorhanden</p>
                <p className="text-sm">Erstellen Sie Ihre erste Galerie, um zu beginnen</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedGalleries.map(g => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedGalleries.map((gallery) => (
                    <SortableGalleryRow
                      key={gallery.id}
                      gallery={gallery}
                      onEdit={handleEditGallery}
                      onDelete={handleDeleteGallery}
                      onUpload={handleImageUpload}
                      onDeleteImage={handleDeleteImage}
                      isExpanded={expandedGalleries.has(gallery.id)}
                      onToggleExpand={() => toggleGalleryExpansion(gallery.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <GalleryEditModal
        gallery={editingGallery}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGallery(null);
        }}
        onSave={handleSaveGallery}
      />
    </div>
  );
};