CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(255),
    use_nickname BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    team_name VARCHAR(255) NOT NULL DEFAULT 'チームA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_team_name ON users (team_name);

CREATE TABLE IF NOT EXISTS daily_reports (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    title VARCHAR(255),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_report_date ON daily_reports (report_date);

CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    daily_report_id INT NOT NULL REFERENCES daily_reports (id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (daily_report_id, user_id, type)
);

CREATE TABLE IF NOT EXISTS point_accounts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    balance INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS point_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    amount INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    source_type VARCHAR(50),
    source_id INT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, email, name, nickname, use_nickname, role, team_name)
VALUES
    (1, 'test@example.com', 'テストユーザー', 'テスト太郎', TRUE, 'member', 'チームA'),
    (2, 'yamada@example.com', '山田太郎', NULL, FALSE, 'member', 'チームA'),
    (3, 'sato@example.com', '佐藤花子', 'さとはな', TRUE, 'member', 'チームA'),
    (4, 'suzuki@example.com', '鈴木一郎', NULL, FALSE, 'member', 'チームB'),
    (5, 'tanaka@example.com', '田中美咲', 'みさっち', FALSE, 'member', 'チームB')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 1), TRUE);

INSERT INTO point_accounts (user_id, balance)
VALUES
    (1, 150),
    (2, 120),
    (3, 110),
    (4, 95),
    (5, 80)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO daily_reports (id, user_id, report_date, title, body, created_at, updated_at)
VALUES
    (1, 1, DATE '2026-06-05', '今日の開発進捗', 'バックエンドAPIの実装を進めました。認証周りとポイント機能を実装。', TIMESTAMPTZ '2026-06-05 17:30:00+00', TIMESTAMPTZ '2026-06-05 17:30:00+00'),
    (2, 2, DATE '2026-06-05', 'フロントエンド実装', 'ダッシュボード画面のUIを実装しました。', TIMESTAMPTZ '2026-06-05 17:00:00+00', TIMESTAMPTZ '2026-06-05 17:00:00+00'),
    (3, 1, DATE '2026-06-06', 'DB設計の進捗', 'テーブル設計を完了しました。', TIMESTAMPTZ '2026-06-06 18:00:00+00', TIMESTAMPTZ '2026-06-06 18:00:00+00'),
    (4, 4, DATE '2026-06-06', 'チームBの日報', 'チームBの作業内容', TIMESTAMPTZ '2026-06-06 18:00:00+00', TIMESTAMPTZ '2026-06-06 18:00:00+00')
ON CONFLICT (id) DO NOTHING;

SELECT setval('daily_reports_id_seq', GREATEST((SELECT MAX(id) FROM daily_reports), 1), TRUE);

INSERT INTO reactions (id, daily_report_id, user_id, type, created_at)
VALUES
    (1, 1, 2, 'like', TIMESTAMPTZ '2026-06-05 18:00:00+00'),
    (2, 1, 3, 'thanks', TIMESTAMPTZ '2026-06-05 19:00:00+00')
ON CONFLICT (id) DO NOTHING;

SELECT setval('reactions_id_seq', GREATEST((SELECT MAX(id) FROM reactions), 1), TRUE);
