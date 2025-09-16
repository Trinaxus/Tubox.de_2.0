import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const FolderManager = () => {
  const { toast } = useToast();
  const [newFolder, setNewFolder] = useState({
    year: new Date().getFullYear().toString(),
    name: ''
  });

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: 'Ordner erstellt',
      description: `Ordner ${newFolder.year}/${newFolder.name} wurde erstellt.`
    });
    
    setNewFolder({
      year: new Date().getFullYear().toString(),
      name: ''
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ordnerverwaltung</CardTitle>
          <CardDescription>
            Verwalten Sie die Ordnerstruktur Ihrer Galerien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Jahr</Label>
                <Input
                  id="year"
                  value={newFolder.year}
                  onChange={(e) => setNewFolder({ ...newFolder, year: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="folderName">Ordnername</Label>
                <Input
                  id="folderName"
                  placeholder="z.B. Neue Galerie"
                  value={newFolder.name}
                  onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button type="submit">
              Ordner erstellen
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bestehende Ordner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-medium">2025/</span>
                <Badge variant="outline" className="ml-2">6 Galerien</Badge>
              </div>
              <Button variant="outline" size="sm">Verwalten</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <span className="font-medium">3000/</span>
                <Badge variant="outline" className="ml-2">1 Galerie</Badge>
              </div>
              <Button variant="outline" size="sm">Verwalten</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};