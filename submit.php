<?php
$host = 'localhost';
$db   = 'contacts_db';
$user = 'root';
$pass = 'root';
$port = 8889;

$firstName = trim($_POST['first_name'] ?? '');
$lastName  = trim($_POST['last_name'] ?? '');
$phone     = trim($_POST['phone'] ?? '');

if (!$firstName || !$lastName || !$phone) {
    header("Location: index.html?status=missing");
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare(
        "INSERT INTO contacts (first_name, last_name, phone) VALUES (?, ?, ?)"
    );
    $stmt->execute([$firstName, $lastName, $phone]);

    header("Location: index.html?status=success");
} catch (PDOException $e) {
    header("Location: index.html?status=error");
}
exit;