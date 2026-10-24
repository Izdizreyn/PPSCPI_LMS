<?php
require_once __DIR__ . '/../helpers/grades_helper.php';
$user = g_user(['purple_admin']);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') g_json(['success' => false, 'message' => 'Method not allowed.'], 405);

$validatorId = (int) $user['user_id'];
$b = g_body();
$lrn = trim($b['lrn'] ?? '');
if ($lrn === '') g_json(['success' => false, 'message' => 'LRN is required.'], 400);
$quarter = g_quarter($b['quarter'] ?? 0);
$sy = g_school_year($b['school_year'] ?? null);
$action = $b['action'] ?? '';
$reason = trim($b['reason'] ?? '');

$map = [
    'validate' => ['Submitted', 'Released'],
    'return'   => ['Submitted', 'Returned'],
    'release'  => ['Validated', 'Released'],
];
if (!isset($map[$action])) g_json(['success' => false, 'message' => 'Invalid action.'], 400);
if ($action === 'return' && $reason === '') g_json(['success' => false, 'message' => 'A reason is required when returning grades.'], 422);
[$from, $to] = $map[$action];

$conn->begin_transaction();
try {
    $st = $conn->prepare('SELECT id FROM grades WHERE student_lrn=? AND school_year=? AND quarter=? AND status=? FOR UPDATE');
    $st->bind_param('ssis', $lrn, $sy, $quarter, $from);
    $st->execute();
    $ids = array_column($st->get_result()->fetch_all(MYSQLI_ASSOC), 'id');
    $st->close();
    if (!$ids) throw new Exception("No grades in '$from' status for this student and quarter.");

    if ($action === 'validate') {
        $upd = $conn->prepare("UPDATE grades SET status='Released', validated_by=?, validated_at=NOW(), released_at=NOW(), remarks=NULL WHERE id=?");
    } elseif ($action === 'return') {
        $upd = $conn->prepare("UPDATE grades SET status='Returned', remarks=?, validated_by=? WHERE id=?");
    } else {
        $upd = $conn->prepare("UPDATE grades SET status='Released', released_at=NOW() WHERE id=?");
    }

    foreach ($ids as $id) {
        $gradeId = (int) $id;
        if ($action === 'validate') {
            $upd->bind_param('ii', $validatorId, $gradeId);
        } elseif ($action === 'return') {
            $upd->bind_param('sii', $reason, $validatorId, $gradeId);
        } else {
            $upd->bind_param('i', $gradeId);
        }
        $upd->execute();
        g_audit($conn, $gradeId, $validatorId, $action, $from, $to);
    }
    $upd->close();

    $conn->commit();
    g_json(['success' => true, 'message' => ucfirst($action) . ' completed for ' . count($ids) . ' subject(s).']);
} catch (Exception $e) {
    $conn->rollback();
    g_json(['success' => false, 'message' => $e->getMessage()], 409);
}
