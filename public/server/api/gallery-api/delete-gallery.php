<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Validate token
    $token = $_POST['token'] ?? '';
    if ($token !== '0000') {
        throw new Exception('Invalid token');
    }
    
    $year = $_POST['year'] ?? '';
    $gallery = $_POST['gallery'] ?? '';
    
    if (!$year || !$gallery) {
        throw new Exception('Year and gallery are required');
    }
    
    // uploads is two levels up from api/gallery-api
    $uploadsDir = __DIR__ . '/../../uploads';
    $galleryPath = $uploadsDir . "/$year/$gallery";
    
    if (!is_dir($galleryPath)) {
        throw new Exception('Gallery not found');
    }
    
    // Recursive directory deletion function
    function deleteDirectory(string $dir): bool {
        if (!is_dir($dir)) {
            return false;
        }
        
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = "$dir/$file";
            if (is_dir($path)) {
                deleteDirectory($path);
            } else {
                unlink($path);
            }
        }
        
        return rmdir($dir);
    }
    
    // Delete the gallery directory
    if (deleteDirectory($galleryPath)) {
        echo json_encode([
            'success' => true,
            'message' => 'Gallery deleted successfully'
        ]);
    } else {
        throw new Exception('Failed to delete gallery');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>