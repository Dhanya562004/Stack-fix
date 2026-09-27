const request = require('supertest');
const app = require('../backend/src/server');

describe('GET /health - System Health Check API', () => {
  it('should return 200 OK with server health metrics and integration status', async () => {
    const res = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'UP');
    expect(res.body.data).toHaveProperty('service', 'StackFix AI Engine API');
    expect(res.body.data).toHaveProperty('version');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('integrations');
    expect(res.body.data.integrations).toHaveProperty('geminiAi');
    expect(res.body.data.integrations).toHaveProperty('cloudStorage');
  });

  it('should also respond at /api/health', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
