<?php
session_start();
$isLogged = isset($_SESSION["token"]);
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>MiniUpload - Home</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>

<?php include "templates/navbar.php"; ?>

<div class="container page-wrapper mt-5 text-center">
    <h1 class="mb-4">Benvenuto su <strong>MiniUpload</strong></h1>
    <p class="lead">Effettua il login o registrati per caricare e gestire i tuoi file.</p>
    <div class="mt-4">
        <a href="login.php" class="btn btn-primary main-btn me-2">Login</a>
        <a href="register.php" class="btn btn-outline-primary main-btn">Registrati</a>
    </div>
</div>

</body>
</html>