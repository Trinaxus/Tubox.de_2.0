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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['title'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Title is required']);
        exit();
    }
    
    $title = trim($input['title']);
    $category = $input['category'] ?? '';
    $excerpt = $input['excerpt'] ?? '';
    $content = $input['content'] ?? '';
    $featured_image = $input['featured_image'] ?? '';
    
    // Generate unique ID and slug
    $id = uniqid();
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
    $year = isset($input['year']) ? strval($input['year']) : date('Y');
    
    // Ensure unique slug - using server's absolute path
    $blogUploadsDir = '/www/htdocs/w0062fc1/TuBox/TUBOX/server/blog-uploads';
    $yearPath = $blogUploadsDir . '/' . $year;
    $originalSlug = $slug;
    $counter = 1;
    
    while (file_exists($yearPath . '/' . $slug)) {
        $slug = $originalSlug . '-' . $counter;
        $counter++;
    }
    
    $postPath = $yearPath . '/' . $slug;
    
    // Create directories
    if (!file_exists($blogUploadsDir)) {
        mkdir($blogUploadsDir, 0755, true);
    }
    if (!file_exists($yearPath)) {
        mkdir($yearPath, 0755, true);
    }
    if (!file_exists($postPath)) {
        mkdir($postPath, 0755, true);
    }
    
    // Create meta.json
    $meta = [
        'id' => $id,
        'title' => $title,
        'slug' => $slug,
        'year' => $year,
        'category' => $category,
        'excerpt' => $excerpt,
        'content' => $content,
        'featured_image' => $featured_image,
        'created' => date('Y-m-d H:i:s'),
        'modified' => date('Y-m-d H:i:s')
    ];
    
    $metaFile = $postPath . '/meta.json';
    file_put_contents($metaFile, json_encode($meta, JSON_PRETTY_PRINT));
    
    // Update blog index
    include 'list-blog-posts.php';
    
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