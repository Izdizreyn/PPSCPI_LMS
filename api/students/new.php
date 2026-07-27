<?php
// api/students/new.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$lrn = isset($_POST['lrn_new']) ? trim($_POST['lrn_new']) : '';
$year_level = isset($_POST['yr_lvl_new']) ? trim($_POST['yr_lvl_new']) : '';
$last_name = isset($_POST['lname_new']) ? trim($_POST['lname_new']) : '';
$first_name = isset($_POST['fname_new']) ? trim($_POST['fname_new']) : '';
$middle_name = isset($_POST['mname_new']) ? trim($_POST['mname_new']) : null;
$ext_name = isset($_POST['extname_new']) ? trim($_POST['extname_new']) : null;
$age = isset($_POST['age_new']) ? intval($_POST['age_new']) : null;
$birthday = isset($_POST['birthday_new']) ? trim($_POST['birthday_new']) : '';
$gender = isset($_POST['gender_new']) ? trim($_POST['gender_new']) : '';
$phone = isset($_POST['phone_new']) ? trim($_POST['phone_new']) : '';
$email = isset($_POST['email_new']) ? filter_var($_POST['email_new'], FILTER_SANITIZE_EMAIL) : '';
$strand = isset($_POST['strand_new']) ? trim($_POST['strand_new']) : null;

$primary_address = isset($_POST['prim_add_new']) ? trim($_POST['prim_add_new']) : '';
$secondary_address = isset($_POST['sec_add_new']) ? trim($_POST['sec_add_new']) : '';
$zip_code = isset($_POST['zip_code_new']) ? trim($_POST['zip_code_new']) : '';

$parent_name = isset($_POST['parent_name_new']) ? trim($_POST['parent_name_new']) : null;
$parent_address = isset($_POST['parent_add_new']) ? trim($_POST['parent_add_new']) : null;
$parent_relationship = isset($_POST['parent_rel_new']) ? trim($_POST['parent_rel_new']) : null;
$parent_phone = isset($_POST['parent_phone_new']) ? trim($_POST['parent_phone_new']) : null;

$required = [
    'lrn_new' => $lrn,
    'yr_lvl_new' => $year_level,
    'lname_new' => $last_name,
    'fname_new' => $first_name,
    'age_new' => $age,
    'birthday_new' => $birthday,
    'gender_new' => $gender,
    'phone_new' => $phone,
    'email_new' => $email,
];

foreach ($required as $field => $value) {
    if (empty($value)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "$field is required."]);
        exit();
    }
}

$checkStmt = $conn->prepare("SELECT COUNT(*) FROM new_student_info WHERE lrn_new = ?");
$checkStmt->bind_param("s", $lrn);
$checkStmt->execute();
$checkStmt->bind_result($count);
$checkStmt->fetch();
$checkStmt->close();

if ($count > 0) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "This enrollee already exists. Duplicate entry is not allowed."]);
    exit();
}

function uploadFile($fileInput, $destinationFolder = __DIR__ . '/../uploads/')
{
    if (isset($_FILES[$fileInput]) && $_FILES[$fileInput]['error'] == 0) {
        if (!is_dir($destinationFolder)) {
            mkdir($destinationFolder, 0755, true);
        }
        $filename = basename($_FILES[$fileInput]["name"]);
        $targetFilePath = $destinationFolder . time() . "_" . $filename;
        move_uploaded_file($_FILES[$fileInput]["tmp_name"], $targetFilePath);
        return "uploads/" . basename($targetFilePath);
    }
    return null;
}

$report_card = uploadFile('report_card_new');
$form_137 = uploadFile('form_137_new');
$good_morale = uploadFile('gmorale_new');
$id_2x2 = uploadFile('2x2_id_new');

$requiredFiles = [
    'Report Card' => $report_card,
    'Form 137' => $form_137,
    'Certificate of Good Morale' => $good_morale,
    '2x2 ID' => $id_2x2,
];

foreach ($requiredFiles as $label => $value) {
    if (!$value) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "$label is required."]);
        exit();
    }
}

$conn->begin_transaction();

try {
    $stmt1 = $conn->prepare("INSERT INTO new_student_info 
        (lrn_new, yr_lvl_new, strand_new, lname_new, fname_new, mname_new, extname_new, age_new, bday_new, gender_new, phone_new, email_new) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt1->bind_param("sssssssissss", $lrn, $year_level, $strand, $last_name, $first_name, $middle_name, $ext_name, $age, $birthday, $gender, $phone, $email);
    $stmt1->execute();
    $id_new = $stmt1->insert_id;
    $stmt1->close();

    $stmt2 = $conn->prepare("INSERT INTO new_student_address (prim_add_new, sec_add_new, zip_code_new) VALUES (?, ?, ?)");
    $stmt2->bind_param("sss", $primary_address, $secondary_address, $zip_code);
    $stmt2->execute();
    $stmt2->close();

    $stmt3 = $conn->prepare("INSERT INTO new_student_parent (parent_name_new, parent_add_new, parent_rel_new, parent_phone_new) VALUES (?, ?, ?, ?)");
    $stmt3->bind_param("ssss", $parent_name, $parent_address, $parent_relationship, $parent_phone);
    $stmt3->execute();
    $stmt3->close();

    $stmt4 = $conn->prepare("INSERT INTO new_student_req (report_card_new, form_137_new, gmorale_new, id_pic_new) VALUES (?, ?, ?, ?)");
    $stmt4->bind_param("ssss", $report_card, $form_137, $good_morale, $id_2x2);
    $stmt4->execute();
    $stmt4->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "New record created successfully!",
        "id_new" => $id_new
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error creating record: " . $e->getMessage()]);
}

$conn->close();