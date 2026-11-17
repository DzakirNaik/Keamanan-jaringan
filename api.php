<?php
// API CyberShield: ?action=load (GET) dan ?action=save (POST JSON)
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

function fail(int $code, string $msg): never {
    http_response_code($code);
    exit(json_encode(['ok' => false, 'error' => $msg]));
}

try {
    $pdo = db();
    $action = $_GET['action'] ?? 'load';

    if ($action === 'load') {
        $rules = [];
        foreach ($pdo->query("SELECT id,name,ip_address,port,action,is_active FROM firewall_rules ORDER BY id") as $r)
            $rules[] = ['id' => (int)$r['id'], 'name' => $r['name'], 'ip' => $r['ip_address'], 'port' => $r['port'], 'act' => $r['action'], 'on' => (int)$r['is_active']];
        $bl = [];
        foreach ($pdo->query("SELECT ip_address,reason,created_at FROM blacklist_ips ORDER BY id DESC") as $b)
            $bl[] = ['ip' => $b['ip_address'], 'why' => $b['reason'], 'at' => substr($b['created_at'], 0, 16)];
        $logs = [];
        foreach ($pdo->query("SELECT logged_at,source_ip,target_port,activity_type,action_taken FROM security_logs ORDER BY id DESC LIMIT 500") as $l)
            $logs[] = ['t' => $l['logged_at'], 'ip' => $l['source_ip'], 'port' => (int)$l['target_port'], 'type' => $l['activity_type'], 'act' => $l['action_taken']];
        $set = $pdo->query("SELECT skey,svalue FROM settings")->fetchAll(PDO::FETCH_KEY_PAIR);
        echo json_encode([
            'rules' => $rules, 'bl' => $bl, 'logs' => $logs,
            'tot' => (int)($set['tot'] ?? 0), 'al' => (int)($set['al'] ?? 0), 'blk' => (int)($set['blk'] ?? 0),
            'on' => ($set['fw_on'] ?? '1') === '1',
            'ports' => json_decode($set['ports'] ?? '{}', true) ?: new stdClass(),
        ]);
        exit;
    }

    if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $d = json_decode(file_get_contents('php://input'), true);
        if (!is_array($d)) fail(400, 'JSON tidak valid');

        $pdo->beginTransaction();

        // 1) firewall_rules
        $pdo->exec("DELETE FROM firewall_rules");
        $st = $pdo->prepare("INSERT INTO firewall_rules (id,name,ip_address,port,action,is_active) VALUES (?,?,?,?,?,?)");
        foreach ($d['rules'] ?? [] as $r) {
            $st->execute([(int)$r['id'], mb_substr((string)$r['name'], 0, 100), mb_substr((string)$r['ip'], 0, 50),
                mb_substr((string)$r['port'], 0, 10), ($r['act'] ?? '') === 'ALLOW' ? 'ALLOW' : 'BLOCK', empty($r['on']) ? 0 : 1]);
        }

        // 2) blacklist_ips
        $pdo->exec("DELETE FROM blacklist_ips");
        $st = $pdo->prepare("INSERT IGNORE INTO blacklist_ips (ip_address,reason,created_at) VALUES (?,?,?)");
        foreach (array_reverse($d['bl'] ?? []) as $b) {
            if (!filter_var($b['ip'] ?? '', FILTER_VALIDATE_IP)) continue;
            $at = preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/', $b['at'] ?? '') ? $b['at'] : date('Y-m-d H:i');
            $st->execute([$b['ip'], mb_substr((string)($b['why'] ?? 'Manual'), 0, 255), $at]);
        }

        // 3) security_logs (hanya entri baru)
        if (!empty($d['clr'])) $pdo->exec("DELETE FROM security_logs");
        $st = $pdo->prepare("INSERT INTO security_logs (logged_at,source_ip,target_port,activity_type,action_taken) VALUES (?,?,?,?,?)");
        foreach (array_reverse($d['newLogs'] ?? []) as $l) {
            $st->execute([$l['t'], mb_substr((string)$l['ip'], 0, 45), (int)$l['port'],
                mb_substr((string)$l['type'], 0, 150), ($l['act'] ?? '') === 'DIIZINKAN' ? 'DIIZINKAN' : 'DIBLOKIR']);
        }
        // simpan maksimal 5000 log terakhir
        $pdo->exec("DELETE FROM security_logs WHERE id <= (SELECT id FROM (SELECT id FROM security_logs ORDER BY id DESC LIMIT 1 OFFSET 5000) x)");

        // 4) settings / statistik
        $st = $pdo->prepare("REPLACE INTO settings (skey,svalue) VALUES (?,?)");
        foreach (['tot' => (int)($d['tot'] ?? 0), 'al' => (int)($d['al'] ?? 0), 'blk' => (int)($d['blk'] ?? 0),
                  'fw_on' => !empty($d['on']) ? '1' : '0', 'ports' => json_encode($d['ports'] ?? new stdClass())] as $k => $v)
            $st->execute([$k, (string)$v]);

        $pdo->commit();
        echo json_encode(['ok' => true]);
        exit;
    }

    fail(404, 'Aksi tidak dikenal');
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    fail(500, 'Kesalahan server: ' . $e->getMessage());
}
