import { useState, useEffect } from 'react';
import { fetchBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, uploadBlogImage, BlogPost } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit2, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  User, 
  Tag, 
  Eye, 
  ChevronDown,
  FileText,
  Plus
} from 'lucide-react';
import { BlogEditModal } from './BlogEditModal';

export const BlogManager = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const { toast } = useToast();

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    author: 'Admin',
    category: 'Allgemein',
    tags: '',
    published: false,
    year: new Date().getFullYear(),
    featured_image: ''
  });

  const blogCategories = [
    'Allgemein',
    'Fotografie',
    'Portfolio',
    'Behind the Scenes',
    'Tutorials',
    'Projekte',
    'Music'
  ];

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const posts = await fetchBlogPosts();
      setBlogPosts(posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const postData = {
        ...newPost,
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      const success = await createBlogPost(postData);
      
      if (success) {
        toast({
          title: 'Blog-Post erstellt',
          description: 'Der Blog-Post wurde erfolgreich erstellt.'
        });
        setNewPost({
          title: '',
          content: '',
          author: 'Admin',
          category: 'Allgemein',
          tags: '',
          published: false,
          year: new Date().getFullYear(),
          featured_image: ''
        });
        setIsNewPostOpen(false);
        loadBlogPosts();
      } else {
        toast({
          title: 'Fehler',
          description: 'Der Blog-Post konnte nicht erstellt werden.',
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

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedPost: BlogPost) => {
    if (!editingPost || !editingPost.slug || !editingPost.year) return;

    try {
      const success = await updateBlogPost(editingPost.slug, editingPost.year, updatedPost);
      
      if (success) {
        toast({
          title: 'Blog-Post aktualisiert',
          description: 'Der Blog-Post wurde erfolgreich bearbeitet.'
        });
        
        // Update the local state immediately
        setBlogPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === updatedPost.id ? { ...post, ...updatedPost } : post
          )
        );
        
        setIsEditModalOpen(false);
        setEditingPost(null);
        // Reload to ensure consistency with server
        await loadBlogPosts();
      } else {
        toast({
          title: 'Fehler',
          description: 'Der Blog-Post konnte nicht aktualisiert werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (!post.id) return;

    try {
      const success = await deleteBlogPost(post.id);
      
      if (success) {
        toast({
          title: 'Blog-Post gelöscht',
          description: 'Der Blog-Post wurde erfolgreich entfernt.'
        });
        loadBlogPosts();
      } else {
        toast({
          title: 'Fehler',
          description: 'Der Blog-Post konnte nicht gelöscht werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    }
  };

  const handleImageUpload = async (post: BlogPost, files: FileList) => {
    if (!post.slug || !post.year) return;

    try {
      const success = await uploadBlogImage(post.slug, post.year, files);
      
      if (success) {
        toast({
          title: 'Bilder hochgeladen',
          description: `${files.length} Bild(er) wurden erfolgreich hochgeladen.`
        });
        loadBlogPosts();
      } else {
        toast({
          title: 'Fehler',
          description: 'Die Bilder konnten nicht hochgeladen werden.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Blog-Posts werden geladen...</div>
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
                <Edit2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Blog-Verwaltung
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Verwalten Sie Ihre Blog-Beiträge • {blogPosts.length} Blog-Posts verfügbar
                </CardDescription>
              </div>
            </div>
            
            {/* New Blog Post Toggle */}
            <Button 
              size="lg"
              onClick={() => setIsNewPostOpen(!isNewPostOpen)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neuen Blog-Post erstellen
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${isNewPostOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        {isNewPostOpen && (
          <CardContent className="pt-0">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Edit2 className="h-4 w-4" />
                      Titel
                    </Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      required
                      className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year" className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Calendar className="h-4 w-4" />
                      Jahr
                    </Label>
                    <Input
                      id="year"
                      type="number"
                      min="2020"
                      max="2030"
                      value={newPost.year}
                      onChange={(e) => setNewPost({ ...newPost, year: parseInt(e.target.value) })}
                      required
                      className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Edit2 className="h-4 w-4" />
                    Inhalt
                  </Label>
                  <Textarea
                    id="content"
                    rows={8}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    required
                    className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="featured_image" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ImageIcon className="h-4 w-4" />
                    Block Image (URL)
                  </Label>
                  <Input
                    id="featured_image"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={newPost.featured_image}
                    onChange={(e) => setNewPost({ ...newPost, featured_image: e.target.value })}
                    className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author" className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <User className="h-4 w-4" />
                      Autor
                    </Label>
                    <Input
                      id="author"
                      value={newPost.author}
                      onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                      required
                      className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Tag className="h-4 w-4" />
                      Kategorie
                    </Label>
                    <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                      <SelectTrigger className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50">
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {blogCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Tag className="h-4 w-4" />
                      Tags (kommagetrennt)
                    </Label>
                    <Input
                      id="tags"
                      placeholder="z.B. Fotografie, Trinax, Portfolio"
                      value={newPost.tags}
                      onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                      className="bg-background/50 border-2 transition-all duration-200 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={newPost.published}
                      onCheckedChange={(checked) => setNewPost({ ...newPost, published: checked })}
                    />
                    <Label htmlFor="published" className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Eye className="h-4 w-4" />
                      Sofort veröffentlichen
                    </Label>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsNewPostOpen(false);
                        setNewPost({
                          title: '',
                          content: '',
                          author: 'Admin',
                          category: 'Allgemein',
                          tags: '',
                          published: false,
                          year: new Date().getFullYear(),
                          featured_image: ''
                        });
                      }}
                    >
                      Abbrechen
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isCreating} 
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full" />
                          Erstellen...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Blog-Post erstellen
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Existing Blog Posts */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Blog-Posts ({blogPosts.length})
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihre existierenden Blog-Beiträge
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center text-muted-foreground p-8">
              {error}
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              Noch keine Blog-Posts vorhanden
            </div>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post) => {
                const isExpanded = expandedPosts.has(post.id);
                
                return (
                  <Collapsible key={post.id} open={isExpanded} onOpenChange={(open) => {
                    setExpandedPosts(prev => {
                      const newSet = new Set(prev);
                      if (open) {
                        newSet.add(post.id);
                      } else {
                        newSet.delete(post.id);
                      }
                      return newSet;
                    });
                  }}>
                    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                      {/* Blog Post Header */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-6 p-6 cursor-pointer hover:bg-muted/20 transition-colors">
                           {/* Blog Post Icon */}
                           <div className="relative">
                             <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border shadow-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                               {post.featured_image ? (
                                 <img
                                   src={post.featured_image}
                                   alt={post.title}
                                   className="w-full h-full object-cover"
                                   onError={(e) => {
                                     const target = e.target as HTMLImageElement;
                                     target.style.display = 'none';
                                     const fallbackIcon = target.nextElementSibling as HTMLElement;
                                     if (fallbackIcon) fallbackIcon.style.display = 'block';
                                   }}
                                 />
                               ) : null}
                               <FileText className={`h-8 w-8 text-primary ${post.featured_image ? 'hidden' : 'block'}`} />
                             </div>
                            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                              {post.images?.length || 0}
                            </div>
                          </div>
                          
                          {/* Blog Post Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors truncate">
                                {post.title}
                              </h3>
                              <Badge variant={post.published ? "default" : "secondary"} className="font-medium">
                                {post.published ? 'Veröffentlicht' : 'Entwurf'}
                              </Badge>
                              {post.category && (
                                <Badge variant="outline" className="font-medium">
                                  {post.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{post.author}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(post.date).toLocaleDateString('de-DE')}</span>
                              </div>
                              {post.year && (
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  <span>Jahr: {post.year}</span>
                                </div>
                              )}
                            </div>
                            {!isExpanded && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : 'Kein Inhalt verfügbar')}
                              </p>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPost(post);
                              }}
                              className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-200"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files && handleImageUpload(post, e.target.files)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-200"
                                asChild
                              >
                                <span>
                                  <Upload className="h-4 w-4" />
                                </span>
                              </Button>
                            </label>
                            
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
                                    Blog-Post löschen
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-base leading-relaxed">
                                    Sind Sie sicher, dass Sie den Blog-Post <span className="font-semibold text-foreground">"{post.title}"</span> löschen möchten? 
                                    Diese Aktion kann nicht rückgängig gemacht werden.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePost(post)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Blog-Post löschen
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
                      </CollapsibleTrigger>

                      {/* Expanded Content */}
                      <CollapsibleContent>
                        <div className="border-t border-border/50 bg-gradient-to-br from-muted/10 to-muted/30 p-8">
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <h4 className="font-semibold text-lg text-foreground">Blog-Inhalt</h4>
                            </div>
                            <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                                {post.content}
                              </pre>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="mb-6">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Tag className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="font-semibold text-lg text-foreground">Tags</h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Images */}
                          {post.images && post.images.length > 0 && (
                            <div>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <ImageIcon className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="font-semibold text-lg text-foreground">Bilder ({post.images.length})</h4>
                              </div>
                              <div className="grid grid-cols-6 lg:grid-cols-10 xl:grid-cols-12 gap-4">
                                {post.images.map((imageUrl, index) => (
                                  <div key={index} className="aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg">
                                    <img
                                      src={imageUrl}
                                      alt={`Blog image ${index + 1}`}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        e.currentTarget.src = '/placeholder.svg';
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <BlogEditModal
        post={editingPost}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPost(null);
        }}
        onSave={handleSaveEdit}
        categories={blogCategories}
      />
    </div>
  );
};
