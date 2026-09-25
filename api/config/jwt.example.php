<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

define('JWT_SECRET', 'REPLACE_WITH_YOUR_OWN_64_CHAR_RANDOM_SECRET');
define('JWT_ALGO', 'HS256');
define('JWT_EXPIRY_SECONDS', 1800); // 30 mins


function generateJWT($payload)
{
    $issuedAt = time();
    $expire = $issuedAt + JWT_EXPIRY_SECONDS;

    $tokenPayload = array_merge($payload, [
        "iat" => $issuedAt,
        "exp" => $expire,
    ]);

    return JWT::encode($tokenPayload, JWT_SECRET, JWT_ALGO);
}

function verifyJWT($token)
{
    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, JWT_ALGO));
        return (array) $decoded;
    } catch (Exception $e) {
        return false;
    }
}