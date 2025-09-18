<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$dir = __DIR__ . '/logs';
$today = date('Y-m-d');
$file = $dir . '/' . $today . '.jsonl';
$activeFile = $dir . '/active.json';

$resp = [
  'paths' => [ 'logsDir' => $dir, 'todayFile' => $file, 'activeFile' => $activeFile ],
  'exists' => [ 'logsDir' => is_dir($dir), 'todayFile' => file_exists($file), 'activeFile' => file_exists($activeFile) ],
  'writable' => [ 'logsDir' => is_dir($dir) ? is_writable($dir) : false ],
  'today' => [ 'count' => 0, 'lastLines' => [] ],
  'active' => [ 'count' => 0, 'uuids' => [] ],
];

// Count today's events and tail a few lines
if (file_exists($file)) {
  $cnt = 0;
  $lines = [];
  $fh = fopen($file, 'r');
  if ($fh) {
    while (($line = fgets($fh)) !== false) {
      $cnt++;
      if (count($lines) >= 5) { array_shift($lines); }
      $lines[] = trim($line);
    }
    fclose($fh);
  }
  $resp['today']['count'] = $cnt;
  $resp['today']['lastLines'] = $lines;
}

// Active heartbeats within last 5 minutes
if (file_exists($activeFile)) {
  $raw = @file_get_contents($activeFile);
  if ($raw !== false) {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
      $now = time();
      $ttl = 300;
      $count = 0; $uu = [];
      foreach ($decoded as $uuid => $ts) {
        if (is_numeric($ts) && ($now - intval($ts)) <= $ttl) { $count++; $uu[] = $uuid; }
      }
      $resp['active']['count'] = $count;
      $resp['active']['uuids'] = $uu;
    }
  }
}

echo json_encode(['success' => true, 'data' => $resp]);
