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
    $kategorie = $_POST['kategorie'] ?? 'Best of Trinax';
    
    if (!$year || !$gallery) {
        throw new Exception('Year and gallery are required');
    }
    
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }
    
    $file = $_FILES['file'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload error: ' . $file['error']);
    }
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }
    
    // Create directory structure (uploads is two levels up from api/gallery-api)
    $uploadDir = __DIR__ . "/../../uploads/$year/$gallery";
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception('Failed to create upload directory: ' . $uploadDir);
        }
    }
    
    // Normalize filename (umlauts, spaces, special chars) and ensure uniqueness
    $originalName = $file['name'];
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $basename = pathinfo($originalName, PATHINFO_FILENAME);

    // Transliterate common German umlauts and eszett
    $trans = [
        'ä' => 'ae', 'Ä' => 'Ae',
        'ö' => 'oe', 'Ö' => 'Oe',
        'ü' => 'ue', 'Ü' => 'Ue',
        'ß' => 'ss'
    ];
    $basename = strtr($basename, $trans);

    // Attempt ASCII transliteration if iconv is available
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $basename);
        if ($converted !== false) {
            $basename = $converted;
        }
    }

    // Replace any non-word chars with dashes, collapse repeats, trim
    $basename = preg_replace('/[^A-Za-z0-9_.-]+/', '-', $basename);
    $basename = preg_replace('/-+/', '-', $basename);
    $basename = trim($basename, '-_.');
    $basename = strtolower($basename ?: 'image');

    // Recompose filename with original extension
    $filename = $basename . ($extension ? '.' . $extension : '');

    // Ensure unique within target directory
    $counter = 1;
    while (file_exists($uploadDir . '/' . $filename)) {
        $filename = $basename . '_' . $counter . ($extension ? '.' . $extension : '');
        $counter++;
    }

    $targetPath = $uploadDir . '/' . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // Create preview thumbnail in preview/ subfolder
    try {
        $previewDir = $uploadDir . '/preview';
        if (!is_dir($previewDir)) {
            @mkdir($previewDir, 0755, true);
        }

        $srcPath = $targetPath;
        $dstPath = $previewDir . '/' . $filename;

        // Only create previews for known image types
        $ext = strtolower($extension);
        if (in_array($ext, ['jpg','jpeg','png','gif','webp'])) {
            // Load source image
            switch ($ext) {
                case 'jpg':
                case 'jpeg':
                    $src = @imagecreatefromjpeg($srcPath);
                    break;
                case 'png':
                    $src = @imagecreatefrompng($srcPath);
                    break;
                case 'gif':
                    $src = @imagecreatefromgif($srcPath);
                    break;
                case 'webp':
                    if (function_exists('imagecreatefromwebp')) {
                        $src = @imagecreatefromwebp($srcPath);
                    } else {
                        $src = null;
                    }
                    break;
                default:
                    $src = null;
            }

            if ($src) {
                $w = imagesx($src);
                $h = imagesy($src);
                $max = 600; // max long edge (extra speed)
                $scale = ($w > $h) ? ($max / max(1,$w)) : ($max / max(1,$h));
                if ($scale > 1) { $scale = 1; }
                $nw = max(1, (int)round($w * $scale));
                $nh = max(1, (int)round($h * $scale));
                $dst = imagecreatetruecolor($nw, $nh);

                // Preserve transparency for PNG/GIF
                if (in_array($ext, ['png','gif'])) {
                    imagealphablending($dst, false);
                    imagesavealpha($dst, true);
                    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
                    imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
                }

                imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

                // Save preview
                switch ($ext) {
                    case 'jpg':
                    case 'jpeg':
                        @imagejpeg($dst, $dstPath, 70);
                        break;
                    case 'png':
                        @imagepng($dst, $dstPath, 6);
                        break;
                    case 'gif':
                        @imagegif($dst, $dstPath);
                        break;
                    case 'webp':
                        if (function_exists('imagewebp')) {
                            @imagewebp($dst, $dstPath, 70);
                        }
                        break;
                }

                imagedestroy($dst);
                imagedestroy($src);
            }
        }
    } catch (\Throwable $thumbErr) {
        // Do not fail upload if preview generation fails
        error_log('Thumbnail generation failed: ' . $thumbErr->getMessage());
    }
    
    // Update or create meta.json
    $metaFile = $uploadDir . '/meta.json';
    $metaData = [];
    
    if (file_exists($metaFile)) {
        $metaContent = file_get_contents($metaFile);
        if ($metaContent) {
            $metaData = json_decode($metaContent, true) ?: [];
        }
    }
    
    // Update metadata
    $metaData['jahr'] = $year;
    $metaData['galerie'] = $gallery;
    $metaData['kategorie'] = $kategorie;
    $metaData['uploadDate'] = date('Y-m-d H:i:s');
    $metaData['accessType'] = $metaData['accessType'] ?? 'public';
    $metaData['tags'] = $metaData['tags'] ?? [];
    
    if (!in_array($kategorie, $metaData['tags'])) {
        $metaData['tags'][] = $kategorie;
    }
    
    // Save metadata
    file_put_contents($metaFile, json_encode($metaData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully',
        'filename' => $filename,
        'path' => $targetPath
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>