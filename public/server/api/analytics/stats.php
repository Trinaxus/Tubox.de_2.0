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
$days = isset($_GET['days']) ? max(1, min(365, intval($_GET['days']))) : 30;
$end = new DateTime('today');
$start = (clone $end)->modify('-' . ($days - 1) . ' days');

$result = [
  'range' => [ 'from' => $start->format('Y-m-d'), 'to' => $end->format('Y-m-d') ],
  'kpis' => [ 'pageviews' => 0, 'visitors' => 0 ],
  'timeseries' => [],
  'topPaths' => [],
  'countries' => [],
  'browsers' => [],
  'referrers' => []
];

$byDay = [];
$paths = [];
$countries = [];
$browsers = [];
$referrers = [];
$visitors = [];

function parse_browser($ua) {
  if (stripos($ua, 'Edg') !== false) return 'Edge';
  if (stripos($ua, 'Chrome') !== false && stripos($ua, 'Chromium') === false) return 'Chrome';
  if (stripos($ua, 'Firefox') !== false) return 'Firefox';
  if (stripos($ua, 'Safari') !== false && stripos($ua, 'Chrome') === false) return 'Safari';
  if (stripos($ua, 'Chromium') !== false) return 'Chromium';
  return 'Other';
}

$period = new DatePeriod($start, new DateInterval('P1D'), (clone $end)->modify('+1 day'));
foreach ($period as $day) {
  $byDay[$day->format('Y-m-d')] = 0;
}

if (is_dir($dir)) {
  foreach ($period as $day) {
    $file = $dir . '/' . $day->format('Y-m-d') . '.jsonl';
    if (!file_exists($file)) continue;
    $fh = fopen($file, 'r');
    if (!$fh) continue;
    while (($line = fgets($fh)) !== false) {
      $j = json_decode($line, true);
      if (!is_array($j)) continue;
      $result['kpis']['pageviews']++;
      $dateKey = substr($j['ts'] ?? $day->format('Y-m-d'), 0, 10);
      if (isset($byDay[$dateKey])) $byDay[$dateKey]++;
      // visitors by uuid (anonym)
      if (!empty($j['uuid'])) $visitors[$j['uuid']] = true;
      // paths
      $p = $j['path'] ?? '/';
      $paths[$p] = ($paths[$p] ?? 0) + 1;
      // countries
      $c = $j['country'] ?? null;
      if ($c) $countries[$c] = ($countries[$c] ?? 0) + 1;
      // browsers
      $ua = $j['ua'] ?? '';
      $b = parse_browser($ua);
      $browsers[$b] = ($browsers[$b] ?? 0) + 1;
      // referrer (domain only)
      $r = $j['referrer'] ?? '';
      if ($r) {
        $host = parse_url($r, PHP_URL_HOST) ?: $r;
        $referrers[$host] = ($referrers[$host] ?? 0) + 1;
      }
    }
    fclose($fh);
  }
}

$result['kpis']['visitors'] = count($visitors);
$result['timeseries'] = array_map(function($k,$v){ return ['date'=>$k,'pv'=>$v]; }, array_keys($byDay), array_values($byDay));
arsort($paths); $result['topPaths'] = array_slice(array_map(function($k,$v){return ['path'=>$k,'count'=>$v];}, array_keys($paths), array_values($paths)),0,10);
arsort($countries); $result['countries'] = array_slice(array_map(function($k,$v){return ['country'=>$k,'count'=>$v];}, array_keys($countries), array_values($countries)),0,10);
arsort($browsers); $result['browsers'] = array_slice(array_map(function($k,$v){return ['browser'=>$k,'count'=>$v];}, array_keys($browsers), array_values($browsers)),0,10);
arsort($referrers); $result['referrers'] = array_slice(array_map(function($k,$v){return ['referrer'=>$k,'count'=>$v];}, array_keys($referrers), array_values($referrers)),0,10);

echo json_encode(['success'=>true,'data'=>$result]);
