"""CRUD operations for User model."""

from models import User


def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "team_name": user.team_name,
        "nickname": user.nickname,
        "use_nickname": user.use_nickname,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


async def get_user_by_email(email: str) -> dict | None:
    """メールアドレスでユーザーを取得"""
    user = await User.get_or_none(email=email)
    return _user_to_dict(user) if user is not None else None


async def create_user(email: str, name: str, team_name: str = "チームA") -> dict:
    """新規ユーザーを作成"""
    user = await User.create(email=email, name=name, team_name=team_name)
    return _user_to_dict(user)


async def update_user(email: str, **kwargs) -> dict:
    """ユーザー情報を更新"""
    name = kwargs.pop("name", None)
    team_name = kwargs.pop("team_name", None)
    defaults = {
        "name": name or email,
        "team_name": team_name or "チームA",
    }
    user, _ = await User.get_or_create(email=email, defaults=defaults)

    if name is not None:
        user.name = name
    if team_name is not None:
        user.team_name = team_name

    for key, value in kwargs.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)

    await user.save()
    return _user_to_dict(user)


async def get_users_by_team(team_name: str) -> list[dict]:
    """チーム名でユーザー一覧を取得"""
    users = await User.filter(team_name=team_name).order_by("id")
    return [_user_to_dict(user) for user in users]
