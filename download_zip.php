<?php
$tanggal = isset($_GET['tanggal']) ? trim($_GET['tanggal']) : date('Y-m-d');
$folder = __DIR__ . DIRECTORY_SEPARATOR . 'laporan' . DIRECTORY_SEPARATOR . $tanggal;

if (!is_dir($folder)) {
    die("Folder laporan untuk tanggal $tanggal belum ditemukan.");
}

$zipName = "Laporan_Kasir_" . $tanggal . ".zip";
$zipPath = __DIR__ . DIRECTORY_SEPARATOR . 'laporan' . DIRECTORY_SEPARATOR . $zipName;

$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
    // Ambil semua file PDF dan Excel di folder tanggal tersebut
    $files = glob($folder . DIRECTORY_SEPARATOR . '*.*');
    if (empty($files)) {
        die("Belum ada file laporan di folder ini.");
    }

    foreach ($files as $file) {
        $zip->addFile($file, basename($file));
    }
    $zip->close();

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipName . '"');
    header('Content-Length: ' . filesize($zipPath));
    header('Pragma: no-cache');
    header('Expires: 0');
    readfile($zipPath);
    exit;
} else {
    die("Gagal membuat arsip ZIP.");
}
