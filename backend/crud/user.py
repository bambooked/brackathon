"""CRUD operations for User model."""

from datetime import datetime, timezone

# インメモリのユーザーストア（実際のDB統合前の一時的な実装）
users_store: dict[str, dict] = {}
user_id_counter = 1


async def get_user_by_email(email: str) -> dict | None:
    """メールアドレスでユーザーを取得"""
    return users_store.get(email)


async def create_user(email: str, name: str, team_name: str = "チームA") -> dict:
    """新規ユーザーを作成"""
    global user_id_counter
    now = datetime.now(timezone.utc).isoformat()

    user = {
        "id": user_id_counter,
        "email": email,
        "name": name,
        "role": "member",
        "team_name": team_name,
        "nickname": None,
        "use_nickname": False,
        "created_at": now,
        "updated_at": now,
    }
    users_store[email] = user
    user_id_counter += 1
    return user


async def update_user(email: str, **kwargs) -> dict:
    """ユーザー情報を更新"""
    global user_id_counter
    user = users_store.get(email)
    now = datetime.now(timezone.utc).isoformat()

    if user is None:
        # ユーザーが存在しない場合は新規作成（トークンからの情報で初期化）
        user = {
            "id": user_id_counter,
            "email": email,
            "name": kwargs.get("name", email),
            "role": "member",
            "team_name": kwargs.get("team_name", "チームA"),
            "nickname": None,
            "use_nickname": False,
            "created_at": now,
            "updated_at": now,
        }
        users_store[email] = user
        user_id_counter += 1

    # 既存ユーザーまたは新規作成したユーザーを更新
    for key, value in kwargs.items():
        if value is not None:
            user[key] = value
    user["updated_at"] = now
    return user


async def get_users_by_team(team_name: str) -> list[dict]:
    """チーム名でユーザー一覧を取得（モック）"""
    # モックデータ: 複数チームのユーザー
    all_mock_users = [
        {
            "id": 1,
            "name": "テストユーザー",
            "nickname": "テスト太郎",
            "use_nickname": True,
            "team_name": "チームA",
        },
        {
            "id": 2,
            "name": "山田太郎",
            "nickname": None,
            "use_nickname": False,
            "team_name": "チームA",
        },
        {
            "id": 3,
            "name": "佐藤花子",
            "nickname": "さとはな",
            "use_nickname": True,
            "team_name": "チームA",
        },
        {
            "id": 4,
            "name": "鈴木一郎",
            "nickname": None,
            "use_nickname": False,
            "team_name": "チームB",
        },
        {
            "id": 5,
            "name": "田中美咲",
            "nickname": "みさっち",
            "use_nickname": False,
            "team_name": "チームB",
        },
    ]

    # チームでフィルタリング
    return [u for u in all_mock_users if u["team_name"] == team_name]
