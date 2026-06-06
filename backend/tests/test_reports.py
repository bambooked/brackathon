import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_create_report():
    """POST /api/v1/reports - 日報を投稿"""
    response = client.post(
        "/api/v1/reports",
        json={
            "report_date": "2026-06-06",
            "title": "今日の業務報告",
            "body": "APIの実装を進めました。認証とポイント機能を実装し、テストも完了しました。",
        },
        headers={"Authorization": "Bearer dummy_jwt_token"},
    )
    assert response.status_code == 200
    data = response.json()
    # daily_reports のスキーマに従った検証
    assert "id" in data
    assert "user_id" in data
    assert "report_date" in data
    assert data["report_date"] == "2026-06-06"
    assert "title" in data
    assert "body" in data
    assert "created_at" in data
    assert "points_awarded" in data
    assert isinstance(data["points_awarded"], int)


def test_get_reports():
    """GET /api/v1/reports - チームの日報一覧を取得"""
    response = client.get("/api/v1/reports", headers={"Authorization": "Bearer dummy_jwt_token"})
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    assert isinstance(data["reports"], list)
    if len(data["reports"]) > 0:
        report = data["reports"][0]
        # daily_reports のスキーマに従った検証
        assert "id" in report
        assert "user_id" in report
        assert "user" in report  # JOIN された users テーブル
        assert report["user"]["id"] is not None
        assert report["user"]["name"] is not None
        assert "report_date" in report
        assert "title" in report
        assert "body" in report
        assert "reactions" in report  # JOIN された reactions テーブル
        assert isinstance(report["reactions"], list)
        assert "created_at" in report
        assert "updated_at" in report


def test_react_to_report():
    """POST /api/v1/reports/{report_id}/react - 日報にリアクション"""
    response = client.post(
        "/api/v1/reports/1/react",
        json={"type": "like"},
        headers={"Authorization": "Bearer dummy_jwt_token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

    # reactions のスキーマに従った検証
    assert "reaction" in data
    assert data["reaction"]["id"] is not None
    assert data["reaction"]["daily_report_id"] == 1
    assert data["reaction"]["user_id"] is not None
    assert data["reaction"]["type"] == "like"
    assert "created_at" in data["reaction"]

    # point_transactions のスキーマに従った検証（ポイント値を確認）
    assert "author_point_transaction" in data
    assert data["author_point_transaction"]["amount"] == 10  # 日報作成者は10ポイント
    assert data["author_point_transaction"]["transaction_type"] == "reaction_received"

    assert "reactor_point_transaction" in data
    assert data["reactor_point_transaction"]["amount"] == 2  # リアクション者は2ポイント
    assert data["reactor_point_transaction"]["transaction_type"] == "reaction_given"

    # リアクション実行者の更新後残高
    assert "my_new_balance" in data
    assert isinstance(data["my_new_balance"], int)


def test_get_reports_with_date_filter():
    """GET /api/v1/reports?report_date=2026-06-06 - 日付で絞り込み"""
    response = client.get(
        "/api/v1/reports?report_date=2026-06-06",
        headers={"Authorization": "Bearer dummy_jwt_token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    # 2026-06-06の日報のみが返る
    for report in data["reports"]:
        assert report["report_date"] == "2026-06-06"


def test_get_reports_with_user_filter():
    """GET /api/v1/reports?user_id=1 - ユーザーで絞り込み"""
    response = client.get(
        "/api/v1/reports?user_id=1", headers={"Authorization": "Bearer dummy_jwt_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    # user_id=1の日報のみが返る
    for report in data["reports"]:
        assert report["user_id"] == 1


def test_get_reports_with_multiple_filters():
    """GET /api/v1/reports?report_date=2026-06-06&user_id=1 - 複数条件で絞り込み"""
    response = client.get(
        "/api/v1/reports?report_date=2026-06-06&user_id=1",
        headers={"Authorization": "Bearer dummy_jwt_token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    # 両方の条件を満たす日報のみが返る
    for report in data["reports"]:
        assert report["report_date"] == "2026-06-06"
        assert report["user_id"] == 1


def test_get_all_reports():
    """GET /api/v1/reports/all - 全期間全ユーザーの日報を取得"""
    response = client.get(
        "/api/v1/reports/all", headers={"Authorization": "Bearer dummy_jwt_token"}
    )
    assert response.status_code == 200
    data = response.json()

    # レスポンス構造の検証
    assert "reports" in data
    assert "total_count" in data
    assert "user_count" in data
    assert "date_range" in data

    # データの整合性検証
    assert isinstance(data["reports"], list)
    assert data["total_count"] == len(data["reports"])
    assert data["total_count"] == 3  # モックデータは3件
    assert data["user_count"] == 2  # user_id: 1, 2の2名
    assert isinstance(data["user_count"], int)

    # 日付範囲の検証
    assert "start" in data["date_range"]
    assert "end" in data["date_range"]
    assert data["date_range"]["start"] == "2026-06-05"
    assert data["date_range"]["end"] == "2026-06-06"

    # 日報の詳細検証
    if len(data["reports"]) > 0:
        report = data["reports"][0]
        assert "id" in report
        assert "user_id" in report
        assert "user" in report
        assert "report_date" in report
        assert "title" in report
        assert "body" in report
        assert "reactions" in report
        assert "created_at" in report
        assert "updated_at" in report
