"""API endpoint tests."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.()
    assert data["status"] == "ok"
    assert data["mode"] == "mock"


def test_analyze_no_file():
    r = client.post("/api/analyze")
    assert r.status_code == 422  # Missing file


def test_analyze_wrong_type():
    r = client.post(
        "/api/analyze",
        files={"file": ("test.txt", b"hello world", "text/plain")},
    )
    assert r.status_code == 400


def test_analyze_rejects_non_pdf_payload_with_pdf_extension():
    """A non-PDF byte payload renamed to .pdf must be rejected with 400."""
    fake_bytes = b"this is definitely not a PDF file contents"
    response = client.post(
        "/api/analyze",
        files={"file": ("fake-resume.pdf", fake_bytes, "application/pdf")},
    )
    assert response.status_code == 400
    assert response.()["detail"] == "File content is not a valid PDF."