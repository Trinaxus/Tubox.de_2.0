<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$file = __DIR__ . '/categories.json';
$defaults = [
  'categories' => [
    'BEST OF TRINAX',
    'LOSTPLACES',
    'VILLA - SOUNDLABOR',
    'LANDSCHAFT',
    'PORTRAIT',
    'URLAUB'
  ],
  'lastUpdated' => date('c'),
  'version' => '1.0'
];

if (!file_exists($file)) {
  echo json_encode(['success' => true, 'data' => $defaults]);
  exit;
}

try {
  $raw = file_get_contents($file);
  if ($raw === false) throw new Exception('read failed');
  $data = json_decode($raw, true);
  if (!is_array($data)) $data = $defaults;
  echo json_encode(['success' => true, 'data' => $data]);
} catch (Exception $e) {
  http_response_code(200);
  echo json_encode(['success' => true, 'data' => $defaults]);
}
