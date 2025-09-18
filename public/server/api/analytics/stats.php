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
  'kpis' => [ 'pageviews' => 0, 'visitors' => 0, 'onlineNow' => 0 ],
  'timeseries' => [],
  'topPaths' => [],
  'entryPaths' => [],
  'countries' => [],
  'browsers' => [],
  'referrers' => [],
  'devices' => [],
  'utmSources' => [],
  'utmMediums' => [],
  'utmCampaigns' => []
];

$byDay = [];
$paths = [];
$entryPaths = [];
$countries = [];
$browsers = [];
$referrers = [];
$devices = [];
$utmSources = [];
$utmMediums = [];
$utmCampaigns = [];
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
      // Always increase timeseries per-day bucket for any event type so days with data are visible
      $dateKey = substr($j['ts'] ?? $day->format('Y-m-d'), 0, 10);
      if (isset($byDay[$dateKey])) $byDay[$dateKey]++;
      // Only aggregate metrics/KPIs for pageviews
      if (($j['type'] ?? '') !== 'pageview') continue;
      $result['kpis']['pageviews']++;
      // visitors by uuid (anonym)
      if (!empty($j['uuid'])) $visitors[$j['uuid']] = true;
      // paths
      $p = $j['path'] ?? '/';
      $paths[$p] = ($paths[$p] ?? 0) + 1;
      // entry paths
      if (isset($j['data']) && is_array($j['data']) && !empty($j['data']['entry'])) {
        $entryPaths[$p] = ($entryPaths[$p] ?? 0) + 1;
      }
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
      // device
      $dv = $j['device'] ?? null;
      if ($dv) $devices[$dv] = ($devices[$dv] ?? 0) + 1;
      // utm
      if (isset($j['utm']) && is_array($j['utm'])) {
        $us = $j['utm']['source'] ?? null; if ($us) $utmSources[$us] = ($utmSources[$us] ?? 0) + 1;
        $um = $j['utm']['medium'] ?? null; if ($um) $utmMediums[$um] = ($utmMediums[$um] ?? 0) + 1;
        $uc = $j['utm']['campaign'] ?? null; if ($uc) $utmCampaigns[$uc] = ($utmCampaigns[$uc] ?? 0) + 1;
      }
    }
    fclose($fh);
  }
}

$result['kpis']['visitors'] = count($visitors);
$result['timeseries'] = array_map(function($k,$v){ return ['date'=>$k,'pv'=>$v]; }, array_keys($byDay), array_values($byDay));
arsort($paths); $result['topPaths'] = array_slice(array_map(function($k,$v){return ['path'=>$k,'count'=>$v];}, array_keys($paths), array_values($paths)),0,10);
arsort($entryPaths); $result['entryPaths'] = array_slice(array_map(function($k,$v){return ['path'=>$k,'count'=>$v];}, array_keys($entryPaths), array_values($entryPaths)),0,10);
arsort($countries); $result['countries'] = array_slice(array_map(function($k,$v){return ['country'=>$k,'count'=>$v];}, array_keys($countries), array_values($countries)),0,10);
arsort($browsers); $result['browsers'] = array_slice(array_map(function($k,$v){return ['browser'=>$k,'count'=>$v];}, array_keys($browsers), array_values($browsers)),0,10);
arsort($referrers); $result['referrers'] = array_slice(array_map(function($k,$v){return ['referrer'=>$k,'count'=>$v];}, array_keys($referrers), array_values($referrers)),0,10);
arsort($devices); $result['devices'] = array_slice(array_map(function($k,$v){return ['device'=>$k,'count'=>$v];}, array_keys($devices), array_values($devices)),0,10);
arsort($utmSources); $result['utmSources'] = array_slice(array_map(function($k,$v){return ['source'=>$k,'count'=>$v];}, array_keys($utmSources), array_values($utmSources)),0,10);
arsort($utmMediums); $result['utmMediums'] = array_slice(array_map(function($k,$v){return ['medium'=>$k,'count'=>$v];}, array_keys($utmMediums), array_values($utmMediums)),0,10);
arsort($utmCampaigns); $result['utmCampaigns'] = array_slice(array_map(function($k,$v){return ['campaign'=>$k,'count'=>$v];}, array_keys($utmCampaigns), array_values($utmCampaigns)),0,10);

// Online now: read active.json (heartbeats within last 5 minutes) from logs/
$activeFile = __DIR__ . '/logs/active.json';
if (file_exists($activeFile)) {
  $raw = @file_get_contents($activeFile);
  if ($raw !== false) {
    $act = json_decode($raw, true);
    if (is_array($act)) {
      $now = time();
      $ttl = 300; // 5 minutes
      $count = 0;
      foreach ($act as $uuid => $ts) {
        if (is_numeric($ts) && ($now - intval($ts)) <= $ttl) $count++;
      }
      $result['kpis']['onlineNow'] = $count;
    }
  }
}

echo json_encode(['success'=>true,'data'=>$result]);
