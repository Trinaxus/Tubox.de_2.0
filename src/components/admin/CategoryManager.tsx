import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Save, RotateCcw, Grip, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const CategoryManager = () => {
  const { toast } = useToast();
  const { categories, loading, error, saveCategories, refreshCategories } = useCategories();
  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Initialize local categories when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && localCategories.length === 0) {
      setLocalCategories([...categories]);
    }
  }, [categories, localCategories.length]);

  const addCategory = () => {
    if (newCategory.trim() && !localCategories.includes(newCategory.trim().toUpperCase())) {
      const updated = [...localCategories, newCategory.trim().toUpperCase()];
      setLocalCategories(updated);
      setNewCategory('');
      setHasChanges(true);
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    const updated = localCategories.filter(cat => cat !== categoryToRemove);
    setLocalCategories(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await saveCategories(localCategories);
    if (success) {
      setHasChanges(false);
      toast({
        title: 'Kategorien gespeichert',
        description: 'Die Kategorien wurden erfolgreich aktualisiert.'
      });
    } else {
      toast({
        title: 'Fehler',
        description: 'Kategorien konnten nicht gespeichert werden.',
        variant: 'destructive'
      });
    }
  };

  const handleReset = () => {
    setLocalCategories([...categories]);
    setHasChanges(false);
    toast({
      title: 'Änderungen verworfen',
      description: 'Alle nicht gespeicherten Änderungen wurden verworfen.'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          Kategorien werden geladen...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Fehler beim Laden der Kategorien: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Kategorien-Verwaltung
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Erstellen und verwalten Sie Kategorien für Ihre Galerien
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Add new category section */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-foreground">Neue Kategorie hinzufügen</Label>
            <div className="flex gap-3">
              <div className="flex-1 relative group">
                <Input
                  placeholder="z.B. NATUR, ARCHITEKTUR, STREET..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  className="h-12 text-lg bg-background/50 border-2 transition-all duration-200 group-hover:border-primary/30 focus:border-primary/50 focus:shadow-lg focus:shadow-primary/10"
                />
              </div>
              <Button 
                onClick={addCategory} 
                size="lg"
                disabled={!newCategory.trim()}
                className="h-12 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </div>

          {/* Current categories section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-foreground">
                Aktuelle Kategorien ({localCategories.length})
              </Label>
              {localCategories.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Ziehen Sie die Kategorien zum Sortieren
                </div>
              )}
            </div>
            
            <div className="grid gap-3">
              {localCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-2xl">
                  <div className="p-4 bg-muted/30 rounded-full mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="text-muted-foreground text-center">
                    <p className="text-lg mb-1">Noch keine Kategorien vorhanden</p>
                    <p className="text-sm">Fügen Sie Ihre erste Kategorie hinzu, um zu beginnen</p>
                  </div>
                </div>
              ) : (
                localCategories.map((category, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="group relative"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer">
                      {/* Drag handle */}
                      <div className="flex items-center text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                        <Grip className="h-4 w-4" />
                      </div>
                      
                      {/* Category name */}
                      <div className="flex-1">
                        <div className="font-medium text-lg text-foreground group-hover:text-primary transition-colors">
                          {category}
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`opacity-0 group-hover:opacity-100 transition-all duration-200 h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive ${
                              hoveredIndex === index ? 'scale-100' : 'scale-95'
                            }`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <div className="p-2 bg-destructive/10 rounded-lg">
                                <X className="h-5 w-5 text-destructive" />
                              </div>
                              Kategorie löschen
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base leading-relaxed">
                              Sind Sie sicher, dass Sie die Kategorie <span className="font-semibold text-foreground">"{category}"</span> löschen möchten? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeCategory(category)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action buttons */}
          {hasChanges && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50"></div>
              <div className="relative p-6 flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Ungespeicherte Änderungen</p>
                    <p className="text-sm text-muted-foreground">
                      Sie haben Änderungen vorgenommen, die noch nicht gespeichert wurden
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Verwerfen
                  </Button>
                  <Button 
                    onClick={handleSave}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:shadow-primary/20"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};