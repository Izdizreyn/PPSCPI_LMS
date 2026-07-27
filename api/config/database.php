<?php
// api/config/database.php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "purple_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit();
}

$conn->set_charset("utf8mb4");