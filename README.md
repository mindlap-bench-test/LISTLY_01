# LISTLY_01

## Health check

The `/health` endpoint provides a simple way to check the status of the service.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Example Request:**
```bash
curl http://localhost:8000/health
```

**Example Response:**
```json
{
  "status": "ok"
}
```

This endpoint can be used for basic health monitoring and load balancer checks.