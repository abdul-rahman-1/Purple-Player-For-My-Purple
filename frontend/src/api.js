// src/utils/api.js

// --- ✅ Normalize API base URL ---
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Remove trailing slashes to avoid //api/ problems
export const API_BASE = rawBase.replace(/\/+$/, '');
export const API = `${API_BASE}/api`;

// --- ✅ API Key (default fallback if missing) ---
export const API_KEY = import.meta.env.VITE_API_KEY || 'purple-secret-key-samra-2025';

// --- ✅ Helper to add API key header ---
export function getHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...extra
  };
}

// --- ✅ Debug logs ---
console.log('🌐 Using API base URL:', API);
console.log('🔑 API Key configured:', API_KEY ? '✅ Yes' : '❌ No');

// ==================== TRACKS ====================

// Fetch all tracks for a user
export async function fetchTracks(userId) {
  try {
    if (!userId) throw new Error('userId is required');
    const r = await fetch(`${API}/tracks?userId=${userId}`, {
      headers: getHeaders()
    });
    if (!r.ok) throw new Error(`Server error: ${r.status}`);
    return await r.json();
  } catch (err) {
    console.error('❌ Fetch tracks failed:', err);
    throw err;
  }
}

// Add a new track
export async function addTrack(payload) {
  try {
    console.log('📤 POST /tracks with payload:', payload);
    const r = await fetch(`${API}/tracks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('❌ Server rejected:', data);
      throw new Error(data.message || data.error || 'Failed to add track');
    }

    console.log('✅ Track added successfully:', data);
    return data;
  } catch (err) {
    console.error('❌ Add track failed:', err);
    throw err;
  }
}

// Delete a track
export async function deleteTrack(trackId, userId) {
  try {
    console.log('🗑️ DELETE /tracks/:id for trackId:', trackId);
    const r = await fetch(`${API}/tracks/${trackId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ userId })
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('❌ Delete failed:', data);
      throw new Error(data.message || data.error || 'Failed to delete track');
    }

    console.log('✅ Track deleted successfully');
    return data;
  } catch (err) {
    console.error('❌ Delete track failed:', err);
    throw err;
  }
}
