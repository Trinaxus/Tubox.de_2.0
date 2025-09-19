<?php
require __DIR__ . '/common.php';
expect_token();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) err('Invalid JSON', 400);
$rel = isset($body['path']) ? $body['path'] : '';
$newName = isset($body['newName']) ? trim($body['newName']) : '';
if ($newName === '' || preg_match('/[\\\/:*?"<>|]/', $newName)) err('Invalid name', 400);
$src = join_root($rel);
if ($src === false || !file_exists($src)) err('Not found', 404);
$parent = dirname($src);
$dst = $parent . '/' . $newName;
if (file_exists($dst)) err('Target exists', 409);
if (!@rename($src, $dst)) err('Rename failed', 500);
@chmod($dst, is_dir($dst) ? 0775 : 0664);

$parentRel = clean_rel_path(dirname($rel));
$newRel = clean_rel_path(($parentRel ? $parentRel.'/' : '').$newName);
ok(['renamed'=>['from'=>$rel,'to'=>$newRel]]);
