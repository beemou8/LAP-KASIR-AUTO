<?php
/**
 * API Bridge / Proxy untuk Bot Laporan Kasir
 * Menghubungkan client web (baik dari PC Host maupun PC lain di jaringan LAN)
 * ke Node.js Puppeteer Bot di port 6767 via Apache (port 80).
 * Hal ini mengatasi kendala Firewall Windows dan CORS di jaringan LAN.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : 'status';
$botBase = 'http://127.0.0.1:6767';

// 1. CEK STATUS BOT
if ($action === 'status' || $action === 'ping') {
    $ch = curl_init($botBase . '/api/status');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 2,
        CURLOPT_CONNECTTIMEOUT => 1
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_errno($ch);
    curl_close($ch);

    if ($curlErr || $httpCode !== 200 || !$response) {
        echo json_encode([
            'online' => false,
            'running' => false,
            'step' => 0,
            'total' => 11,
            'message' => 'Bot belum aktif di PC Host. Harap jalankan start_bot.bat di PC Host.'
        ]);
        exit;
    }

    echo $response;
    exit;
}

// 2. PROSES PENARIKAN LAPORAN (POST)
if ($action === 'tarik') {
    ini_set('max_execution_time', '600');
    set_time_limit(600);

    // Ambil data payload (mendukung JSON body atau POST form)
    $rawInput = file_get_contents('php://input');
    $payloadData = [];
    if (!empty($rawInput)) {
        $decoded = json_decode($rawInput, true);
        if (is_array($decoded)) {
            $payloadData = $decoded;
        }
    }
    if (empty($payloadData)) {
        $payloadData = $_POST;
    }

    // Default tanggal jika kosong
    if (empty($payloadData['tanggal'])) {
        $payloadData['tanggal'] = isset($_GET['tanggal']) ? $_GET['tanggal'] : date('Y-m-d');
    }
    if (empty($payloadData['koneksi'])) {
        $payloadData['koneksi'] = 'SIMULASI';
    }

    $jsonPayload = json_encode($payloadData);

    $ch = curl_init($botBase . '/api/tarik');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $jsonPayload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($jsonPayload)
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 600,
        CURLOPT_CONNECTTIMEOUT => 5
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_errno($ch);
    $curlErrMsg = curl_error($ch);
    curl_close($ch);

    if ($curlErr || !$response) {
        http_response_code(503);
        echo json_encode([
            'status' => 'error',
            'message' => 'Gagal menghubungi Bot di PC Host (Port 6767). Pastikan jendela start_bot.bat di PC Host sedang aktif! (' . ($curlErrMsg ?: 'Connection Refused') . ')'
        ]);
        exit;
    }

    http_response_code($httpCode ?: 200);
    echo $response;
    exit;
}

// 3. BUKA FOLDER DI PC HOST
if ($action === 'open-folder') {
    $tanggal = isset($_GET['tanggal']) ? trim($_GET['tanggal']) : date('Y-m-d');
    
    // Coba via bot terlebih dahulu
    $ch = curl_init($botBase . '/api/open-folder?tanggal=' . urlencode($tanggal));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_CONNECTTIMEOUT => 1
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    if ($response) {
        echo $response;
        exit;
    }

    // Fallback lokal via explorer Windows
    $folder = __DIR__ . DIRECTORY_SEPARATOR . 'laporan' . DIRECTORY_SEPARATOR . $tanggal;
    if (!is_dir($folder)) {
        $folder = __DIR__ . DIRECTORY_SEPARATOR . 'laporan';
        if (!is_dir($folder)) {
            @mkdir($folder, 0777, true);
        }
    }
    @pclose(@popen("start \"\" explorer " . escapeshellarg($folder), "r"));

    echo json_encode([
        'status' => 'success',
        'message' => 'Membuka folder di PC Host: ' . $folder,
        'folder' => $folder
    ]);
    exit;
}

// Default response
echo json_encode([
    'status' => 'error',
    'message' => 'Aksi tidak dikenali. Gunakan action=status, action=tarik, atau action=open-folder.'
]);
