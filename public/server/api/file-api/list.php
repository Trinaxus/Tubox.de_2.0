<?php
require __DIR__ . '/common.php';
expect_token();

$rel = isset($_GET['path']) ? $_GET['path'] : '';
$full = join_root($rel);
if ($full === false) err('Invalid path', 400);
if (!is_dir($full)) err('Not a directory', 400);

$items = [];
$dir = opendir($full);
if ($dir !== false) {
  while (($e = readdir($dir)) !== false) {
    if ($e === '.' || $e === '..') continue;
    $fp = $full . '/' . $e;
    $isDir = is_dir($fp);
    $items[] = [
      'name' => $e,
      'type' => $isDir ? 'dir' : 'file',
      'size' => $isDir ? 0 : (filesize($fp) ?: 0),
      'mtime' => filemtime($fp) ?: time(),
      'path' => clean_rel_path(($rel ? ($rel . '/') : '') . $e),
      'url' => !$isDir ? (getenv('UPLOADS_BASE_URL') ?: '') . '/' . clean_rel_path(($rel ? ($rel . '/') : '') . rawurlencode($e)) : null,
    ];
  }
  closedir($dir);
}

usort($items, function($a,$b){
  if ($a['type'] !== $b['type']) return $a['type'] === 'dir' ? -1 : 1;
  return strcasecmp($a['name'],$b['name']);
});

ok([ 'path' => clean_rel_path($rel), 'items' => $items ]);
