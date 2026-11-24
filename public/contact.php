<?php
// Contact form handler for Hostinger (PHP) hosting.
// Sends website enquiries to support@novapixelsoftware.com.
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Asia/Kolkata');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Honeypot: bots fill the hidden "website" field.
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

function clean($v, $max = 2000) {
    $v = trim((string)($v ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}

$name    = clean($_POST['name'] ?? '', 120);
$phone   = clean($_POST['phone'] ?? '', 40);
$email   = clean($_POST['email'] ?? '', 160);
$service = clean($_POST['service'] ?? '', 80);
$message = clean($_POST['message'] ?? '', 5000);

if ($name === '' || $phone === '' || $message === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $email = '';
}

$to      = 'support@novapixelsoftware.com';
$subject = 'Website enquiry: ' . preg_replace('/[\n]/', ' ', $service) . ' (' . preg_replace('/[\n]/', ' ', $name) . ')';
$body    = "New enquiry from novapixelsoftware.com\n\n"
         . "Name:    $name\n"
         . "Phone:   $phone\n"
         . "Email:   " . ($email ?: '-') . "\n"
         . "Service: $service\n\n"
         . "Message:\n$message\n\n"
         . "Sent: " . date('d M Y, h:i A') . " | IP: " . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\n";

// Sender must be a real mailbox on this domain, or Hostinger may reject or spam-filter it.
$headers  = "From: NovaPixel Website <support@novapixelsoftware.com>\r\n";
if ($email !== '') {
    $headers .= "Reply-To: $email\r\n";
}
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-fsupport@novapixelsoftware.com');

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail could not be sent']);
}
