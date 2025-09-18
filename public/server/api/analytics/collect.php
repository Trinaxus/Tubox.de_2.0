<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
  exit;
}

// Respect DoNotTrack if provided
if (isset($payload['dnt']) && $payload['dnt']) {
  echo json_encode(['success' => true, 'skipped' => true]);
  exit;
}

// Extract basic fields
$evt = [
  'ts' => $payload['ts'] ?? date('c'),
  'type' => $payload['type'] ?? 'pageview',
  'path' => $payload['path'] ?? '/',
  'referrer' => $payload['referrer'] ?? '',
  'ua' => $payload['ua'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? ''),
  'lang' => $payload['lang'] ?? '',
  'screen' => $payload['screen'] ?? '',
  'dpr' => $payload['dpr'] ?? 1,
  'uuid' => $payload['uuid'] ?? null,
  'tz' => $payload['tz'] ?? null,
];

// IP anonymization
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if (strpos($ip, ':') !== false) {
  // IPv6: keep first 4 hextets
  $parts = explode(':', $ip);
  $parts = array_pad($parts, 8, '0');
  $ip_anon = $parts[0] . ':' . $parts[1] . ':' . $parts[2] . ':' . $parts[3] . '::';
} else {
  // IPv4: keep first 2 octets
  $oct = explode('.', $ip);
  $ip_anon = count($oct) >= 2 ? ($oct[0] . '.' . $oct[1] . '.0.0') : $ip;
}
$evt['ip'] = $ip_anon;

// Geo (country) via ip-api.com (no auth). If blocked, ignore.
$country = null;
try {
  $ctx = stream_context_create(['http' => ['timeout' => 1.0]]);
  $geo = @file_get_contents('http://ip-api.com/json/' . urlencode($ip) . '?fields=status,countryCode', false, $ctx);
  if ($geo !== false) {
    $gj = json_decode($geo, true);
    if (($gj['status'] ?? '') === 'success') {
      $country = $gj['countryCode'] ?? null;
    }
  }
} catch (Exception $e) {}
$evt['country'] = $country;

// Store as JSON line per day
$dir = __DIR__ . '/logs';
if (!is_dir($dir)) {
  @mkdir($dir, 0775, true);
}
$file = $dir . '/' . date('Y-m-d') . '.jsonl';
$line = json_encode($evt, JSON_UNESCAPED_SLASHES) . "\n";
$ok = @file_put_contents($file, $line, FILE_APPEND | LOCK_EX);
if ($ok === false) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Write failed']);
  exit;
}
@chmod($file, 0664);

echo json_encode(['success' => true]);
