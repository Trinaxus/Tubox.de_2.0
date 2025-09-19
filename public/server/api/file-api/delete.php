<?php
require __DIR__ . '/common.php';
expect_token();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) err('Invalid JSON', 400);
$rel = isset($body['path']) ? $body['path'] : '';
$full = join_root($rel);
if ($full === false || !file_exists($full)) err('Not found', 404);

function rrmdir($dir) {
  $items = scandir($dir);
  if ($items === false) return false;
  foreach ($items as $it) {
    if ($it === '.' || $it === '..') continue;
    $p = $dir . '/' . $it;
    if (is_dir($p)) { if (!rrmdir($p)) return false; }
    else { if (!@unlink($p)) return false; }
  }
  return @rmdir($dir);
}

$ok = false;
if (is_dir($full)) {
  $ok = rrmdir($full);
} else {
  $ok = @unlink($full);
}
if (!$ok) err('Delete failed', 500);

ok(['deleted'=>$rel]);
