<?php
header('Content-Type: application/json');

$configPath = __DIR__ . DIRECTORY_SEPARATOR . 'config.json';
if (file_exists($configPath) && filesize($configPath) > 0) {
    echo file_get_contents($configPath);
} else {
    echo json_encode([
        'ip' => '172.31.147.200',
        'username' => '',
        'password' => '',
        'koneksi' => 'sim',
        'cabang' => 'spibdg2t',
        'headless' => false
    ]);
}

