<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Define the uploads directory relative to this script (two levels up)
    // This matches public/server/uploads
    $uploadsDir = __DIR__ . '/../../uploads';
    
    if (!is_dir($uploadsDir)) {
        throw new Exception('Uploads directory not found');
    }
    
    $galleries = [];
    
    // Scan for year directories (assuming they are numeric)
    $yearDirs = array_filter(scandir($uploadsDir), function($item) use ($uploadsDir) {
        return is_dir($uploadsDir . '/' . $item) && is_numeric($item) && $item !== '.' && $item !== '..';
    });
    
    foreach ($yearDirs as $year) {
        $yearPath = $uploadsDir . '/' . $year;
        
        // Scan for gallery directories within each year
        $galleryDirs = array_filter(scandir($yearPath), function($item) use ($yearPath) {
            return is_dir($yearPath . '/' . $item) && $item !== '.' && $item !== '..';
        });
        
        foreach ($galleryDirs as $galleryName) {
            $galleryPath = $yearPath . '/' . $galleryName;
            
            // Initialize gallery data with defaults
            $galleryData = [
                'jahr' => $year,
                'galerie' => $galleryName,
                'kategorie' => 'Best of Trinax',
                'tags' => [],
                'isVideo' => false,
                'uploadDate' => '',
                'accessType' => 'public'
            ];
            
            // Try to load metadata from meta.json
            $metaFile = $galleryPath . '/meta.json';
            if (file_exists($metaFile)) {
                $metaContent = file_get_contents($metaFile);
                if ($metaContent) {
                    $metaData = json_decode($metaContent, true);
                    if ($metaData) {
                        // Merge but do NOT let meta.json override folder-derived identity
                        $merged = array_merge($galleryData, $metaData);
                        // Always use folder values as source of truth for navigation
                        $merged['jahr'] = $year;
                        $merged['galerie'] = $galleryName;
                        $galleryData = $merged;
                    }
                }
            }
            
            // Count images in the gallery
            $imageFiles = [];
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            
            $files = scandir($galleryPath);
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..' && $file !== 'meta.json') {
                    $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                    if (in_array($extension, $allowedExtensions)) {
                        $imageFiles[] = $file;
                    }
                }
            }
            
            // Sort images naturally
            natsort($imageFiles);
            $imageFiles = array_values($imageFiles);
            
            $galleryData['images'] = $imageFiles;
            $galleryData['mediaCount'] = count($imageFiles);
            
            $galleries[] = $galleryData;
        }
    }
    
    // Sort galleries by year (descending) and then by gallery name
    usort($galleries, function($a, $b) {
        $yearCompare = strcmp($b['jahr'], $a['jahr']); // Descending by year
        if ($yearCompare === 0) {
            return strcmp($a['galerie'], $b['galerie']); // Ascending by gallery name
        }
        return $yearCompare;
    });
    
    echo json_encode($galleries, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>