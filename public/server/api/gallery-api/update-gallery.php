<?php
header('Content-Type: application/json; charset=utf-8');
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
    
    $year = $input['year'] ?? '';
    $gallery = $input['gallery'] ?? '';
    $metadata = $input['metadata'] ?? [];
    
    if (!$year || !$gallery) {
        throw new Exception('Year and gallery are required');
    }
    
    // uploads is two levels up from api/gallery-api
    $uploadsDir = __DIR__ . '/../../uploads';
    // Resolve gallery directory with decoded fallback
    $galleryDecoded = urldecode($gallery);
    $galleryDir = $uploadsDir . "/$year/$galleryDecoded";
    if (!is_dir($galleryDir)) {
        $galleryDir = $uploadsDir . "/$year/$gallery";
    }
    
    if (!is_dir($galleryDir)) {
        throw new Exception('Gallery not found');
    }
    
    $metaFile = $galleryDir . '/meta.json';
    $existingData = [];
    
    // Load existing metadata
    if (file_exists($metaFile)) {
        $existingContent = file_get_contents($metaFile);
        if ($existingContent) {
            $existingData = json_decode($existingContent, true) ?: [];
        }
    }
    
    // Do not allow overwriting identity fields from metadata
    unset($metadata['galerie'], $metadata['jahr']);

    // Normalize metadata strings to UTF-8
    $normalizeUtf8 = function ($value) use (&$normalizeUtf8) {
        if (is_array($value)) {
            $out = [];
            foreach ($value as $k => $v) {
                $out[$k] = $normalizeUtf8($v);
            }
            return $out;
        }
        if (is_string($value)) {
            if (function_exists('mb_detect_encoding') && function_exists('mb_convert_encoding')) {
                $enc = mb_detect_encoding($value, ['UTF-8','ISO-8859-1','Windows-1252'], true);
                if ($enc !== 'UTF-8') {
                    return mb_convert_encoding($value, 'UTF-8', $enc ?: 'UTF-8');
                }
            }
        }
        return $value;
    };

    $metadata = $normalizeUtf8($metadata);

    // Merge metadata, preserving uploadDate and identity
    $mergedData = array_merge($existingData, $metadata);
    if (isset($existingData['uploadDate'])) {
        $mergedData['uploadDate'] = $existingData['uploadDate'];
    }
    // Enforce identity from folder structure
    $mergedData['jahr'] = $year;
    $mergedData['galerie'] = $gallery;

    // If accessType is not password, clear password to avoid stale secrets
    if (($mergedData['accessType'] ?? 'public') !== 'password') {
        $mergedData['password'] = '';
    }
    
    // Save updated metadata
    $result = file_put_contents($metaFile, json_encode($mergedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        throw new Exception('Failed to update meta.json file');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Gallery updated successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>