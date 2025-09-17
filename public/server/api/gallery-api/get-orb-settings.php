<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// Path to settings file (adjust on real server)
$settingsFile = __DIR__ . '/orb-settings.json';

$defaults = [
  'enabled' => true,
  'url' => 'https://tubox.de/TUBOX/server/uploads/2000/TOOLS/twisted-fold-v5_1024x1024-1-1.png?v=2025-09-15%2021%3A24%3A51',
  'sizePx' => 1600,
  'speedSec' => 200,
  'opacity' => 0.35,
  'blend' => 'screen',
  'blurPx' => 0,
  'hueDeg' => 0,
  'saturatePct' => 100,
  'contrastPct' => 100,
  'brightnessPct' => 100,
  'grayscale' => false,
  'sepia' => false,
  'tintColor' => '#ff3b30',
  'tintOpacity' => 0,
  'tintBlend' => 'soft-light',
  'enableOn' => [ 'index' => true, 'gallery' => true, 'blog' => true, 'blogPost' => true, 'admin' => true ],
];

if (!file_exists($settingsFile)) {
  echo json_encode([ 'success' => true, 'data' => $defaults ]);
  exit;
}

try {
  $raw = file_get_contents($settingsFile);
  if ($raw === false) throw new Exception('Cannot read file');
  $data = json_decode($raw, true);
  if (!is_array($data)) $data = $defaults;
  echo json_encode([ 'success' => true, 'data' => $data ]);
} catch (Exception $e) {
  http_response_code(200);
  echo json_encode([ 'success' => true, 'data' => $defaults ]);
}
