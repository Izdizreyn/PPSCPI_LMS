<?php
// Sends an SMS through the local Android SMS Gateway relay (the `sms`
// folder integration). Returns ['success' => bool, 'message' => string].
// Never throws — a failed send should never block or roll back an
// enrollment; the caller decides what to do with the result.

function sendEnrollmentSms(string $phoneRaw, string $message): array
{
    $config = require __DIR__ . '/../config/sms.php';

    // Stored numbers are 09XXXXXXXXX; the gateway expects 9XXXXXXXXX
    // (no leading 0 — it prepends +63 itself, per sms.php's validation).
    $phone = preg_replace('/^0/', '', trim($phoneRaw));

    if (!preg_match('/^9\d{9}$/', $phone)) {
        return [
            'success' => false,
            'message' => 'Invalid phone number format for SMS: ' . $phoneRaw,
        ];
    }

    $postFields = http_build_query([
        'username' => $config['username'],
        'password' => $config['password'],
        'message'  => $message,
        'number'   => $phone,
    ]);

    $ch = curl_init($config['endpoint']);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return [
            'success' => false,
            'message' => 'SMS gateway request failed: ' . $curlError,
        ];
    }

    $sent = str_contains($response, 'Message sent with ID');

    return ['success' => $sent, 'message' => trim($response)];
}
