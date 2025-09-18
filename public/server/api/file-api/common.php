<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$ROOT = realpath(__DIR__ . '/../../uploads');
if ($ROOT === false) {
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>'Uploads root not found']);
  exit;
}

function expect_token() {
  $expected = getenv('API_TOKEN');
  if (!$expected) return true; // no token configured
  $hdr = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
  $token = null;
  if (preg_match('/Bearer\s+(.*)$/i', $hdr, $m)) { $token = trim($m[1]); }
  if (!$token && isset($_POST['token'])) $token = $_POST['token'];
  if (!$token) {
    $raw = file_get_contents('php://input');
    $j = json_decode($raw, true);
    if (is_array($j) && isset($j['token'])) $token = $j['token'];
  }
  if ($token !== $expected) {
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Unauthorized']);
    exit;
  }
  return true;
}

function clean_rel_path($p) {
  $p = str_replace('\\','/',$p);
  $p = ltrim($p,'/');
  $parts = [];
  foreach (explode('/', $p) as $seg) {
    if ($seg === '' || $seg === '.') continue;
    if ($seg === '..') { array_pop($parts); continue; }
    $parts[] = $seg;
  }
  return implode('/', $parts);
}

function join_root($rel) {
  global $ROOT;
  $rel = clean_rel_path($rel);
  $candidate = rtrim($ROOT . '/' . $rel, '/');
  // If the candidate exists, resolve it; else keep as constructed for mkdir targets
  $full = file_exists($candidate) ? realpath($candidate) : $candidate;
  $realRoot = realpath($ROOT);
  // Normalize and ensure $full is inside $realRoot
  $normalizedFull = $full;
  if (file_exists($candidate)) { $normalizedFull = realpath($candidate); }
  if ($normalizedFull === false) { $normalizedFull = $candidate; }
  // Ensure both have trailing slash for prefix check
  $normRoot = rtrim($realRoot, '/') . '/';
  $normFull = rtrim($normalizedFull, '/') . '/';
  if (strpos($normFull, $normRoot) !== 0) {
    return false;
  }
  return $full;
}

function ok($data){ echo json_encode(['success'=>true,'data'=>$data]); exit; }
function err($msg,$code=400){ http_response_code($code); echo json_encode(['success'=>false,'message'=>$msg]); exit; }
