<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
  exit;
}

// Optional token protection
$expectedToken = getenv('API_TOKEN');
if ($expectedToken && (!isset($data['token']) || $data['token'] !== $expectedToken)) {
  http_response_code(401);
  echo json_encode(['success' => false, 'message' => 'Unauthorized']);
  exit;
}

$categories = isset($data['categories']) && is_array($data['categories']) ? array_values($data['categories']) : null;
if (!$categories) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Missing categories']);
  exit;
}

$payload = [
  'categories' => $categories,
  'lastUpdated' => isset($data['lastUpdated']) ? $data['lastUpdated'] : date('c'),
  'version' => isset($data['version']) ? $data['version'] : '1.0'
];

$file = __DIR__ . '/categories.json';

try {
  $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  if ($json === false) throw new Exception('JSON encode failed');

  // Ensure directory exists and is writable
  $dir = dirname($file);
  if (!is_dir($dir)) {
    if (!mkdir($dir, 0775, true)) {
      throw new Exception('Failed to create directory: ' . $dir);
    }
  }
  if (!is_writable($dir)) {
    // Try to adjust permissions (may fail on some hosts)
    @chmod($dir, 0775);
  }

  $ok = @file_put_contents($file, $json);
  if ($ok === false) {
    throw new Exception('Failed to write categories file');
  }
  // Try to set readable perms
  @chmod($file, 0664);

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>