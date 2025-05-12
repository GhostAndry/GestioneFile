<?php
session_start();

// Redirect se non loggato o token assente
if (!isset($_SESSION['token']) || !isset($_GET['download_id'])) {
    header("Location: login.php");
    exit;
}

$token = $_SESSION['token'];
$download_id = $_GET['download_id'];
$api_url = "http://localhost:3001/files/shared/" . urlencode($download_id);

// Chiama backend per info file
$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token"
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$file = json_decode($response, true);
if ($httpcode !== 200 || !$file) {
    $error = "File non trovato o accesso negato.";
}

?>

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>File condiviso</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="./assets/css/style.css">
</head>
<body>
    <?php include "templates/navbar.php"; ?>
    <div class="container glassy-box">
        <h2>🔗 Condivisione file</h2>

        <?php if (isset($error)): ?>
            <p class="error"><?= htmlspecialchars($error) ?></p>
        <?php else: ?>
            <p><strong>📄 Nome originale:</strong> <?= htmlspecialchars($file['filename']) ?></p>
            <p><strong>📎 Download ID:</strong> <?= htmlspecialchars($download_id) ?></p>
            <p><strong>💾 Dimensione:</strong> <?= round($file['size'] / 1024 / 1024, 2) ?> MB</p>
            <p><strong>📅 Caricato il:</strong> <?= htmlspecialchars(date("d/m/Y H:i", strtotime($file['uploaded_at']))) ?></p>

            <a class="btn" href="http://localhost:3001/files/shared/<?= urlencode($download_id) ?>">⬇️ Scarica file</a>
        <?php endif; ?>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js"></script>
</body>
</html>
