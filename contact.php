<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée.']);
    exit;
}

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Strict',
    'use_strict_mode' => true,
]);

$now = time();
if (isset($_SESSION['last_contact_send']) && $now - (int) $_SESSION['last_contact_send'] < 30) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Merci de patienter avant un nouvel envoi.']);
    exit;
}

$rawBody = file_get_contents('php://input') ?: '';
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (str_contains($contentType, 'application/json')) {
    $payload = json_decode($rawBody, true);
    if (!is_array($payload)) {
        $payload = [];
    }
} else {
    $payload = $_POST;
}

function field(array $payload, string $key, int $maxLength): string
{
    $value = trim((string) ($payload[$key] ?? ''));
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value) ?? '';
    return substr($value, 0, $maxLength);
}

function headerSafe(string $value): string
{
    return str_replace(["\r", "\n"], ' ', $value);
}

$name = field($payload, 'name', 80);
$email = field($payload, 'email', 120);
$subject = field($payload, 'subject', 120);
$message = field($payload, 'message', 1200);
$honeypot = field($payload, 'company', 80);

if ($honeypot !== '') {
    $_SESSION['last_contact_send'] = $now;
    echo json_encode(['ok' => true]);
    exit;
}

if ($name === '' || $subject === '' || strlen($message) < 10 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Certains champs sont incomplets ou invalides.']);
    exit;
}

$to = 'laurent.schaeffer20@gmail.com';
$safeSubject = headerSafe($subject);
$mailSubject = 'Portfolio - ' . $safeSubject;
$body = "Nouveau message depuis le portfolio\n\n";
$body .= "Nom: {$name}\n";
$body .= "Email: {$email}\n";
$body .= "Sujet: {$subject}\n\n";
$body .= $message . "\n";

$headers = [
    'From: Portfolio <no-reply@' . headerSafe($_SERVER['SERVER_NAME'] ?? 'localhost') . '>',
    'Reply-To: ' . headerSafe($name) . ' <' . headerSafe($email) . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail($to, $mailSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Le serveur mail n’est pas configuré.']);
    exit;
}

$_SESSION['last_contact_send'] = $now;
echo json_encode(['ok' => true]);
