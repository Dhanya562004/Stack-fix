const storageService = require('../backend/src/services/storageService');

describe('StorageService Cloud Abstraction Unit Tests', () => {
  const testId = 'test-analysis-12345';
  const testRecord = {
    id: testId,
    timestamp: new Date().toISOString(),
    input: { code: 'let a = null; a.foo();', error: 'TypeError' },
    analysis: { rootCause: 'Null access', fixedCode: 'let a = {}; a.foo();' }
  };

  it('should successfully save and retrieve an analysis record', async () => {
    const saveResult = await storageService.saveAnalysis(testId, testRecord);
    expect(saveResult).toHaveProperty('storage');

    const retrieved = await storageService.getAnalysis(testId);
    expect(retrieved).not.toBeNull();
    expect(retrieved.id).toBe(testId);
    expect(retrieved.analysis.rootCause).toBe('Null access');
  });

  it('should return storage status information', () => {
    const status = storageService.getStorageStatus();
    expect(status).toHaveProperty('provider');
    expect(status).toHaveProperty('bucket');
    expect(status).toHaveProperty('configured');
  });
});
