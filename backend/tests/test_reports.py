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
    # point_transactions のスキーマに従った検証
    assert "author_point_transaction" in data
    assert "reactor_point_transaction" in data
