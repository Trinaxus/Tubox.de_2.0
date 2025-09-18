<?php
require __DIR__ . '/common.php';
expect_token();

$rel = isset($_POST['path']) ? $_POST['path'] : '';
$full = join_root($rel);
if ($full === false || !is_dir($full)) err('Invalid path', 400);

$maxBytes = 50 * 1024 * 1024; // 50 MB
$allowedExt = ['jpg','jpeg','png','webp','svg','pdf','zip'];

if (!isset($_FILES['files'])) err('No files', 400);
$files = $_FILES['files'];
$names = is_array($files['name']) ? $files['name'] : [$files['name']];
$tmpNames = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];
$errors = is_array($files['error']) ? $files['error'] : [$files['error']];
$sizes = is_array($files['size']) ? $files['size'] : [$files['size']];

$result = [];
for ($i=0; $i<count($names); $i++) {
  $name = basename($names[$i]);
  $tmp = $tmpNames[$i];
  $err = $errors[$i];
  $size = intval($sizes[$i]);
  if ($err !== UPLOAD_ERR_OK) { $result[] = ['name'=>$name,'ok'=>false,'message'=>'Upload error']; continue; }
  if ($size > $maxBytes) { $result[] = ['name'=>$name,'ok'=>false,'message'=>'Too large']; continue; }
  $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if ($ext && !in_array($ext, $allowedExt, true)) { $result[] = ['name'=>$name,'ok'=>false,'message'=>'Type not allowed']; continue; }
  $dest = $full . '/' . $name;
  // Prevent overwrite
  if (file_exists($dest)) {
    $base = pathinfo($name, PATHINFO_FILENAME);
    $extDot = $ext ? ('.'.$ext) : '';
    $k=1; do { $alt = $full . '/' . $base . ' (' . $k . ')' . $extDot; $k++; } while (file_exists($alt));
    $dest = $alt;
  }
  if (!@move_uploaded_file($tmp, $dest)) { $result[] = ['name'=>$name,'ok'=>false,'message'=>'Save failed']; continue; }
  @chmod($dest, 0664);
  $result[] = ['name'=>basename($dest),'ok'=>true,'path'=>clean_rel_path(($rel?($rel.'/'):'').basename($dest))];
}

ok(['uploaded'=>$result]);
