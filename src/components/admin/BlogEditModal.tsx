import { useState, useEffect } from 'react';
import { BlogPost } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface BlogEditModalProps {
  post: BlogPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: BlogPost) => void;
  categories: string[];
}

export const BlogEditModal = ({ post, isOpen, onClose, onSave, categories }: BlogEditModalProps) => {
  const [editedPost, setEditedPost] = useState<BlogPost | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (post) {
      setEditedPost({ ...post });
    }
  }, [post]);

  if (!editedPost) return null;

  const handleSave = () => {
    if (editedPost) {
      onSave(editedPost);
    }
  };

  const addTag = () => {
    if (newTag.trim() && editedPost && !editedPost.tags.includes(newTag.trim())) {
      setEditedPost({
        ...editedPost,
        tags: [...editedPost.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editedPost) {
      setEditedPost({
        ...editedPost,
        tags: editedPost.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Blog-Post bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Details des Blog-Posts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel</Label>
              <Input
                id="edit-title"
                value={editedPost.title}
                onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-year">Jahr</Label>
              <Input
                id="edit-year"
                type="number"
                min="2020"
                max="2030"
                value={editedPost.year || new Date().getFullYear()}
                onChange={(e) => setEditedPost({ ...editedPost, year: parseInt(e.target.value) })}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Inhalt</Label>
            <Textarea
              id="edit-content"
              rows={8}
              value={editedPost.content}
              onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-featured-image">Block Image (URL)</Label>
            <Input
              id="edit-featured-image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={editedPost.featured_image || ''}
              onChange={(e) => setEditedPost({ ...editedPost, featured_image: e.target.value })}
              className="bg-background/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-author">Autor</Label>
              <Input
                id="edit-author"
                value={editedPost.author}
                onChange={(e) => setEditedPost({ ...editedPost, author: e.target.value })}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Kategorie</Label>
              <Select 
                value={editedPost.category || 'Allgemein'} 
                onValueChange={(value) => setEditedPost({ ...editedPost, category: value })}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedPost.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Neuen Tag hinzufügen..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="bg-background/50"
              />
              <Button type="button" onClick={addTag} variant="outline">
                Hinzufügen
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-published"
              checked={editedPost.published}
              onCheckedChange={(checked) => setEditedPost({ ...editedPost, published: checked })}
            />
            <Label htmlFor="edit-published">Veröffentlicht</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};