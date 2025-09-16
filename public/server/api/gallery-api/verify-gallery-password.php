<?php
header('Content-Type: application/json; charset=utf-8');
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
  // Accept JSON or form-encoded
  $raw = file_get_contents('php://input');
  $data = [];
  if ($raw) {
    $json = json_decode($raw, true);
    if (is_array($json)) { $data = $json; }
  }
  if (empty($data)) { $data = $_POST; }

  $year = $data['year'] ?? '';
  $gallery = $data['gallery'] ?? '';
  $password = $data['password'] ?? '';

  if (!$year || !$gallery) {
    throw new Exception('Year and gallery are required');
  }

  // Resolve uploads dir (two levels up from api/gallery-api)
  $uploadsDir = realpath(__DIR__ . '/../../uploads');
  if (!$uploadsDir || !is_dir($uploadsDir)) {
    throw new Exception('Uploads directory not found');
  }

  $galleryDecoded = urldecode($gallery);
  $galleryDir = $uploadsDir . DIRECTORY_SEPARATOR . $year . DIRECTORY_SEPARATOR . $galleryDecoded;
  if (!is_dir($galleryDir)) {
    // fallback to raw string
    $galleryDir = $uploadsDir . DIRECTORY_SEPARATOR . $year . DIRECTORY_SEPARATOR . $gallery;
  }
  if (!is_dir($galleryDir)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Gallery not found']);
    exit();
  }

  $metaFile = $galleryDir . DIRECTORY_SEPARATOR . 'meta.json';
  if (!file_exists($metaFile)) {
    // If no meta exists, treat as public (no password)
    echo json_encode(['success' => true, 'requiresPassword' => false]);
    exit();
  }

  $metaContent = file_get_contents($metaFile);
  $meta = json_decode($metaContent, true);
  if (!is_array($meta)) { $meta = []; }

  $accessType = $meta['accessType'] ?? ($meta['zugriff'] ?? 'public');
  $expectedPassword = $meta['password'] ?? ($meta['passwort'] ?? '');

  if ($accessType !== 'password') {
    echo json_encode(['success' => true, 'requiresPassword' => false]);
    exit();
  }

  if (!$password) {
    echo json_encode(['success' => false, 'requiresPassword' => true, 'message' => 'Password required']);
    exit();
  }

  if (hash_equals((string)$expectedPassword, (string)$password)) {
    echo json_encode(['success' => true, 'requiresPassword' => true, 'valid' => true]);
  } else {
    http_response_code(401);
    echo json_encode(['success' => false, 'requiresPassword' => true, 'valid' => false, 'message' => 'Invalid password']);
  }

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
