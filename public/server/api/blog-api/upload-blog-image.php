<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    $blogId = $_POST['blogId'] ?? '';
    
    if (empty($blogId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Blog post ID is required']);
        exit();
    }
    
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No image file provided']);
        exit();
    }
    
    $file = $_FILES['image'];
    
    // Validate file
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid file type']);
        exit();
    }
    
    if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File too large']);
        exit();
    }
    
    // Using server's absolute path to blog uploads directory
    $blogUploadsDir = '/www/htdocs/w0062fc1/TuBox/TUBOX/server/blog-uploads';
    
    // Find the blog post directory
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
                $metaFile = $currentPostPath . '/meta.json';
                
                if (file_exists($metaFile)) {
                    $metaContent = file_get_contents($metaFile);
                    $meta = json_decode($metaContent, true);
                    
                    if ($meta && $meta['id'] === $blogId) {
                        $postPath = $currentPostPath;
                        break 2;
                    }
                }
            }
        }
    }
    
    if (!$postPath) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Blog post not found']);
        exit();
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $targetPath = $postPath . '/' . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to upload file']);
        exit();
    }
    
    // Get relative path for URL
    $relativePath = basename(dirname($postPath)) . '/' . basename($postPath) . '/' . $filename;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'filename' => $filename,
            'path' => $relativePath,
            'url' => $relativePath
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>