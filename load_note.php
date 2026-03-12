<?php
require 'db.php';
$row = $pdo->query("SELECT content FROM note WHERE id = 1")->fetch();
echo $row ? $row['content'] : '';
