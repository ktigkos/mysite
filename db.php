<?php
$host = 'localhost';
$db   = 'notepad';
$user = 'root';
$pass = 'root';
$port = 8889;

$pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
