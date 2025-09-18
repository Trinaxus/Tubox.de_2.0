<?php
header('Content-Type: application/json');
// Dynamic CORS: reflect Origin to support credentials
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
if ($origin !== '*') {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
  header('Access-Control-Allow-Credentials: true');
} else {
  header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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
  'device' => $payload['device'] ?? null,
  'utm' => isset($payload['utm']) && is_array($payload['utm']) ? $payload['utm'] : null,
];

// Server-side device fallback from UA if not provided
if (empty($evt['device'])) {
  $ua = $evt['ua'] ?? '';
  $isIpad = stripos($ua, 'iPad') !== false;
  $isAndroidTablet = (stripos($ua, 'Android') !== false && stripos($ua, 'Mobile') === false);
  $isTablet = $isIpad || $isAndroidTablet || stripos($ua, 'Tablet') !== false;
  $isMobile = (stripos($ua, 'Mobi') !== false || stripos($ua, 'Android') !== false) && !$isTablet;
  $evt['device'] = $isMobile ? 'mobile' : ($isTablet ? 'tablet' : 'desktop');
}

// Early exit: skip admin pageviews entirely from logs
if (($evt['type'] ?? '') === 'pageview' && isset($evt['path']) && strpos($evt['path'], '/admin') === 0) {
  echo json_encode(['success' => true, 'skipped' => true]);
  exit;
}

// Early bot filter: common crawler keywords
$uaLC = strtolower($evt['ua'] ?? '');
$isBot = preg_match('/bot|spider|crawler|httpclient|headless|uptime|monitor|seo|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget/i', $uaLC) === 1;
if ($isBot) {
  echo json_encode(['success' => true, 'skipped' => true]);
  exit;
}

// Heartbeat handling for "online now" (store under logs/ to ensure write perms)
if (($evt['type'] ?? '') === 'heartbeat' && !empty($evt['uuid'])) {
  $logDir = __DIR__ . '/logs';
  if (!is_dir($logDir)) { @mkdir($logDir, 0775, true); }
  $activeFile = $logDir . '/active.json';
  $active = [];
  if (file_exists($activeFile)) {
    $raw = @file_get_contents($activeFile);
    if ($raw !== false) {
      $decoded = json_decode($raw, true);
      if (is_array($decoded)) $active = $decoded;
    }
  }
  // prune old entries (older than 5 minutes)
  $now = time();
  foreach ($active as $uid => $ts) {
    if (!is_numeric($ts) || ($now - intval($ts)) > 300) unset($active[$uid]);
  }
  $active[$evt['uuid']] = $now;
  @file_put_contents($activeFile, json_encode($active, JSON_UNESCAPED_SLASHES));
  @chmod($activeFile, 0664);
  echo json_encode(['success' => true]);
  exit;
}

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
  $geo = @file_get_contents('https://ip-api.com/json/' . urlencode($ip) . '?fields=status,countryCode', false, $ctx);
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
