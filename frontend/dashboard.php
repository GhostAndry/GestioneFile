<?php
session_start();

if (!isset($_SESSION["token"])) {
    header("Location: login.php");
    exit;
}

$token = $_SESSION["token"];

$ch = curl_init("http://backend:3001/files/list");
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
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($files as $file): ?>
                        <tr id="row-<?= $file["download_id"] ?>">
                            <td><?= htmlspecialchars($file["original_name"]) ?></td>
                            <td><?= round($file["size"] / 1024, 2) ?> KB</td>
                            <td>
                                <a class="btn btn-sm btn-success"
                                    href="http://localhost:3001/files/download/<?= $file["download_id"] ?>"
                                    target="_blank">Scarica</a>

                                <button class="btn btn-sm btn-warning"
                                    onclick="renameFile('<?= $file["download_id"] ?>')">Rinomina
                                </button>

                                <button class="btn btn-sm btn-danger"
                                    onclick="deleteFile('<?= $file["download_id"] ?>')">Elimina
                                </button>

                                <button class="btn btn-sm btn-info share-btn"
                                    data-download-id="<?= $file['download_id'] ?>"
                                    data-original-name="<?= htmlspecialchars($file['original_name']) ?>">
                                    🔗 Condividi
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <div id="shareModal" class="modal" style="display:none;">
        <div class="modal-content">
            <span id="closeModal" style="float:right;cursor:pointer;">&times;</span>
            <h3>Condividi file: <span id="modalFilename"></span></h3>

            <label>
                <input type="checkbox" id="isShared"> Condividi file
            </label><br>

            <label>Tipo condivisione:</label>
            <select id="sharedMode">
                <option value="">-- Seleziona --</option>
                <option value="public">Pubblica (chiunque col link)</option>
                <!-- <option value="private">Privata (solo utenti specifici)</option> -->
            </select><br>

            <!-- <label>Utenti autorizzati (solo per privata):</label>
            <input type="text" id="sharedWith" placeholder="ID utente separati da virgola"><br> -->

            <button id="saveShare">💾 Salva</button>
            <p id="shareLink" style="margin-top: 10px;"></p>
        </div>
    </div>

    <script>
        const token = <?= json_encode($_SESSION["token"]) ?>;

        function deleteFile(downloadId) {
            if (!confirm("Sei sicuro di voler eliminare questo file?")) return;

            fetch(`http://localhost:3001/files/delete/${downloadId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }).then(res => {
                if (res.ok) document.getElementById(`row-${downloadId}`).remove();
                else alert("Errore durante l'eliminazione del file");
            });
        }

        function renameFile(downloadId) {
            const newName = prompt("Inserisci il nuovo nome del file:");
            if (!newName) return;

            fetch(`http://localhost:3001/files/rename/${downloadId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    newName
                })
            }).then(res => {
                if (res.ok) location.reload();
                else alert("Errore durante la rinomina del file");
            });
        }

        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.downloadId;
                const name = btn.dataset.originalName;

                document.getElementById('modalFilename').innerText = name;
                document.getElementById('shareModal').style.display = 'flex';
                document.getElementById('saveShare').dataset.id = id;
                document.getElementById('shareLink').innerHTML = '';
            });
        });

        document.getElementById('closeModal').onclick = () => {
            document.getElementById('shareModal').style.display = 'none';
        };

        document.getElementById('saveShare').onclick = async () => {
            const id = document.getElementById('saveShare').dataset.id;
            const isShared = document.getElementById('isShared').checked;
            // const isShared = true;
            const mode = document.getElementById('sharedMode').value;
            // const sharedWith = document.getElementById('sharedWith').value
            //     .split(',').map(s => s.trim()).filter(Boolean);
            const sharedWith = Array(0);

            const res = await fetch(`http://localhost:3001/files/${id}/share`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    is_shared: isShared,
                    shared_mode: mode || null,
                    shared_with: mode === 'private' ? sharedWith : null
                })
            });

            const result = await res.json();

            if (res.ok) {
                const shareUrl = `${window.location.origin}/api/files/shared/${id}`;
                document.getElementById('shareLink').innerHTML = `
            ✅ Condivisione aggiornata!<br>
            <input type="text" readonly value="${shareUrl}" onclick="this.select()">
        `;
            } else {
                document.getElementById('shareLink').innerText = "❌ Errore: " + (result?.error || 'Sconosciuto');
            }
        };
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js"></script>
</body>

</html>