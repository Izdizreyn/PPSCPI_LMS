<?php
// Single source of truth for requestable document types.
// Paragraphs are the official letter text with blanks replaced by
// placeholders, filled in per-request by document-request.php.
//
// Placeholders: {full_name} {lrn} {level} {year_section} {school_year} {issue_date}

return [
    'coe' => [
        'label' => 'Certificate of Enrollment',
        'title' => 'CERTIFICATE OF ENROLLMENT',
        'paragraphs' => [
            'TO WHOM IT MAY CONCERN:',
            'This is to certify that <u>{full_name}</u> with the LRN of <u>{lrn}</u>, is officially enrolled as a <u>{level}</u> student of Power Purple College of Southern Philippines, Inc., for the Academic Year <u>{school_year}</u>, under Year Level/Section: <u>{year_section}</u>.',
            'This certification is issued upon the request of the student for whatever legal and official purpose it may serve.',
            'Given this <u>{issue_date}</u> at Power Purple College of Southern Philippines, Inc., Tuazon Subd., Polomolok, South Cotabato.',
        ],
    ],
    'honorable_dismissal' => [
        'label' => 'Honorable Dismissal',
        'title' => 'CERTIFICATE OF HONORABLE DISMISSAL',
        'paragraphs' => [
            'TO WHOM IT MAY CONCERN:',
            'This is to certify that <u>{full_name}</u> with a LRN <u>{lrn}</u>, a <u>{level}</u> student of Power Purple College of Southern Philippines, Inc., with Year Level/Section: <u>{year_section}</u>, is hereby granted Honorable Dismissal from this institution.',
            'The student has been cleared of all academic, financial, and other obligations with the school, subject to the records on file.',
            'This certificate is issued upon the request of the student for transfer to another educational institution or for whatever legal and official purpose it may serve.',
            'Given this <u>{issue_date}</u> at Power Purple College of Southern Philippines, Inc., Tuazon Subd., Polomolok, South Cotabato.',
        ],
    ],
    'good_moral' => [
        'label' => 'Certificate of Good Moral Character',
        'title' => 'CERTIFICATE OF GOOD MORAL CHARACTER',
        'paragraphs' => [
            'TO WHOM IT MAY CONCERN:',
            'This is to certify that <u>{full_name}</u> with a LRN of <u>{lrn}</u>, a <u>{level}</u> student of Power Purple College of Southern Philippines, Inc., with Year Level/Section: <u>{year_section}</u>, has been a student of this institution.',
            'To the best of our knowledge and based on the records available to the school, the student has maintained good moral character and conduct during his/her stay in the institution.',
            'This certificate is issued upon the request of the student for whatever legal and official purpose it may serve.',
            'Given this <u>{issue_date}</u> at Power Purple College of Southern Philippines, Inc., Tuazon Subd., Polomolok, South Cotabato.',
        ],
    ],
];