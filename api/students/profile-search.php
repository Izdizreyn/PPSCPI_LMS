<?php
// api/students/profile-search.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$lrn = $_GET['lrn'] ?? '';

if (empty($lrn)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "LRN is required."]);
    exit();
}

$tables = [
    'new_student_info' => 'lrn_new',
    'transferee_info' => 'lrn_trans',
    'old_student_info' => 'lrn_old',
];

$studentData = null;
$studentType = null;

foreach ($tables as $table => $column) {
    $stmt = $conn->prepare("SELECT * FROM $table WHERE $column = ?");
    $stmt->bind_param("s", $lrn);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $studentData = $result->fetch_assoc();
        $studentType = $table;
        $stmt->close();
        break;
    }
    $stmt->close();
}

if (!$studentData) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "No student found with LRN: $lrn"]);
    exit();
}

$prefixMap = [
    'new_student_info' => 'new',
    'transferee_info' => 'trans',
    'old_student_info' => 'old',
];
$prefix = $prefixMap[$studentType];

$fieldMap = [
    'new' => ['id' => 'id_new', 'fname' => 'fname_new', 'mname' => 'mname_new', 'lname' => 'lname_new', 'extname' => 'extname_new', 'yr_lvl' => 'yr_lvl_new', 'strand' => 'strand_new', 'age' => 'age_new', 'bday' => 'bday_new', 'gender' => 'gender_new', 'phone' => 'phone_new', 'email' => 'email_new'],
    'trans' => ['id' => 'id_trans', 'fname' => 'fname_trans', 'mname' => 'mname_trans', 'lname' => 'lname_trans', 'extname' => 'extname_trans', 'yr_lvl' => 'yr_lvl_trans', 'strand' => 'strand_trans', 'age' => 'age_trans', 'bday' => 'bday_trans', 'gender' => 'gender_trans', 'phone' => 'phone_trans', 'email' => 'email_trans'],
    'old' => ['id' => 'id_old', 'fname' => 'fname_old', 'mname' => 'mname_old', 'lname' => 'lname_old', 'extname' => 'extname_old', 'yr_lvl' => 'yr_lvl_old', 'strand' => 'strand_old', 'age' => 'age_old', 'bday' => 'bday_old', 'gender' => 'gender_old', 'phone' => 'phone_old', 'email' => 'email_old'],
];
$f = $fieldMap[$prefix];
$studentId = $studentData[$f['id']];

$status = $studentData['status_new'] ?? $studentData['status_old'] ?? $studentData['status_trans'] ?? 'Pending';

$studentTypeMap = ['new' => 'new', 'trans' => 'transferee', 'old' => 'old'];
$mappedStudentType = $studentTypeMap[$prefix];

$hasQueueInfo = false;
if ($status === 'Approved') {
    $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM enrollment_schedule WHERE student_type = ? AND student_id = ?");
    $stmt->bind_param("si", $mappedStudentType, $studentId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $hasQueueInfo = $row['cnt'] > 0;
    $stmt->close();
}

$parentTableMap = ['new' => 'new_student_parent', 'trans' => 'transferee_parent', 'old' => 'old_student_parent'];
$parentTable = $parentTableMap[$prefix];
$stmt = $conn->prepare("SELECT * FROM $parentTable WHERE id_par_$prefix = ?");
$stmt->bind_param("i", $studentId);
$stmt->execute();
$parentResult = $stmt->get_result();
$parentData = $parentResult->num_rows > 0 ? $parentResult->fetch_assoc() : null;
$stmt->close();

$addressTableMap = ['new' => 'new_student_address', 'trans' => 'transferee_address', 'old' => 'old_student_address'];
$addressColumnMap = ['new' => 'id_add_new', 'trans' => 'id_add_trans', 'old' => 'id_old_add'];
$addressTable = $addressTableMap[$prefix];
$addressColumn = $addressColumnMap[$prefix];
$stmt = $conn->prepare("SELECT * FROM $addressTable WHERE $addressColumn = ?");
$stmt->bind_param("i", $studentId);
$stmt->execute();
$addressResult = $stmt->get_result();
$addressData = $addressResult->num_rows > 0 ? $addressResult->fetch_assoc() : null;
$stmt->close();

$reqTableMap = ['new' => 'new_student_req', 'trans' => 'transferee_req', 'old' => 'old_student_req'];
$reqTable = $reqTableMap[$prefix];
$stmt = $conn->prepare("SELECT * FROM $reqTable WHERE id_req_$prefix = ?");
$stmt->bind_param("i", $studentId);
$stmt->execute();
$reqResult = $stmt->get_result();
$requirements = $reqResult->num_rows > 0 ? $reqResult->fetch_assoc() : [];
$stmt->close();

$stmt = $conn->prepare("SELECT * FROM student_balances WHERE student_lrn = ? ORDER BY last_updated DESC LIMIT 1");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$balanceResult = $stmt->get_result();
$balanceData = $balanceResult->num_rows > 0 ? $balanceResult->fetch_assoc() : null;
$stmt->close();

echo json_encode([
    "success" => true,
    "student" => [
        "id" => $studentId,
        "type" => $prefix,
        "mapped_type" => $mappedStudentType,
        "lrn" => $lrn,
        "first_name" => $studentData[$f['fname']] ?? 'N/A',
        "middle_name" => $studentData[$f['mname']] ?? '',
        "last_name" => $studentData[$f['lname']] ?? 'N/A',
        "ext_name" => $studentData[$f['extname']] ?? '',
        "year_level" => $studentData[$f['yr_lvl']] ?? 'N/A',
        "strand" => $studentData[$f['strand']] ?? null,
        "age" => $studentData[$f['age']] ?? 'N/A',
        "birthday" => $studentData[$f['bday']] ?? 'N/A',
        "gender" => $studentData[$f['gender']] ?? 'N/A',
        "phone" => $studentData[$f['phone']] ?? 'N/A',
        "email" => $studentData[$f['email']] ?? 'N/A',
        "status" => $status,
        "has_queue_info" => $hasQueueInfo,
    ],
    "address" => $addressData,
    "parent" => $parentData,
    "requirements" => $requirements,
    "balance" => $balanceData,
]);

$conn->close();