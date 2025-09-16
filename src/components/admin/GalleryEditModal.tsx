import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Gallery, fetchGalleryMetadata } from '@/services/api';
import { useCategories } from '@/hooks/useCategories';

const accessTypes = [
  { value: 'public', label: 'Öffentlich', description: 'Jeder kann diese Galerie sehen' },
  { value: 'password', label: 'Passwort', description: 'Passwort erforderlich' },
  { value: 'admin', label: 'Nur Admins', description: 'Nur Administratoren' },
  { value: 'locked', label: 'Gesperrt', description: 'Niemand kann diese Galerie sehen' }
];

interface GalleryEditModalProps {
  gallery: Gallery | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (gallery: Gallery) => void;
}

export const GalleryEditModal = ({ gallery, isOpen, onClose, onSave }: GalleryEditModalProps) => {
  const { toast } = useToast();
  const { categories } = useCategories();
  const [editedGallery, setEditedGallery] = useState<Gallery | null>(null);
  const [newTag, setNewTag] = useState('');
  const [selectedAccess, setSelectedAccess] = useState('public');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const init = async () => {
      if (gallery) {
        setEditedGallery({ ...gallery });
        setSelectedAccess(gallery.accessType || 'public');
        // Try to load password from metadata (admin-only UX)
        try {
          const meta = await fetchGalleryMetadata(gallery.year, gallery.galerie || gallery.title);
          const existingPassword = (meta as any)?.password || '';
          setPassword(existingPassword);
        } catch {
          setPassword('');
        }
      }
    };
    init();
  }, [gallery]);

  if (!editedGallery || !isOpen) return null;

  const handleSave = () => {
    const updatedGallery = {
      ...editedGallery,
      accessType: selectedAccess,
      password: selectedAccess === 'password' ? password : ''
    };
    
    onSave(updatedGallery);
    
    toast({
      title: 'Galerie gespeichert',
      description: 'Die Änderungen wurden erfolgreich gespeichert.'
    });
    
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !editedGallery.tags.includes(newTag.trim())) {
      setEditedGallery({
        ...editedGallery,
        tags: [...editedGallery.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedGallery({
      ...editedGallery,
      tags: editedGallery.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Galerie bearbeiten</DialogTitle>
          <DialogDescription>
            {editedGallery.year}/{editedGallery.galerie}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Jahr */}
          <div className="space-y-2">
            <Label htmlFor="year">Jahr:</Label>
            <Input
              id="year"
              value={editedGallery.year}
              onChange={(e) => setEditedGallery({
                ...editedGallery,
                year: e.target.value
              })}
            />
          </div>

          {/* Galerie */}
          <div className="space-y-2">
            <Label htmlFor="gallery">Galerie:</Label>
            <Input
              id="gallery"
              value={editedGallery.galerie || editedGallery.title}
              onChange={(e) => setEditedGallery({
                ...editedGallery,
                galerie: e.target.value,
                title: e.target.value
              })}
            />
          </div>

          {/* Kategorie */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie:</Label>
            <Select 
              value={editedGallery.category} 
              onValueChange={(value) => setEditedGallery({
                ...editedGallery,
                category: value,
                kategorie: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags:</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Neuer Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                +
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedGallery.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Hinweis: Die Kategorie aus dem Upload wird als Tag angezeigt.
            </p>
          </div>

          {/* Zugriffsberechtigung */}
          <div className="space-y-4">
            <Label>Zugriffsberechtigung:</Label>
            
            <div className="grid grid-cols-2 gap-3">
              {accessTypes.map((access) => (
                <button
                  key={access.value}
                  type="button"
                  onClick={() => setSelectedAccess(access.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedAccess === access.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{access.label}</div>
                </button>
              ))}
            </div>

            {/* Passwort-Feld wenn Passwort ausgewählt */}
            {selectedAccess === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Passwort:</Label>
                <Input
                  id="password"
                  type="text"
                  placeholder="Passwort eingeben"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {accessTypes.find(a => a.value === selectedAccess)?.description}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};