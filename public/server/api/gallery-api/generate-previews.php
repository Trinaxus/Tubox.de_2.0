<?php
// Maintenance script: Generate preview thumbnails for all existing galleries.
// Location: public/server/api/gallery-api/tools/generate-previews.php
// Output: Creates preview/<filename> next to the originals under uploads/<year>/<gallery>/
// Safety: Idempotent — skips if preview exists and is newer than source.
// Note: Requires GD extension. Remove this file after execution for security.

header('Content-Type: text/plain; charset=utf-8');
set_time_limit(0);

$uploads = realpath(__DIR__ . '/../../uploads');
if (!$uploads || !is_dir($uploads)) {
  echo "Uploads directory not found: " . (__DIR__ . '/../../uploads') . "\n";
  exit(1);
}

$maxLongEdge = 600; // extra speed: smaller previews
$jpegQuality = 70;

function makePreview(string $srcPath, string $dstPath, int $maxLongEdge, int $jpegQuality): bool {
  $ext = strtolower(pathinfo($srcPath, PATHINFO_EXTENSION));
  if (!in_array($ext, ['jpg','jpeg','png','gif','webp'])) return false;

  switch ($ext) {
    case 'jpg':
    case 'jpeg':
      $src = @imagecreatefromjpeg($srcPath); break;
    case 'png':
      $src = @imagecreatefrompng($srcPath); break;
    case 'gif':
      $src = @imagecreatefromgif($srcPath); break;
    case 'webp':
      $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($srcPath) : null; break;
    default:
      $src = null;
  }
  if (!$src) return false;

  $w = imagesx($src); $h = imagesy($src);
  $scale = ($w > $h) ? ($maxLongEdge / max(1,$w)) : ($maxLongEdge / max(1,$h));
  if ($scale > 1) { $scale = 1; }
  $nw = max(1, (int)round($w * $scale));
  $nh = max(1, (int)round($h * $scale));
  $dst = imagecreatetruecolor($nw, $nh);

  if (in_array($ext, ['png','gif'])) {
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
  }

  imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

  $ok = false;
  switch ($ext) {
    case 'jpg':
    case 'jpeg':
      $ok = @imagejpeg($dst, $dstPath, $jpegQuality); break;
    case 'png':
      $ok = @imagepng($dst, $dstPath, 6); break;
    case 'gif':
      $ok = @imagegif($dst, $dstPath); break;
    case 'webp':
      $ok = function_exists('imagewebp') ? @imagewebp($dst, $dstPath, $jpegQuality) : false; break;
  }

  imagedestroy($dst); imagedestroy($src);
  return (bool)$ok;
}

$years = array_filter(scandir($uploads), function($y) use ($uploads) {
  return $y !== '.' && $y !== '..' && is_dir($uploads . '/' . $y) && preg_match('/^\d{4}$/', $y);
});

$made = 0; $skipped = 0; $errors = 0; $checked = 0;
foreach ($years as $year) {
  $yearPath = $uploads . '/' . $year;
  $gals = array_filter(scandir($yearPath), function($g) use ($yearPath) {
    return $g !== '.' && $g !== '..' && is_dir($yearPath . '/' . $g);
  });
  foreach ($gals as $gal) {
    $galPath = $yearPath . '/' . $gal;
    $previewDir = $galPath . '/preview';
    if (!is_dir($previewDir)) @mkdir($previewDir, 0755, true);

    $files = array_filter(scandir($galPath), function($f) use ($galPath) {
      if ($f === '.' || $f === '..' || $f === 'preview' || $f === 'meta.json') return false;
      $p = $galPath . '/' . $f;
      return is_file($p) && preg_match('/\.(jpe?g|png|gif|webp)$/i', $f);
    });

    foreach ($files as $f) {
      $checked++;
      $src = $galPath . '/' . $f;
      $dst = $previewDir . '/' . $f;
      if (file_exists($dst)) {
        // Skip if preview is newer or same mtime
        if (@filemtime($dst) >= @filemtime($src)) { $skipped++; continue; }
      }
      if (makePreview($src, $dst, $maxLongEdge, $jpegQuality)) {
        $made++; echo "Made: $year/$gal/preview/$f\n";
      } else {
        $errors++; echo "Failed: $year/$gal/$f\n";
      }
    }
  }
}

echo "\nDone. Checked: $checked, Created: $made, Skipped: $skipped, Errors: $errors\n";
