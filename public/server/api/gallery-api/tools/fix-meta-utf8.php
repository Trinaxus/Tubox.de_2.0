<?php
// Maintenance script: Normalize all meta.json files to UTF-8 and fix 'galerie'/'jahr' to match folder structure.
// Usage: place this file on the server under the same relative path and open it via browser or CLI.
// SECURITY: Remove this file after running. No auth is implemented here.

header('Content-Type: text/plain; charset=utf-8');

$baseUploads = realpath(__DIR__ . '/../uploads');
if (!$baseUploads || !is_dir($baseUploads)) {
    echo "Uploads directory not found: {$baseUploads}\n";
    exit(1);
}

$fixed = 0; $checked = 0; $errors = 0;

$encodeUtf8 = function($value) use (&$encodeUtf8) {
    if (is_array($value)) {
        $out = [];
        foreach ($value as $k => $v) { $out[$k] = $encodeUtf8($v); }
        return $out;
    }
    if (is_string($value)) {
        if (function_exists('mb_detect_encoding') && function_exists('mb_convert_encoding')) {
            $enc = mb_detect_encoding($value, ['UTF-8','ISO-8859-1','Windows-1252'], true);
            if ($enc && $enc !== 'UTF-8') {
                return mb_convert_encoding($value, 'UTF-8', $enc);
            }
        }
    }
    return $value;
};

$years = array_filter(scandir($baseUploads), function($y) use ($baseUploads) {
    return $y !== '.' && $y !== '..' && is_dir($baseUploads . '/' . $y) && preg_match('/^\d{4}$/', $y);
});

foreach ($years as $year) {
    $yearPath = $baseUploads . '/' . $year;
    $galleries = array_filter(scandir($yearPath), function($g) use ($yearPath) {
        return $g !== '.' && $g !== '..' && is_dir($yearPath . '/' . $g);
    });
    foreach ($galleries as $galerie) {
        $checked++;
        $metaPath = $yearPath . '/' . $galerie . '/meta.json';
        if (!file_exists($metaPath)) continue;
        $content = file_get_contents($metaPath);
        if ($content === false) { $errors++; echo "Failed to read: $metaPath\n"; continue; }

        // Try decode as-is first
        $data = json_decode($content, true);
        if ($data === null) {
            // Attempt to convert whole file to UTF-8 and decode again
            if (function_exists('mb_detect_encoding') && function_exists('mb_convert_encoding')) {
                $enc = mb_detect_encoding($content, ['UTF-8','ISO-8859-1','Windows-1252'], true);
                if ($enc && $enc !== 'UTF-8') {
                    $contentUtf8 = mb_convert_encoding($content, 'UTF-8', $enc);
                    $data = json_decode($contentUtf8, true);
                }
            }
        }

        if (!is_array($data)) {
            $errors++;
            echo "Invalid JSON after attempts: $metaPath\n";
            continue;
        }

        // Normalize all strings to UTF-8
        $data = $encodeUtf8($data);

        // Enforce identity from folder structure
        $data['jahr'] = (string)$year;
        $data['galerie'] = (string)$galerie;

        // Write back pretty-printed UTF-8 JSON
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) { $errors++; echo "json_encode failed for: $metaPath\n"; continue; }

        if (file_put_contents($metaPath, $json) === false) { $errors++; echo "Failed to write: $metaPath\n"; continue; }
        $fixed++;
        echo "Fixed: $metaPath\n";
    }
}

echo "\nDone. Checked: $checked, Fixed: $fixed, Errors: $errors\n";
