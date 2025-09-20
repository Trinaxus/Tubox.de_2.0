import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchBlogPosts, BlogPost as BlogPostType } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft } from 'lucide-react';

const slugify = (s: string) =>
  encodeURIComponent(
    s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
  );

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const posts = await fetchBlogPosts();
        // find by slug or by slugified title
        const match = posts.find(p => (p.slug ? p.slug === slug : slugify(p.title) === slug));
        setPost(match || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const title = useMemo(() => post?.title ?? 'Blog', [post]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="max-w-[1200px] mx-auto px-8 py-16 text-center text-muted-foreground flex-1">Artikel wird geladen…</div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="max-w-[1200px] mx-auto px-8 py-16 text-center flex-1">
          <h1 className="text-2xl font-bold mb-4">Artikel nicht gefunden</h1>
          <Button
            variant="outline"
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 rounded-2xl px-3 border-2 border-transparent hover:border-primary hover:bg-primary/10 hover:text-primary hover:ring-2 hover:ring-primary/40 hover:ring-offset-0 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Zurück zum Blog
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 flex-1">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-2 rounded-2xl px-3 border-2 border-transparent hover:border-primary hover:bg-primary/10 hover:text-primary hover:ring-2 hover:ring-primary/40 hover:ring-offset-0 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <div className="h-6 w-px bg-border" />
          {post.category && <Badge variant="outline">{post.category}</Badge>}
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <User className="h-4 w-4" /> {post.author}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" /> {new Date(post.date).toLocaleDateString('de-DE')}
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-6">{title}</h1>

        {post.featured_image && (
          <div className="w-full overflow-hidden rounded-lg mb-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLElement;
                (target as any).style.display = 'none';
              }}
            />
          </div>
        )}

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <div
            className="text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-8 border-t mt-10">
            <span className="text-sm text-muted-foreground mr-2">Tags:</span>
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
