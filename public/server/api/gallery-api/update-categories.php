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
    
    if (!$input || !isset($input['categories'])) {
        throw new Exception('Invalid input data');
    }
    
    $categories = $input['categories'];
    $lastUpdated = $input['lastUpdated'] ?? date('c');
    $version = $input['version'] ?? '1.0';
    
    // Validate categories
    if (!is_array($categories)) {
        throw new Exception('Categories must be an array');
    }
    
    // Clean and validate each category
    $cleanCategories = [];
    foreach ($categories as $category) {
        $category = trim($category);
        if (!empty($category)) {
            $cleanCategories[] = $category;
        }
    }
    
    $data = [
        'categories' => $cleanCategories,
        'lastUpdated' => $lastUpdated,
        'version' => $version
    ];
    
    $categoriesFile = __DIR__ . '/../../public/categories.json';
    
    // Create backup of existing file
    if (file_exists($categoriesFile)) {
        $backupFile = $categoriesFile . '.backup.' . date('Y-m-d-H-i-s');
        copy($categoriesFile, $backupFile);
    }
    
    // Write new categories file
    $result = file_put_contents($categoriesFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        throw new Exception('Failed to write categories file');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Categories updated successfully',
        'categories' => $cleanCategories
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>