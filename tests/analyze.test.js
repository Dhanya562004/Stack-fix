const request = require('supertest');
const app = require('../backend/src/server');

describe('POST /analyze - AI Debugging Analysis API', () => {
  const sampleValidPayload = {
    code: 'name = "Alex"\nprint("Hello " + username)',
    error: 'NameError: name \'username\' is not defined',
    language: 'python'
  };

  it('should return 200 OK and valid response structure for valid code and error', async () => {
    const res = await request(app)
      .post('/analyze')
      .send(sampleValidPayload)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');

    const { data } = res.body;
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('input');
    expect(data.input).toEqual(sampleValidPayload);

    expect(data).toHaveProperty('analysis');
    expect(data.analysis).toHaveProperty('rootCause');
    expect(typeof data.analysis.rootCause).toBe('string');
    expect(data.analysis).toHaveProperty('explanation');
    expect(typeof data.analysis.explanation).toBe('string');
    expect(data.analysis).toHaveProperty('fixSteps');
    expect(Array.isArray(data.analysis.fixSteps)).toBe(true);
    expect(data.analysis).toHaveProperty('fixedCode');
    expect(typeof data.analysis.fixedCode).toBe('string');
    expect(data.analysis).toHaveProperty('confidenceScore');

    expect(res.body).toHaveProperty('storage');
    expect(res.body.storage).toHaveProperty('storage');
  });

  it('should return 400 Bad Request when code is missing', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({
        error: 'NameError: username is not defined'
      })
      .expect(400);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.some(d => d.field === 'code')).toBe(true);
  });

  it('should return 400 Bad Request when error stack is missing', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({
        code: 'console.log(x);'
      })
      .expect(400);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some(d => d.field === 'error')).toBe(true);
  });

  it('should return 400 Bad Request when code is empty whitespace', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({
        code: '   ',
        error: 'SyntaxError: unexpected token'
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should allow fetching analysis history via GET /analyze/history', async () => {
    const res = await request(app)
      .get('/analyze/history')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
