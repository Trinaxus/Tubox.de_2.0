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
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid input data');
    }
    
    // Validate token
    $token = $input['token'] ?? '';
    if ($token !== '0000') {
        throw new Exception('Invalid token');
    }
    
    $jahr = $input['jahr'] ?? '';
    $galerie = $input['galerie'] ?? '';
    $kategorie = $input['kategorie'] ?? 'Best of Trinax';
    $tags = $input['tags'] ?? [];
    $accessType = $input['accessType'] ?? 'public';
    
    if (!$jahr || !$galerie) {
        throw new Exception('Year and gallery name are required');
    }
    
    // Create directory (uploads is two levels up from api/gallery-api)
    $uploadsDir = __DIR__ . '/../../uploads';
    $galleryDir = $uploadsDir . "/$jahr/$galerie";
    
    if (is_dir($galleryDir)) {
        throw new Exception('Gallery already exists');
    }
    
    if (!mkdir($galleryDir, 0755, true)) {
        throw new Exception('Failed to create gallery directory');
    }
    
    // Create meta.json
    $metaData = [
        'jahr' => $jahr,
        'galerie' => $galerie,
        'kategorie' => $kategorie,
        'tags' => is_array($tags) ? $tags : [],
        'isVideo' => false,
        'uploadDate' => date('Y-m-d H:i:s'),
        'accessType' => $accessType
    ];
    
    // Add kategorie to tags if not already present
    if (!in_array($kategorie, $metaData['tags'])) {
        $metaData['tags'][] = $kategorie;
    }
    
    $metaFile = $galleryDir . '/meta.json';
    $result = file_put_contents($metaFile, json_encode($metaData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        throw new Exception('Failed to create meta.json file');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Gallery created successfully',
        'path' => $galleryDir
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>