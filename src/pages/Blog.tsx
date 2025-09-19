import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchBlogPosts, BlogPost } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('MUSIC');
  const [blogCategories, setBlogCategories] = useState<string[]>(['ALLE']);
  const navigate = useNavigate();

  // Parse a timestamp primarily from the title (DD.MM.YYYY), fallback to slug (YYYY-MM-DD), then to post.date
  const getPostTimestamp = (post: BlogPost): number => {
    // Try DD.MM.YYYY in title
    const m = post.title?.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (m) {
      const [, d, mo, y] = m;
      const ts = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10)).getTime();
      if (!isNaN(ts)) return ts;
    }
    // Try YYYY-MM-DD in slug or title
    const txt = `${post.slug || ''} ${post.title || ''}`;
    const m2 = txt.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (m2) {
      const [, y, mo, d] = m2;
      const ts = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10)).getTime();
      if (!isNaN(ts)) return ts;
    }
    // Fallback to normalized date field
    const ts = new Date(post.date as any).getTime();
    return isNaN(ts) ? 0 : ts;
  };

  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        setLoading(true);
        const posts = await fetchBlogPosts();
        // Filter only published posts
        const publishedPosts = posts.filter(post => post.published);
        setBlogPosts(publishedPosts);
        
        // Extract unique categories from published blog posts (normalize to uppercase)
        const categoriesFromPosts = publishedPosts
          .map(post => (post.category || '').toString().trim().toUpperCase())
          .filter(Boolean)
          .filter((category, index, array) => array.indexOf(category) === index);

        // Ensure 'MUSIC' exists as a selectable category and position it right after 'ALLE'
        const setUnique = new Set<string>([...categoriesFromPosts, 'MUSIC']);
        const categories = Array.from(setUnique).sort((a, b) => a.localeCompare(b));
        // Move MUSIC to the front (after ALLE)
        const withoutMusic = categories.filter(c => c !== 'MUSIC');
        setBlogCategories(['ALLE', 'MUSIC', ...withoutMusic]);
      } catch (error) {
        console.error('Error loading blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogPosts();
  }, []);

  // Filter blog posts by category (case-insensitive comparison)
  const filteredBlogPosts = activeCategory === 'ALLE' 
    ? blogPosts 
    : blogPosts.filter(post => {
        const postCategory = (post.category || '').toString().trim().toUpperCase();
        // Special handling for MUSIC category to match any variation of 'music'
        if (activeCategory === 'MUSIC') {
          return postCategory === 'MUSIC' || postCategory.includes('MUSIK');
        }
        return postCategory === activeCategory;
      });

  // Sort by normalized date (newest first). Our transform sets date from title/fields.
  const sortedBlogPosts = [...filteredBlogPosts].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

  const handleCardClick = (post: BlogPost) => {
    const slug = post.slug || encodeURIComponent(post.title.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/blog/${slug}`);
  };

  // Modal removed; navigation now goes to /blog/:slug

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="max-w-[1200px] mx-auto px-8 py-8 flex-1">
        {/* Blog Navigation */}
        <nav className="flex items-center justify-center gap-1 mb-8">
          {blogCategories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'active' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className="text-sm font-medium transition-all duration-200 rounded-xl"
            >
              {category}
            </Button>
          ))}
        </nav>

        {/* Blog Posts */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Blog-Posts werden geladen...</div>
          </div>
        ) : sortedBlogPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="text-muted-foreground mb-4 text-lg">
              Keine Blog-Posts gefunden
            </div>
            <div className="text-sm text-muted-foreground mb-6 max-w-md">
              {activeCategory === 'ALLE' 
                ? 'Es sind noch keine Blog-Posts veröffentlicht worden. Schauen Sie bald wieder vorbei!'
                : `Keine Blog-Posts in der Kategorie "${activeCategory}" gefunden.`
              }
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-grid">
            {sortedBlogPosts.map((post, idx) => (
              <Card 
                key={post.id} 
                className="fade-card bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200 cursor-pointer group overflow-hidden"
                style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                onClick={() => handleCardClick(post)}
              >
                {/* Featured Image */}
                {post.featured_image && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={(function toPreview(url: string) {
                        try {
                          const u = new URL(url);
                          const parts = u.pathname.split('/');
                          const file = parts.pop() || '';
                          if (parts.includes('preview')) return url;
                          parts.push('preview');
                          parts.push(file);
                          return `${u.origin}${parts.join('/')}${u.search}`;
                        } catch {
                          return url.replace(/\/([^\/]+)$/,'/preview/$1');
                        }
                      })(post.featured_image)}
                      alt={post.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && (
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;