<?php
header('Content-Type: application/json');
set_time_limit(300);

$tanggal = isset($_REQUEST['tanggal']) ? trim($_REQUEST['tanggal']) : date('Y-m-d');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Format tanggal tidak valid. Harus YYYY-MM-DD'
    ]);
    exit;
}

// 1. Coba hubungi Bot Express di Port 6767 terlebih dahulu
$botUrl = "http://localhost:6767/api/tarik?tanggal=" . urlencode($tanggal);
$ctx = stream_context_create([
    'http' => [
        'timeout' => 300,
        'method' => 'GET'
    ]
]);

$response = @file_get_contents($botUrl, false, $ctx);
if ($response !== false) {
    echo $response;
    exit;
}

// 2. Jika bot di port 6767 tidak aktif, fallback jalankan generate-pdf.js langsung via CLI
$scriptPath = __DIR__ . DIRECTORY_SEPARATOR . 'generate-pdf.js';
if (file_exists($scriptPath)) {
    $command = "node " . escapeshellarg($scriptPath) . " " . escapeshellarg($tanggal) . " 2>&1";
    $output = shell_exec($command);

    $result = null;
    $lines = explode("\n", trim($output));
    foreach (array_reverse($lines) as $line) {
        $line = trim($line);
        if (strpos($line, '{"status":') === 0) {
            $result = json_decode($line, true);
            break;
        }
    }

    if ($result && isset($result['status']) && $result['status'] === 'success') {
        echo json_encode($result);
        exit;
    }
}

echo json_encode([
    'status' => 'error',
    'message' => 'Bot di Port 6767 tidak aktif dan eksekusi lokal gagal. Pastikan jalankan start_bot.bat!'
]);

