<?php
require 'db.php';
$note = $_POST['note'] ?? '';
$pdo->exec("INSERT INTO note (id, content) VALUES (1, " . $pdo->quote($note) . ")
            ON DUPLICATE KEY UPDATE content = " . $pdo->quote($note));
echo 'ok';
