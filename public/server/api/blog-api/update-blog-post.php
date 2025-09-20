<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Accept POST and PUT
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get token from header or body
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? '');
    $bearerToken = '';
    if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $m)) {
        $bearerToken = trim($m[1]);
    }

    // Parse JSON body if provided, else use form fields
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    $input = is_array($json) ? $json : $_POST;

    $bodyToken = $input['token'] ?? '';
    $providedToken = !empty($bearerToken) ? $bearerToken : $bodyToken;

    // Expected token (env or default)
    $expected = getenv('API_TOKEN');
    if ($expected === false || $expected === null || $expected === '') {
        $expected = '0000';
    }

    if (empty($providedToken) || $providedToken !== $expected) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Blog post ID is required']);
        exit();
    }
    
    $blogId = $input['id'];
    // Using server's absolute path to blog uploads directory
    $blogUploadsDir = '/www/htdocs/w0062fc1/TuBox/TUBOX/server/blog-uploads';
    
    // Find the blog post
    $metaFile = null;
    $postPath = null;
    
    if (file_exists($blogUploadsDir)) {
        $yearDirs = array_filter(scandir($blogUploadsDir), function($item) use ($blogUploadsDir) {
            return $item !== '.' && $item !== '..' && is_dir($blogUploadsDir . '/' . $item) && is_numeric($item);
        });
        
        foreach ($yearDirs as $year) {
            $yearPath = $blogUploadsDir . '/' . $year;
            $postDirs = array_filter(scandir($yearPath), function($item) use ($yearPath) {
                return $item !== '.' && $item !== '..' && is_dir($yearPath . '/' . $item);
            });
            
            foreach ($postDirs as $slug) {
                $currentPostPath = $yearPath . '/' . $slug;
                $currentMetaFile = $currentPostPath . '/meta.json';
                
                if (file_exists($currentMetaFile)) {
                    $metaContent = file_get_contents($currentMetaFile);
                    $meta = json_decode($metaContent, true);
                    
                    if ($meta && $meta['id'] === $blogId) {
                        $metaFile = $currentMetaFile;
                        $postPath = $currentPostPath;
                        break 2;
                    }
                }
            }
        }
    }
    
    if (!$metaFile) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Blog post not found']);
        exit();
    }
    
    // Load existing meta
    $metaContent = file_get_contents($metaFile);
    $meta = json_decode($metaContent, true);
    
    // Check if year is being updated
    $yearChanged = isset($input['year']) && $input['year'] != $meta['year'];
    $newYear = $yearChanged ? strval($input['year']) : $meta['year'];
    
    // Update fields
    if (isset($input['title'])) $meta['title'] = $input['title'];
    if (isset($input['category'])) $meta['category'] = $input['category'];
    if (isset($input['excerpt'])) $meta['excerpt'] = $input['excerpt'];
    if (isset($input['content'])) $meta['content'] = $input['content'];
    if (isset($input['featured_image'])) $meta['featured_image'] = $input['featured_image'];
    if (isset($input['author'])) $meta['author'] = $input['author'];
    if (isset($input['published'])) $meta['published'] = $input['published'];
    if (isset($input['tags'])) $meta['tags'] = is_array($input['tags']) ? $input['tags'] : explode(',', $input['tags']);
    if (isset($input['year'])) $meta['year'] = $newYear;
    
    $meta['modified'] = date('Y-m-d H:i:s');
    
    if ($yearChanged) {
        // Create new directory structure if it doesn't exist
        // Ensure posts are stored under blog-uploads/<year>, not server/<year>
        $newYearPath = $blogUploadsDir . '/' . $newYear;
        if (!file_exists($newYearPath)) {
            mkdir($newYearPath, 0755, true);
        }
        
        $newPostPath = $newYearPath . '/' . basename($postPath);
        
        // If the new path is different from the old one
        if (realpath($postPath) !== realpath($newPostPath)) {
            // First, save the current meta data to a temporary variable
            $tempMeta = $meta;
            
            // If the new path already exists, we need to handle that case
            if (file_exists($newPostPath)) {
                // Generate a unique slug for the new path
                $baseSlug = basename($postPath);
                $counter = 1;
                while (file_exists($newYearPath . '/' . $baseSlug . '-' . $counter)) {
                    $counter++;
                }
                $newPostPath = $newYearPath . '/' . $baseSlug . '-' . $counter;
            }
            
            // Move the directory to the new location
            rename($postPath, $newPostPath);
            
            // Update the paths
            $oldPostPath = $postPath;
            $postPath = $newPostPath;
            $metaFile = $postPath . '/meta.json';
            
            // Restore the meta data with updated paths
            $meta = $tempMeta;
            
            // Update the slug in meta if we had to modify it
            $meta['slug'] = basename($postPath);
            
            // Update the year in meta
            $meta['year'] = $newYear;
            
            // Save the meta file immediately
            file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT));
        }
    }
    
    // Save updated meta
    file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'data' => $meta
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>