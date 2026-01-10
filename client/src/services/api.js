import { API_BASE_URL } from '../config/api.js';

export const fetchHeatLayer = async (year) => {
  console.log('[API] Fetching heat layer for year:', year, 'from:', `${API_BASE_URL}/api/heat/${year}`);

  const response = await fetch(`${API_BASE_URL}/api/heat/${year}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('[API] Heat layer fetch failed:', response.status, response.statusText);
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  console.log('[API] Heat layer response:', data);

  // The backend returns a relative tile URL like "/api/heat/tile/{year}/{z}/{x}/{y}"
  // We need to prepend the API_BASE_URL so it works when frontend is on Firebase
  if (data.tileUrl && API_BASE_URL) {
    data.tileUrl = `${API_BASE_URL}${data.tileUrl}`;
    console.log('[API] Full tile URL:', data.tileUrl);
  }

  return data;
};


export const fetchAnalysis = async (lat, lng) => {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ lat, lng }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response.json();
};
