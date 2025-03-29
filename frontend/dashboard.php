<?php
session_start();

if (!isset($_SESSION["token"])) {
    header("Location: login.php");
    exit;
}

$token = $_SESSION["token"];

// 🔄 Recupero lista file dal backend
$ch = curl_init("http://backend:3001/files/list"); // <-- Host corretto: "backend"
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token"
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$files = [];
if ($status === 200) {
    $files = json_decode($response, true);
} else {
    $error = "Errore nel recupero dei file (Codice $status).";
}
?>

<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <title>Dashboard - MiniUpload</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>

<body>

    <?php include "templates/navbar.php"; ?>

    <div class="container page-wrapper mt-5">
        <h2 class="mb-4 text-center">I tuoi file</h2>

        <?php if (isset($error)): ?>
            <div class="alert alert-danger text-center"><?= htmlspecialchars($error) ?></div>
        <?php elseif (empty($files)): ?>
            <div class="alert alert-info text-center">Non hai ancora caricato file.</div>
        <?php else: ?>
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Nome file</th>
                        <th>Dimensione</th>
                        <th>Download</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($files as $file): ?>
                        <tr>
                            <td><?= htmlspecialchars($file["original_name"]) ?></td>
                            <td><?= round($file["size"] / 1024, 2) ?> KB</td>
                            <td>
                                <a class="btn btn-sm btn-primary main-btn"
                                    href="http://localhost:3001/files/download/<?= $file["download_id"] ?>"
                                    target="_blank">Scarica</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

</body>

</html>