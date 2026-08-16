<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/fees_helper.php';

requireRole(['purple_admin']);

function getAllApprovedStudents($conn) {
    $allStudents = [];

    $sql = "SELECT id_new as id, lname_new as lname, fname_new as fname, mname_new as mname,
            extname_new as extname, lrn_new as lrn, yr_lvl_new as yr_lvl, strand_new as strand,
            gender_new as gender, 'new' as type FROM new_student_info WHERE status_new = 'Approved'";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) $allStudents[] = $row;

    $sql = "SELECT id_old as id, lname_old as lname, fname_old as fname, mname_old as mname,
            extname_old as extname, lrn_old as lrn, yr_lvl_old as yr_lvl, strand_old as strand,
            gender_old as gender, 'old' as type FROM old_student_info WHERE status_old = 'Approved'";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) $allStudents[] = $row;

    $sql = "SELECT id_trans as id, lname_trans as lname, fname_trans as fname, mname_trans as mname,
            extname_trans as extname, lrn_trans as lrn, yr_lvl_trans as yr_lvl, strand_trans as strand,
            gender_trans as gender, 'transferee' as type FROM transferee_info WHERE status_trans = 'Approved'";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) $allStudents[] = $row;

    return $allStudents;
}

$students = getAllApprovedStudents($conn);
$balancesMap = getStudentBalancesMap($conn);

$output = array_map(function ($s) {
    $fullName = trim($s['fname'] . ' ' . $s['mname'] . ' ' . $s['lname'] . ' ' . $s['extname']);
    return [
        'id' => $s['id'],
        'lrn' => $s['lrn'],
        'full_name' => $fullName,
        'gender' => $s['gender'],
        'year_level' => $s['yr_lvl'],
        'strand' => $s['strand'],
        'type' => $s['type'],
    ];
}, $students);

$enrolledResult = $conn->query("SELECT lrn FROM enrolled_students");
$enrolledLrns = [];
while ($row = $enrolledResult->fetch_assoc()) {
    $enrolledLrns[] = $row['lrn'];
}

echo json_encode([
    "success" => true,
    "students" => $output,
    "balances" => $balancesMap,
    "enrolled_lrns" => $enrolledLrns,
]);

$conn->close();