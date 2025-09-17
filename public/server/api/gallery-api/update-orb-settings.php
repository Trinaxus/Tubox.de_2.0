<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// Very lightweight auth: optional token match if you need it
$expectedToken = getenv('API_TOKEN');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!is_array($data)) {
  http_response_code(400);
  echo json_encode([ 'success' => false, 'message' => 'Invalid JSON' ]);
  exit;
}

if ($expectedToken && isset($data['token']) && $data['token'] !== $expectedToken) {
  http_response_code(401);
  echo json_encode([ 'success' => false, 'message' => 'Unauthorized' ]);
  exit;
}

$settings = isset($data['settings']) && is_array($data['settings']) ? $data['settings'] : null;
if (!$settings) {
  http_response_code(400);
  echo json_encode([ 'success' => false, 'message' => 'Missing settings' ]);
  exit;
}

$settingsFile = __DIR__ . '/orb-settings.json';

try {
  $json = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  if ($json === false) throw new Exception('JSON encode failed');
  $ok = file_put_contents($settingsFile, $json);
  if ($ok === false) throw new Exception('Write failed');
  echo json_encode([ 'success' => true ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([ 'success' => false, 'message' => $e->getMessage() ]);
}
