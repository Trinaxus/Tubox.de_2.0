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
    // Validate token
    $token = $_POST['token'] ?? '';
    if ($token !== '0000') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit();
    }
    
    $year = $_POST['year'] ?? '';
    $gallery = $_POST['gallery'] ?? '';
    $imageName = $_POST['imageName'] ?? '';
    
    if (!$year || !$gallery || !$imageName) {
        throw new Exception('Year, gallery, and image name are required');
    }
    
    // uploads is two levels up from api/gallery-api
    $uploadsDir = __DIR__ . '/../../uploads';
    
    if (!is_dir($uploadsDir)) {
        throw new Exception('Uploads directory not found at: ' . $uploadsDir);
    }
    
    // Decode potential URL-encoded parameters (spaces, umlauts, parentheses)
    $galleryDecoded = urldecode($gallery);
    $imageNameDecoded = urldecode($imageName);
    // Strip query strings (e.g., cache busters like ?v=...)
    $stripQuery = function($s) { $qpos = strpos($s, '?'); return $qpos === false ? $s : substr($s, 0, $qpos); };
    $imageName = $stripQuery($imageName);
    $imageNameDecoded = $stripQuery($imageNameDecoded);

    $dir = $uploadsDir . "/$year/$galleryDecoded";
    if (!is_dir($dir)) {
        // Fall back to original gallery string
        $dir = $uploadsDir . "/$year/$gallery";
    }

    if (!is_dir($dir)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Gallery folder not found']);
        exit();
    }

    // Helper: find file with multiple strategies
    $candidates = [];
    $candidates[] = $dir . '/' . $imageName;
    $candidates[] = $dir . '/' . $imageNameDecoded;

    $foundPath = null;
    foreach ($candidates as $path) {
        if ($path && file_exists($path)) { $foundPath = $path; break; }
    }

    if ($foundPath === null) {
        // Case-insensitive search as last resort
        $files = @scandir($dir) ?: [];
        $targetLower = strtolower($imageNameDecoded ?: $imageName);
        foreach ($files as $f) {
            if ($f === '.' || $f === '..') continue;
            if (strtolower($f) === $targetLower) { $foundPath = $dir . '/' . $f; break; }
        }
    }

    if ($foundPath === null) {
        // Try preview directory as a fallback
        $previewDir = $dir . '/preview';
        if (is_dir($previewDir)) {
            $previewCandidates = [];
            $previewCandidates[] = $previewDir . '/' . $imageName;
            $previewCandidates[] = $previewDir . '/' . $imageNameDecoded;
            foreach ($previewCandidates as $p) {
                if ($p && file_exists($p)) { $foundPath = $p; break; }
            }
            if ($foundPath === null) {
                $files = @scandir($previewDir) ?: [];
                $targetLower = strtolower($imageNameDecoded ?: $imageName);
                foreach ($files as $f) {
                    if ($f === '.' || $f === '..') continue;
                    if (strtolower($f) === $targetLower) { $foundPath = $previewDir . '/' . $f; break; }
                }
            }
            if ($foundPath !== null) {
                if (!unlink($foundPath)) {
                    throw new Exception('Failed to delete preview file');
                }
                echo json_encode(['success' => true, 'message' => 'Preview deleted']);
                exit();
            }
        }

        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Image not found',
            'debug' => [
                'year' => $year,
                'gallery' => $gallery,
                // Only send filenames, not absolute paths
                'tried' => array_values(array_filter([
                    basename($imageName),
                    basename($imageNameDecoded)
                ]))
            ]
        ]);
        exit();
    }

    // Delete the image file
    if (!unlink($foundPath)) {
        throw new Exception('Failed to delete image file');
    }
    // Delete preview file if present
    $previewPath = dirname($foundPath) . '/preview/' . basename($foundPath);
    if (file_exists($previewPath)) {
        @unlink($previewPath);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Image deleted successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>