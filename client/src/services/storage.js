/**
 * storage.js - Storage adapter for test results.
 *
 * Rules:
 * 1. UI and components ONLY call saveResult(result) and getResults().
 * 2. Never call localStorage directly for test results outside this service.
 * 3. Keeps the last 500 test results in storage.
 * 4. Phase 1: uses localStorage.
 * 5. Phase 4: will switch to API calls (POST /api/results and GET /api/results) without changing any UI components.
 */

const STORAGE_KEY = 'jumpytype_results';
const MAX_SAVED_RESULTS = 500;

/**
 * Saves a single test result.
 * Phase 1: stores to localStorage (max 500 records).
 * Phase 4: if (user) POST /api/results else localStorage
 *
 * @param {object} result Standard result object
 * @returns {Promise<boolean>}
 */
export async function saveResult(result) {
  // Phase 4 hook:
  // if (isAuthenticated()) {
  //   const res = await fetch('/api/results', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(result),
  //   });
  //   return res.ok;
  // }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = JSON.parse(raw || '[]');

    all.push(result);

    // Keep the last 500 results
    const trimmed = all.slice(-MAX_SAVED_RESULTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch (err) {
    console.error('Failed to save result in storage adapter:', err);
    return false;
  }
}

/**
 * Retrieves saved test results.
 * Phase 1: reads from localStorage.
 * Phase 4: if (user) GET /api/results else localStorage
 *
 * @returns {Promise<Array<object>>}
 */
export async function getResults() {
  // Phase 4 hook:
  // if (isAuthenticated()) {
  //   const res = await fetch('/api/results');
  //   if (res.ok) return await res.json();
  // }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to get results in storage adapter:', err);
    return [];
  }
}
