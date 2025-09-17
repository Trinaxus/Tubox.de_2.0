<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

try {
    // Get token from header
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    if (empty($token) || $token !== 'Bearer your-admin-token') {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    
    $blogId = $_GET['id'] ?? '';
    
    if (empty($blogId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Blog post ID is required']);
        exit();
    }
    
    // Using server's absolute path to blog uploads directory
    $blogUploadsDir = '/www/htdocs/w0062fc1/TuBox/TUBOX/server/blog-uploads';
    
    // Find and delete the blog post
    $deleted = false;
    
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
                $postPath = $yearPath . '/' . $slug;
                $metaFile = $postPath . '/meta.json';
                
                if (file_exists($metaFile)) {
                    $metaContent = file_get_contents($metaFile);
                    $meta = json_decode($metaContent, true);
                    
                    if ($meta && $meta['id'] === $blogId) {
                        // Delete the entire post directory
                        function deleteDirectory($dir) {
                            if (!file_exists($dir)) return true;
                            if (!is_dir($dir)) return unlink($dir);
                            
                            foreach (scandir($dir) as $item) {
                                if ($item == '.' || $item == '..') continue;
                                if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
                            }
                            
                            return rmdir($dir);
                        }
                        
                        $deleted = deleteDirectory($postPath);
                        break 2;
                    }
                }
            }
        }
    }
    
    if (!$deleted) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Blog post not found']);
        exit();
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Blog post deleted successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>