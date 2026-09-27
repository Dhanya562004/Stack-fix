const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Submit Code & Error for AI Analysis
 */
export async function analyzeCodePayload({ code, error, language }) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, error, language })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `API Error (${response.status})`);
    }

    return data;
  } catch (err) {
    console.error('API analyzeCode error:', err);
    throw err;
  }
}

/**
 * Fetch Backend System Health Metrics
 */
export async function fetchHealthStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error('API fetchHealth error:', err);
    return null;
  }
}

/**
 * Fetch History Logs
 */
export async function fetchAnalysisHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error('API fetchHistory error:', err);
    return [];
  }
}
