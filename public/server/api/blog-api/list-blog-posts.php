<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Path to blog uploads directory - using server's absolute path
    $blogUploadsDir = '/www/htdocs/w0062fc1/TuBox/TUBOX/server/blog-uploads';
    $publicDir = '/www/htdocs/w0062fc1/TuBox';
    $indexFile = $publicDir . '/blog-index.json';
    
    // Create public directory if it doesn't exist
    if (!file_exists($publicDir)) {
        mkdir($publicDir, 0755, true);
    }
    
    $blogPosts = [];
    $existingIds = []; // Track post IDs to prevent duplicates
    
    if (file_exists($blogUploadsDir)) {
        // Scan year directories
        $yearDirs = array_filter(scandir($blogUploadsDir), function($item) use ($blogUploadsDir) {
            return $item !== '.' && $item !== '..' && is_dir($blogUploadsDir . '/' . $item) && is_numeric($item);
        });
        
        foreach ($yearDirs as $year) {
            $yearPath = $blogUploadsDir . '/' . $year;
            
            // Scan blog post directories within year
            $postDirs = array_filter(scandir($yearPath), function($item) use ($yearPath) {
                return $item !== '.' && $item !== '..' && is_dir($yearPath . '/' . $item);
            });
            
            foreach ($postDirs as $slug) {
                $postPath = $yearPath . '/' . $slug;
                $metaFile = $postPath . '/meta.json';
                
                if (file_exists($metaFile)) {
                    $metaContent = file_get_contents($metaFile);
                    $meta = json_decode($metaContent, true);
                    
                    if ($meta) {
                        error_log("Processing post: " . ($meta['title'] ?? 'Untitled') . " (ID: " . ($meta['id'] ?? 'none') . ")");
                        // Get images in the post directory
                        $images = [];
                        $imageFiles = array_filter(scandir($postPath), function($item) {
                            return preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $item);
                        });
                        
                        foreach ($imageFiles as $imageFile) {
                            $images[] = $year . '/' . $slug . '/' . $imageFile;
                        }
                        
                        // Skip if we've already processed this post ID
                        if (empty($meta['id'])) {
                            error_log("Skipping post - missing ID: " . ($meta['title'] ?? 'Untitled'));
                            continue;
                        }
                        
                        if (!in_array($meta['id'], $existingIds)) {
                            $blogPost = [
                                'id' => $meta['id'],
                                'title' => $meta['title'],
                                'slug' => $slug,
                                'year' => $year,
                                'category' => $meta['category'] ?? '',
                                'excerpt' => $meta['excerpt'] ?? '',
                                'content' => $meta['content'] ?? '',
                                'featured_image' => $meta['featured_image'] ?? '',
                                'author' => $meta['author'] ?? 'Admin',
                                'published' => $meta['published'] ?? false,
                                'tags' => $meta['tags'] ?? [],
                                'images' => $images,
                                'created' => $meta['created'],
                                'modified' => $meta['modified'] ?? $meta['created']
                            ];
                            
                            $blogPosts[] = $blogPost;
                            $existingIds[] = $meta['id']; // Track this ID
                            error_log("Added post: " . $blogPost['title'] . " (ID: " . $blogPost['id'] . ") - Published: " . ($blogPost['published'] ? 'Yes' : 'No'));
                            
                            // Debug: Log the entire meta data for this post
                            error_log("Meta data for " . $blogPost['title'] . ": " . json_encode($meta, JSON_PRETTY_PRINT));
                        }
                    }
                }
            }
        }
    }
    
    // Sort by creation date (newest first)
    usort($blogPosts, function($a, $b) {
        return strtotime($b['created']) - strtotime($a['created']);
    });
    
    // Update the blog index file
    file_put_contents($indexFile, json_encode($blogPosts, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'data' => $blogPosts
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>