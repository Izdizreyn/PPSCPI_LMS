<?php
// api/middleware/auth.php

require_once __DIR__ . '/../config/jwt.php';

function getBearerToken()
{
    $headers = getallheaders();

    // Header names can vary in casing depending on server config
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader) {
        return null;
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return $matches[1];
    }

    return null;
}

function requireAuth()
{
    $token = getBearerToken();

    if (!$token) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "No token provided."
        ]);
        exit();
    }

    $decoded = verifyJWT($token);

    if (!$decoded) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid or expired token."
        ]);
        exit();
    }

    return $decoded; // contains whatever you encoded at login, e.g. user_id, username, role
}

function requireRole($allowedRoles)
{
    $user = requireAuth();

    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Access denied for this role."
        ]);
        exit();
    }

    return $user;
}