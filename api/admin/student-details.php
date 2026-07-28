<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

$type = $_GET['type'] ?? '';
$id = $_GET['id'] ?? '';

if (empty($type) || empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "type and id are required."]);
    exit();
}

function getStudentDetails($conn, $type, $id) {
    $info = [];
    $tables = [
        'new' => ['info' => 'new_student_info', 'id' => 'id_new', 'addr' => 'new_student_address', 'addr_id' => 'id_add_new', 'parent' => 'new_student_parent', 'parent_id' => 'id_par_new', 'req' => 'new_student_req', 'req_id' => 'id_req_new'],
        'old' => ['info' => 'old_student_info', 'id' => 'id_old', 'addr' => 'old_student_address', 'addr_id' => 'id_old_add', 'parent' => 'old_student_parent', 'parent_id' => 'id_par_old', 'req' => 'old_student_req', 'req_id' => 'id_req_old'],
        'transferee' => ['info' => 'transferee_info', 'id' => 'id_trans', 'addr' => 'transferee_address', 'addr_id' => 'id_add_trans', 'parent' => 'transferee_parent', 'parent_id' => 'id_par_trans', 'req' => 'transferee_req', 'req_id' => 'id_req_trans'],
    ];

    if (!isset($tables[$type])) return null;
    $t = $tables[$type];

    $stmt = $conn->prepare("SELECT * FROM {$t['info']} WHERE {$t['id']} = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) $info['basic'] = $result->fetch_assoc();
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM {$t['addr']} WHERE {$t['addr_id']} = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) $info['address'] = $result->fetch_assoc();
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM {$t['parent']} WHERE {$t['parent_id']} = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) $info['parent'] = $result->fetch_assoc();
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM {$t['req']} WHERE {$t['req_id']} = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) $info['requirements'] = $result->fetch_assoc();
    $stmt->close();

    return $info;
}

$details = getStudentDetails($conn, $type, $id);

if (!$details) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Student not found."]);
    exit();
}

echo json_encode(["success" => true, "data" => $details]);
$conn->close();