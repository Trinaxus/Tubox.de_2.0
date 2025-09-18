<?php
require __DIR__ . '/common.php';
expect_token();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) err('Invalid JSON', 400);
$rel = isset($body['path']) ? $body['path'] : '';
$name = isset($body['name']) ? trim($body['name']) : '';
if ($name === '' || preg_match('/[\\\/:*?"<>|]/', $name)) err('Invalid folder name');
$fullParent = join_root($rel);
if ($fullParent === false || !is_dir($fullParent)) err('Invalid path', 400);
$target = $fullParent . '/' . $name;
if (file_exists($target)) err('Exists', 409);
if (!@mkdir($target, 0775, false)) err('Create failed', 500);
@chmod($target, 0775);
ok(['created'=>clean_rel_path(($rel?($rel.'/'):'').$name)]);
