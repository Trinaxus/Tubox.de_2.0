<?php
require __DIR__ . '/common.php';
expect_token();

$suppress = @set_time_limit(0);
@ini_set('max_input_time', '-1');
@ini_set('memory_limit', '-1');
// Note: upload_max_filesize/post_max_size may not be changeable at runtime, but we try:
@ini_set('upload_max_filesize', '5G');
@ini_set('post_max_size', '5G');

$rel = isset($_POST['path']) ? $_POST['path'] : '';
$full = join_root($rel);
if ($full === false || !is_dir($full)) err('Invalid path', 400);

$maxBytes = 5 * 1024 * 1024 * 1024; // 5 GB

// Accept both 'files' (array) and 'file' (single)
if (isset($_FILES['files'])) {
  $files = $_FILES['files'];
  $names = is_array($files['name']) ? $files['name'] : [$files['name']];
  $tmpNames = is_array($files['tmp_name']) ? $files['tmp_name'] : [$files['tmp_name']];
  $errors = is_array($files['error']) ? $files['error'] : [$files['error']];
  $sizes = is_array($files['size']) ? $files['size'] : [$files['size']];
} elseif (isset($_FILES['file'])) {
  $files = $_FILES['file'];
  $names = [$files['name']];
  $tmpNames = [$files['tmp_name']];
  $errors = [$files['error']];
  $sizes = [$files['size']];
} else {
  err('No files', 400);
}

$result = [];
for ($i=0; $i<count($names); $i++) {
  $name = basename($names[$i] ?? '');
  $tmp = $tmpNames[$i] ?? '';
  $err = $errors[$i] ?? UPLOAD_ERR_NO_FILE;
  $size = intval($sizes[$i] ?? 0);
  if ($err !== UPLOAD_ERR_OK) {
    $msg = 'Upload error';
    if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) $msg = 'Too large (server limit)';
    if ($err === UPLOAD_ERR_NO_FILE) $msg = 'No file received';
    $result[] = ['name'=>$name,'ok'=>false,'message'=>$msg,'code'=>$err];
    continue;
  }
  if ($size > $maxBytes) { $result[] = ['name'=>$name,'ok'=>false,'message'=>'Too large (5GB limit)']; continue; }
  $dest = $full . '/' . $name;
  // Prevent overwrite
  if (file_exists($dest)) {
    $base = pathinfo($name, PATHINFO_FILENAME);
    $ext = pathinfo($name, PATHINFO_EXTENSION);
    $extDot = $ext !== '' ? ('.'.$ext) : '';
    $k=1; do { $alt = $full . '/' . $base . ' (' . $k . ')' . $extDot; $k++; } while (file_exists($alt));
    $dest = $alt;
  }
  if (!@move_uploaded_file($tmp, $dest)) {
    $errLast = error_get_last();
    $result[] = ['name'=>$name,'ok'=>false,'message'=>'Save failed','detail'=>$errLast ? ($errLast['message'] ?? '') : ''];
    continue;
  }
  @chmod($dest, 0664);
  $result[] = ['name'=>basename($dest),'ok'=>true,'path'=>clean_rel_path(($rel?($rel.'/'):'').basename($dest))];
}

ok(['uploaded'=>$result]);
