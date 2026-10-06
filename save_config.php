<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if ($data) {
        $configPath = __DIR__ . DIRECTORY_SEPARATOR . 'config.json';
        file_put_contents($configPath, json_encode($data, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success', 'message' => 'Pengaturan berhasil disimpan']);
        exit;
    }
}

echo json_encode(['status' => 'error', 'message' => 'Data tidak valid']);

