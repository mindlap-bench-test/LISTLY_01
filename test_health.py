import pytest
from app import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint_status_code(client):
    response = client.get('/health')
    assert response.status_code == 200


def test_health_endpoint_response_body(client):
    response = client.get('/health')
    assert response.json == {"status": "ok"}


def test_health_endpoint_content_type(client):
    response = client.get('/health')
    assert response.content_type == 'application/json'
