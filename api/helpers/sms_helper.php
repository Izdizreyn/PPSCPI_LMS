<?php

function sendSms(string $phoneRaw, string $message): array
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

    $gatewayResponse = trim($response);
    $sent = smsGatewayAccepted($gatewayResponse);

    return ['success' => $sent, 'message' => $gatewayResponse];
}

/**
 * Backward-compatible alias in case anything still calls the old name
 * directly with a custom message string.
 */
function sendEnrollmentSms(string $phoneRaw, string $message): array
{
    return sendSms($phoneRaw, $message);
}

function smsGatewayAccepted(string $response): bool
{
    $hasFailure = preg_match('/\b(?:failed|failure|error|invalid|not\s+accepted|rejected)\b/i', $response);
    $wasAccepted = preg_match('/\bmessage sent with id\b/i', $response)
        || preg_match('/\b(?:message|sms)\b.{0,60}\b(?:being\s+processed|processing|processed|queued|accepted)\b/i', $response)
        || preg_match('/\b(?:status|state)\b["\':=\s]+(?:pending|processing|processed|queued|accepted|sent)\b/i', $response);

    return !$hasFailure && (bool) $wasAccepted;
}

/**
 * "Your enrollment was approved" SMS.
 * Call right after a student's status is set to Approved in approve.php.
 */
function sendEnrollmentApprovedSms(string $phoneRaw, string $studentName, string $queueNumber): array
{
    $message = "Hi {$studentName}, your enrollment at PPCSPI has been "
        . "approved! Your queue number is {$queueNumber}. Please proceed "
        . "to the cashier for payment. - PPCSPI";

    return sendSms($phoneRaw, $message);
}

/**
 * "Your requested document is ready to claim" SMS.
 * Call right after a certificate_requests row is set to Approved.
 */
function sendDocumentReadySms(string $phoneRaw, string $studentName, string $documentPurpose): array
{
    $message = "Hi {$studentName}, your requested document "
        . "({$documentPurpose}) is now ready to claim at the registrar's "
        . "office. - PPCSPI";

    return sendSms($phoneRaw, $message);
}

/**
 * Looks up a student's phone number by LRN across the three intake
 * tables (new/old/transferee). These tables keep their row after
 * enrollment approval — only the status column changes — so this works
 * both right after approval and later for a document request.
 */
function findPhoneByLrn(mysqli $conn, string $lrn): ?string
{
    $tables = [
        ['table' => 'new_student_info', 'lrn' => 'lrn_new', 'phone' => 'phone_new'],
        ['table' => 'old_student_info', 'lrn' => 'lrn_old', 'phone' => 'phone_old'],
        ['table' => 'transferee_info', 'lrn' => 'lrn_trans', 'phone' => 'phone_trans'],
    ];

    foreach ($tables as $t) {
        $stmt = $conn->prepare("SELECT {$t['phone']} AS phone FROM {$t['table']} WHERE {$t['lrn']} = ?");
        $stmt->bind_param('s', $lrn);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if ($row && !empty($row['phone'])) {
            return $row['phone'];
        }
    }

    return null;
}