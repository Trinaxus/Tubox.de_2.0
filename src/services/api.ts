// Read configuration from Vite environment variables, with safe defaults for local dev
const SERVER_BASE_URL = (import.meta as any).env?.VITE_SERVER_BASE_URL || 'https://tubox.de/TUBOX/server/api/gallery-api';
const BLOG_SERVER_BASE_URL = (import.meta as any).env?.VITE_BLOG_SERVER_BASE_URL || 'https://tubox.de/TUBOX/server/api/blog-api';
export const UPLOADS_BASE_URL = (import.meta as any).env?.VITE_UPLOADS_BASE_URL || 'https://tubox.de/TUBOX/server/uploads';
const API_TOKEN = (import.meta as any).env?.VITE_API_TOKEN || '0000';

export interface GalleryMetadata {
  jahr: string;
  galerie: string;
  kategorie: string;
  tags: string[];
  isVideo: boolean;
  uploadDate: string;
  accessType?: string;
  password?: string; // optional: only for password-protected galleries (admin use)
}

// Verify gallery password against server
export const verifyGalleryPassword = async (
  year: string,
  gallery: string,
  password: string
): Promise<{ success: boolean; requiresPassword?: boolean; valid?: boolean; message?: string }> => {
  try {
    const resp = await fetch(`${SERVER_BASE_URL}/verify-gallery-password.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, gallery, password })
    });
    const data = await resp.json();
    return data;
  } catch (e) {
    console.error('verifyGalleryPassword error', e);
    return { success: false, message: 'Network error' } as any;
  }
};

// Scoped category helpers to decouple gallery vs blog categories
export type CategoryScope = 'gallery' | 'blog';

export const fetchCategoriesScoped = async (scope: CategoryScope): Promise<string[]> => {
  if (scope === 'gallery') {
    return fetchCategories();
  }
  // Blog scope: store locally; fallback derive from blog posts
  try {
    const stored = localStorage.getItem('blog_categories');
    if (stored) {
      const data = JSON.parse(stored);
      return data.categories || [];
    }
  } catch {}
  try {
    const posts = await fetchBlogPosts();
    const set = new Set<string>();
    posts.forEach(p => {
      const raw = (p.category || '').toString().trim();
      if (raw) set.add(raw.toUpperCase());
    });
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  } catch {
    return [];
  }
};

export const updateCategoriesScoped = async (scope: CategoryScope, categories: string[]): Promise<void> => {
  if (scope === 'gallery') {
    return updateCategories(categories);
  }
  // Blog scope: store in localStorage only
  const payload = {
    categories,
    lastUpdated: new Date().toISOString(),
    version: '1.0'
  };
  localStorage.setItem('blog_categories', JSON.stringify(payload));
};
export interface Gallery extends GalleryMetadata {
  id: string;
  title: string;
  image: string;
  year: string;
  mediaCount: number;
  isPublic: boolean;
  category: string;
  folderPath: string;
  images: string[];
  accessType?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  tags: string[];
  published: boolean;
  year?: number;
  slug?: string;
  category?: string;
  excerpt?: string;
  modified?: string;
  featured_image?: string;
  images?: string[];
}

// List of known galleries - you can update this or create an index.json file
const KNOWN_GALLERIES = [
  { year: '2025', name: '06.07.2025 - expressions_01' },
  { year: '2025', name: '11.08.2025 - Zoo Leipzig' },
  { year: '2025', name: '20.06.2025 - Leipzig - Random' },
  { year: '2025', name: '25.04.2025 - VILLA - Soundlabor' },
  { year: '2025', name: '28.03.2025 - VILLA - Soundlabor' },
  { year: '3000', name: 'Best of Trinax' }
];

// Fetch all available galleries from the server
export const fetchGalleries = async (): Promise<Gallery[]> => {
  try {
    console.log('Fetching galleries from server...');
    console.log('Using endpoint:', `${SERVER_BASE_URL}/list-galleries.php`);
    
    // Try to fetch from the new PHP endpoint
    const response = await fetch(`${SERVER_BASE_URL}/list-galleries.php?_=${Date.now()}`, {
      cache: 'no-store'
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const galleriesData = await response.json();
    console.log(`Found ${galleriesData.length} galleries on server`);
    console.log('Raw gallery data:', galleriesData);
    
    const galleries = galleriesData.map((data: any) => {
      console.log('Processing gallery data:', data);
      const cacheBust = data.uploadDate ? `?v=${encodeURIComponent(data.uploadDate)}` : '';
      const images = data.images ? data.images.map((img: string) => {
        // For specific known galleries with different folder names
        let actualFolderName = data.galerie;
        if (data.galerie === "Zoo Leipzig") {
          actualFolderName = "11.08.2025 - Zoo Leipzig";
        }
        // Encode both folder and filename to safely handle spaces and umlauts
        const isEncoded = (s: string) => /%[0-9A-Fa-f]{2}/.test(s);
        const enc = (s: string) => encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29');
        const encodedFolder = isEncoded(actualFolderName) ? actualFolderName.replace(/\(/g, '%28').replace(/\)/g, '%29') : enc(actualFolderName);
        const encodedImg = img.startsWith('http') ? img : (isEncoded(img) ? img.replace(/\(/g, '%28').replace(/\)/g, '%29') : enc(img));
        return img.startsWith('http')
          ? `${img}${img.includes('?') ? '' : cacheBust}`
          : `${UPLOADS_BASE_URL}/${data.jahr}/${encodedFolder}/${encodedImg}${cacheBust}`;
      }) : [];
      
      return transformGalleryData({ 
        ...data, 
        images, 
        year: data.jahr, 
        name: data.galerie 
      });
    });
    
    console.log('Transformed galleries:', galleries);
    return galleries;
    
  } catch (error) {
    console.error('Error fetching from server, using fallback:', error);
    
    // Fallback to static data only if server fails
    return FALLBACK_GALLERIES.map(data => {
      const images = generateImageUrls(data.jahr, data.galerie);
      return transformGalleryData({ ...data, images, year: data.jahr, name: data.galerie });
    });
  }
};

// Fallback data (only used if server fails)
const FALLBACK_GALLERIES = [
  {
    jahr: "2025", galerie: "06.07.2025 - expressions_01", kategorie: "Best of Trinax",
    tags: ["Best of Trinax"], isVideo: false, uploadDate: "2025-07-08 18:31:12", accessType: "public"
  },
  {
    jahr: "2025", galerie: "11.08.2025 - Zoo Leipzig", kategorie: "Best of Trinax", 
    tags: ["Best of Trinax"], isVideo: false, uploadDate: "2025-08-11 15:20:00", accessType: "public"
  }
];

// Generate image URLs based on common patterns
const generateImageUrls = (year: string, galleryName: string): string[] => {
  const baseUrl = `${UPLOADS_BASE_URL}/${year}/${galleryName}`;
  return ['DSC02495.jpg', 'DSC02496.jpg', 'DSC02498.jpg'].map(img => `${baseUrl}/${img}`);
};

// Fetch specific gallery metadata
export const fetchGalleryMetadata = async (year: string, galleryName: string): Promise<GalleryMetadata | null> => {
  try {
    const metaUrl = `${UPLOADS_BASE_URL}/${year}/${galleryName}/meta.json`;
    console.log('Trying to fetch metadata from:', metaUrl);
    
    const response = await fetch(`${metaUrl}?_=${Date.now()}`, {
      cache: 'no-store'
    });
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.warn(`Failed to fetch metadata for ${year}/${galleryName}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Fetched metadata:', data);
    return data;
  } catch (error) {
    console.error('Error fetching gallery metadata:', error);
    return null;
  }
};

// Fetch images for a specific gallery - now uses the gallery data from API
export const fetchGalleryImages = async (year: string, galleryName: string): Promise<string[]> => {
  console.log(`🔍 Searching for images: ${year}/${galleryName}`);
  
  // First, get the gallery data from the main API to find the correct images
  try {
    const galleries = await fetchGalleries();
    console.log(`📋 Total galleries available: ${galleries.length}`);
    
    // Debug: Show all available galleries for this year
    const yearGalleries = galleries.filter(g => g.year === year);
    console.log(`📅 Galleries in year ${year}:`, yearGalleries.map(g => ({
      galerie: g.galerie,
      title: g.title,
      folderPath: g.folderPath
    })));
    
    const gallery = galleries.find(g => 
      g.year === year && (
        g.galerie === galleryName || 
        g.title === galleryName ||
        g.galerie.includes(galleryName) ||
        galleryName.includes(g.galerie)
      )
    );
    
    if (gallery) {
      console.log(`✅ Found matching gallery:`, {
        galerie: gallery.galerie,
        title: gallery.title,
        folderPath: gallery.folderPath,
        imageCount: gallery.images?.length || 0
      });
      
      if (gallery.images && gallery.images.length > 0) {
        console.log(`🖼️ Returning ${gallery.images.length} images`);
        console.log(`🔗 Sample image URLs:`, gallery.images.slice(0, 3));
        return gallery.images;
      }
    } else {
      console.error(`❌ No gallery found for ${year}/${galleryName}`);
      console.log(`💡 Available galleries in ${year}:`, yearGalleries.map(g => g.galerie));
    }
  } catch (error) {
    console.error('💥 Error fetching gallery data:', error);
  }
  
  console.log(`🚫 No images found for gallery ${year}/${galleryName}`);
  return [];
};

// Transform server data to our Gallery interface
const transformGalleryData = (data: any): Gallery => {
  // Use the actual folder name from the server response
  const actualFolderName = data.galerie || data.name || '';
  const year = data.jahr || data.year || '';
  const folderPath = `${year}/${actualFolderName}`;
  
  // Build correct image URLs using the actual folder name
  // Check if images are already full URLs or just filenames
  const cacheBust = data.uploadDate ? `?v=${encodeURIComponent(data.uploadDate)}` : '';
  const imageUrls = data.images && data.images.length > 0 
    ? data.images.map((img: string) => {
        // If image is already a full URL, return as-is
        if (img.startsWith('http')) {
          return `${img}${img.includes('?') ? '' : cacheBust}`;
        }
        // Otherwise, build the full URL with proper encoding
        let correctedFolderName = actualFolderName;
        if (actualFolderName === "Zoo Leipzig") {
          correctedFolderName = "11.08.2025 - Zoo Leipzig";
        }
        const isEncoded = (s: string) => /%[0-9A-Fa-f]{2}/.test(s);
        const enc = (s: string) => encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29');
        const encodedFolderName = isEncoded(correctedFolderName) ? correctedFolderName.replace(/\(/g, '%28').replace(/\)/g, '%29') : enc(correctedFolderName);
        const encodedImg = isEncoded(img) ? img.replace(/\(/g, '%28').replace(/\)/g, '%29') : enc(img);
        return `${UPLOADS_BASE_URL}/${year}/${encodedFolderName}/${encodedImg}${cacheBust}`;
      })
    : [];
  
  // Use a local placeholder to avoid cross-origin requests (prevents ORB on 404)
  const firstImage = imageUrls.length > 0 
    ? imageUrls[0]
    : '/placeholder.svg';

  // Build preview URL from original by inserting '/preview/' before filename
  const toPreviewUrl = (url: string): string => {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/');
      const file = parts.pop() || '';
      parts.push('preview');
      parts.push(file);
      return `${u.origin}${parts.join('/')}${u.search}`;
    } catch {
      // Fallback string replacement if URL constructor fails
      return url.replace(/\/([^\/]+)$/,'/preview/$1');
    }
  };
  const cardImage = (firstImage && firstImage.startsWith('http')) ? toPreviewUrl(firstImage) : firstImage;

  return {
    id: `${year}-${actualFolderName.replace(/[^a-zA-Z0-9]/g, '-')}`,
    title: data.galerie || actualFolderName,
    image: cardImage,
    year: data.jahr || year,
    mediaCount: imageUrls.length,
    isPublic: data.accessType === 'public',
    category: (data.kategorie || 'BEST OF TRINAX').toUpperCase(),
    folderPath,
    images: imageUrls,
    jahr: data.jahr || year,
    galerie: actualFolderName, // Use the actual folder name for navigation
    kategorie: data.kategorie || 'Best of Trinax',
    tags: data.tags || [],
    isVideo: data.isVideo || false,
    uploadDate: data.uploadDate || '',
    accessType: data.accessType || 'public'
  };
};

// Blog API functions
export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    // Only use new blog API (no fallback to old index.json)
    const response = await fetch(`${BLOG_SERVER_BASE_URL}/list-blog-posts.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data.map(transformBlogPost);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
};

// Transform blog post data to ensure proper format
const transformBlogPost = (post: any): BlogPost => {
  console.log('Transforming blog post:', post);

  // Normalize date with fallbacks and ensure a valid ISO string
  const pickDate = (p: any): string => {
    const rawCandidates = [p.date, p.created, p.modified, p.updatedAt].filter(Boolean) as string[];

    const tryParse = (s: string): Date | null => {
      // Try native parse first
      let dt = new Date(s);
      if (!isNaN(dt.getTime())) return dt;
      // Try replacing space with 'T' (e.g. '2025-09-16 08:39:56' -> ISO-like)
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
        dt = new Date(s.replace(' ', 'T'));
        if (!isNaN(dt.getTime())) return dt;
      }
      // Try DD.MM.YYYY from title
      if (typeof p.title === 'string') {
        const m = p.title.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (m) {
          const [, d, mo, y] = m;
          const dd = parseInt(d, 10);
          const mm = parseInt(mo, 10) - 1;
          const yy = parseInt(y, 10);
          const fromTitle = new Date(yy, mm, dd);
          if (!isNaN(fromTitle.getTime())) return fromTitle;
        }
      }
      // Try extracting YYYY-MM-DD from slug/title
      const text = `${p.slug || ''} ${p.title || ''}`;
      const m2 = text.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
      if (m2) {
        const [, y, mo, d2] = m2;
        const fromSlug = new Date(parseInt(y,10), parseInt(mo,10)-1, parseInt(d2,10));
        if (!isNaN(fromSlug.getTime())) return fromSlug;
      }
      return null;
    };

    let d: Date | null = null;
    for (const c of rawCandidates) {
      const dt = tryParse(c);
      if (dt) { d = dt; break; }
    }
    if (!d) {
      // Fallback: use year if provided, else now
      const y = p.year ? parseInt(p.year.toString()) : NaN;
      d = !isNaN(y) ? new Date(y, 0, 1) : new Date();
    }
    return d.toISOString();
  };

  const transformed = {
    id: post.id || '',
    title: post.title || '',
    content: post.content || post.text || '',
    date: pickDate(post),
    author: post.author || 'Admin',
    tags: Array.isArray(post.tags)
      ? post.tags
      : typeof post.tags === 'string'
        ? post.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [],
    published: post.published === true || post.published === 'true' || post.published === 1,
    year: post.year ? parseInt(post.year.toString()) : new Date().getFullYear(),
    slug: post.slug || '',
    category: post.category || '',
    excerpt: post.excerpt || '',
    modified: post.modified || '',
    featured_image: post.featured_image || '',
    images: Array.isArray(post.images) ? post.images : []
  };

  console.log('Transformed blog post:', transformed);
  return transformed;
};

// Admin API functions
export const uploadImages = async (galleryPath: string, files: FileList): Promise<boolean> => {
  try {
    // Parse galleryPath to get year and gallery name
    const [year, gallery] = galleryPath.split('/');
    
    const results = [];
    
    // Upload files one by one as expected by the PHP server
    for (const file of Array.from(files)) {
      let success = false;
      
      // Try with token as form data to avoid CORS issues
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year);
      formData.append('gallery', gallery);
      formData.append('kategorie', 'Best of Trinax'); // Default category
      formData.append('token', API_TOKEN); // Add token as form data
      
      const response = await fetch(`${SERVER_BASE_URL}/server-upload-new.php`, {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });
      
      if (response.ok) {
        console.log(`Successfully uploaded ${file.name}`);
        success = true;
      } else {
        console.error(`Upload failed for ${file.name}:`, response.status, response.statusText);
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText);
        } catch (e) {
          console.error('Could not read error response');
        }
      }
      
      results.push(success);
    }
    
    // Return true only if all uploads succeeded
    const ok = results.every(result => result === true);
    if (ok && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('galleries:updated'));
    }
    return ok;
  } catch (error) {
    console.error('Error uploading images:', error);
    return false;
  }
};

export const createGallery = async (galleryData: Partial<GalleryMetadata>): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/server-create-gallery.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...galleryData,
        token: API_TOKEN
      })
    });
    
    const ok = response.ok;
    if (ok && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('galleries:updated'));
    }
    return ok;
  } catch (error) {
    console.error('Error creating gallery:', error);
    return false;
  }
};

export const updateGalleryMetadata = async (year: string, galleryName: string, metadata: Partial<GalleryMetadata>): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/update-gallery.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        year,
        gallery: galleryName,
        metadata,
        token: API_TOKEN
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error updating gallery metadata:', error);
    return false;
  }
};

export const createBlogPost = async (postData: {
  title: string;
  content: string;
  author: string;
  category?: string;
  tags: string[];
  published: boolean;
  year?: number;
}): Promise<boolean> => {
  try {
    const response = await fetch(`${BLOG_SERVER_BASE_URL}/create-blog-post.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({ ...postData, token: API_TOKEN })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error creating blog post:', error);
    return false;
  }
};

export const updateBlogPost = async (slug: string, year: number, postData: Partial<BlogPost>): Promise<boolean> => {
  const payload = {
    ...postData,
    id: postData.id || '',
    year: postData.year || year,
    token: API_TOKEN
  };
  try {
    // Attempt with PUT + Authorization header
    let response = await fetch(`${BLOG_SERVER_BASE_URL}/update-blog-post.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    // If unauthorized or method not allowed, retry with POST (some PHP handlers expect POST)
    if (!response.ok && (response.status === 401 || response.status === 405)) {
      response = await fetch(`${BLOG_SERVER_BASE_URL}/update-blog-post.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(payload)
      });
    }

    return response.ok;
  } catch (error) {
    console.error('Error updating blog post:', error);
    return false;
  }
};

export const deleteBlogPost = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BLOG_SERVER_BASE_URL}/delete-blog-post.php?id=${encodeURIComponent(id)}&token=${encodeURIComponent(API_TOKEN)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
};

export const uploadBlogImage = async (slug: string, year: number, files: FileList): Promise<boolean> => {
  try {
    const results = [];
    
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('blogId', slug);
      formData.append('token', API_TOKEN);
      
      const response = await fetch(`${BLOG_SERVER_BASE_URL}/upload-blog-image.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: formData,
        mode: 'cors'
      });
      
      results.push(response.ok);
    }
    
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error uploading blog images:', error);
    return false;
  }
};

export const deleteImage = async (year: string, gallery: string, imageName: string): Promise<boolean> => {
  try {
    // Allow callers to pass either a bare filename or a full URL
    let effectiveName = imageName;
    try {
      if (imageName.includes('/')) {
        const url = new URL(imageName, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        const last = url.pathname.split('/').pop() || imageName;
        effectiveName = decodeURIComponent(last);
      }
    } catch {
      // Fallback: if not a valid URL but contains '/', take last segment
      if (imageName.includes('/')) {
        const parts = imageName.split('/');
        effectiveName = decodeURIComponent(parts[parts.length - 1] || imageName);
      }
    }

    const formData = new FormData();
    formData.append('year', year);
    formData.append('gallery', gallery);
    formData.append('imageName', effectiveName);
    formData.append('token', API_TOKEN);
    
    const response = await fetch(`${SERVER_BASE_URL}/server-delete-image.php`, {
      method: 'POST',
      body: formData,
      mode: 'cors'
    });
    
    if (response.ok) {
      console.log(`Successfully deleted image: ${imageName}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('galleries:updated'));
      }
      return true;
    } else {
      console.error(`Failed to delete image ${imageName}:`, response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

export const deleteGallery = async (year: string, gallery: string): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('year', year);
    formData.append('gallery', gallery);
    formData.append('token', API_TOKEN);
    
    const response = await fetch(`${SERVER_BASE_URL}/delete-gallery.php`, {
      method: 'POST',
      body: formData,
      mode: 'cors'
    });
    
    if (response.ok) {
      console.log(`Successfully deleted gallery: ${year}/${gallery}`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('galleries:updated'));
      }
      return true;
    } else {
      console.error(`Failed to delete gallery ${year}/${gallery}:`, response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error deleting gallery:', error);
    return false;
  }
};

// Category management functions
export const fetchCategories = async (): Promise<string[]> => {
  try {
    // First try to get from localStorage (for recently updated categories)
    const stored = localStorage.getItem('categories');
    if (stored) {
      const data = JSON.parse(stored);
      return data.categories || [];
    }

    // Then try to fetch from server
    const response = await fetch('/categories.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Fallback to default categories
    return [
      'BEST OF TRINAX',
      'LOSTPLACES', 
      'VILLA - SOUNDLABOR',
      'LANDSCHAFT',
      'PORTRAIT',
      'URLAUB'
    ];
  }
};

export const updateCategories = async (categories: string[]): Promise<void> => {
  // For development, we'll simulate success since we can't write to the local file system from external server
  // In production, this would need to be handled by your actual backend
  try {
    const response = await fetch(`${SERVER_BASE_URL}/update-categories.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        categories,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      })
    });

    // If external server fails, we'll update the local categories.json manually
    if (!response.ok) {
      console.warn('External server update failed, updating locally');
      
      // Update the local categories.json file by creating a new version
      const updatedData = {
        categories,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      
      // Store in localStorage as fallback for immediate UI updates
      localStorage.setItem('categories', JSON.stringify(updatedData));
      return;
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to update categories');
    }
  } catch (error) {
    console.warn('Category update failed, using localStorage fallback:', error);
    
    // Fallback: store in localStorage
    const updatedData = {
      categories,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem('categories', JSON.stringify(updatedData));
  }
};
