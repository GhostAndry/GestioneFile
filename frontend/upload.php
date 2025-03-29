<?php
session_start();

if (!isset($_SESSION["token"])) {
    header("Location: login.php");
    exit;
}

$uploadResponse = null;

if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_FILES["files"])) {
    $token = $_SESSION["token"];
    $files = $_FILES["files"];

    $responses = [];

    for ($i = 0; $i < count($files["name"]); $i++) {
        if ($files["error"][$i] === UPLOAD_ERR_OK) {
            $filePath = $files["tmp_name"][$i];
            $fileName = $files["name"][$i];

            $curlFile = new CURLFile($filePath, mime_content_type($filePath), $fileName);

            $ch = curl_init("http://backend:3001/files/upload");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, ["file" => $curlFile]);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer $token"
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $responses[] = [
                "filename" => $fileName,
                "status" => $httpCode,
                "response" => json_decode($response, true)
            ];
        }
    }

    $uploadResponse = $responses;
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
    <h2 class="mb-4 text-center">Carica i tuoi file</h2>

    <form method="post" enctype="multipart/form-data">
        <div class="mb-3">
            <label for="fileInput" class="form-label">Seleziona uno o più file:</label>
            <input class="form-control" type="file" name="files[]" id="fileInput" multiple required>
        </div>
        <button type="submit" class="btn btn-success main-btn">Upload</button>
    </form>

    <?php if ($uploadResponse): ?>
        <div class="mt-4">
            <h5>Risultati:</h5>
            <ul class="list-group">
                <?php foreach ($uploadResponse as $res): ?>
                    <li class="list-group-item">
                        <strong><?= htmlspecialchars($res["filename"]) ?></strong> → 
                        <?= $res["status"] === 200 ? "✅ Caricato" : "❌ Errore: " . htmlspecialchars($res["response"]["error"] ?? "sconosciuto") ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>
</div>

</body>
</html>
