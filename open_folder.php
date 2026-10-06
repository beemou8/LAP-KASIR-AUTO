<?php
header('Content-Type: application/json');

$tanggal = isset($_REQUEST['tanggal']) ? trim($_REQUEST['tanggal']) : date('Y-m-d');
$folder = __DIR__ . DIRECTORY_SEPARATOR . 'laporan' . DIRECTORY_SEPARATOR . $tanggal;

if (!is_dir($folder)) {
    $folder = __DIR__ . DIRECTORY_SEPARATOR . 'laporan';
    if (!is_dir($folder)) {
        mkdir($folder, 0777, true);
    }
}

pclose(popen("start \"\" explorer " . escapeshellarg($folder), "r"));

echo json_encode([
    'status' => 'success',
    'folder' => $folder
]);
