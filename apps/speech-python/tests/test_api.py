import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health/")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["service"] == "speech-python"


@pytest.mark.asyncio
async def test_liveness(client):
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "alive"


@pytest.mark.asyncio
async def test_readiness(client):
    response = await client.get("/health/ready")
    assert response.status_code in [200, 503]


@pytest.mark.asyncio
async def test_metrics_endpoint(client):
    response = await client.get("/metrics/")
    assert response.status_code == 200
    assert "text/plain" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_query_endpoint(client):
    response = await client.post(
        "/api/v1/query",
        json={"query": "What features were requested?", "top_k": 3}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "query" in data
    assert data["model"] in ["llama3.2", "error"]


@pytest.mark.asyncio
async def test_query_simple_endpoint(client):
    response = await client.post(
        "/api/v1/query-simple",
        json={"query": "meeting notes", "top_k": 2}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["model"] in ["llama3.2", "bm25"]


@pytest.mark.asyncio
async def test_query_validation(client):
    response = await client.post(
        "/api/v1/query",
        json={"query": ""}
    )
    assert response.status_code == 422
