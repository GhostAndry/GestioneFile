<?php
session_start();

// ⚠️ Check se utente loggato
if (!isset($_SESSION["token"])) {
    header("Location: login.php");
    exit;
}

$token = $_SESSION["token"];
$uploadResponse = [];

if ($_SERVER["REQUEST_METHOD"] === "POST" && !empty($_FILES["files"])) {
    foreach ($_FILES["files"]["tmp_name"] as $index => $tmpFile) {
        $filename = $_FILES["files"]["name"][$index];
        $filetype = $_FILES["files"]["type"][$index];
        $filesize = $_FILES["files"]["size"][$index];

        if (!is_uploaded_file($tmpFile)) {
            $uploadResponse[] = [
                "filename" => $filename,
                "status" => 400,
                "response" => ["error" => "Upload fallito"]
            ];
            continue;
        }

        // Invia file al backend
        $ch = curl_init("http://miniupload-backend:3001/files/upload");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);

        $cfile = new CURLFile($tmpFile, $filetype, $filename);

        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $token"
        ]);

        curl_setopt($ch, CURLOPT_POSTFIELDS, [
            "file" => $cfile
        ]);

        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $uploadResponse[] = [
            "filename" => $filename,
            "status" => $status,
            "response" => json_decode($response, true)
        ];
    }
}
?>

<!DOCTYPE html>
<html lang="it">

<head>
    <meta charset="UTF-8">
    <title>Upload - MiniUpload</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>

<body>

    <?php include "templates/navbar.php"; ?>

    <div class="container page-wrapper mt-5">
        <h2 class="mb-4 text-center">Upload file</h2>

        <form method="POST" enctype="multipart/form-data" class="form-box mx-auto" style="max-width: 500px;">
            <div class="mb-3">
                <label for="file" class="form-label">Seleziona file (uno o più)</label>
                <input type="file" class="form-control" name="files[]" multiple required />
            </div>
            <button type="submit" class="btn btn-success w-100 main-btn">Carica</button>
        </form>

        <?php if (!empty($uploadResponse)): ?>
            <div class="mt-4">
                <h5>Risultati:</h5>
                <ul class="list-group">
                    <?php foreach ($uploadResponse as $res): ?>
                        <li class="list-group-item">
                            <strong><?= htmlspecialchars($res["filename"]) ?></strong> →
                            <?= $res["status"] === 200
                                ? "✅ Caricato"
                                : "❌ Errore: " . htmlspecialchars($res["response"]["error"] ?? "sconosciuto") ?>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
    </div>

</body>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js"></script>
</html>