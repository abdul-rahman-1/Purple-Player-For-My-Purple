const API = (import.meta.env.VITE_API_URL||'http://localhost:4000') + ':4000/api';
console.log('🌐 Using API base URL:', API);

export async function fetchTracks(){ 
  try {
    const r = await fetch(API + '/tracks'); 
    if (!r.ok) throw new Error(`Server error: ${r.status}`);
    return await r.json(); 
  } catch (err) {
    console.error('❌ Fetch tracks failed:', err);
    throw err;
  }
}

export async function addTrack(payload){ 
  try {
    console.log('📤 POST /tracks with payload:', payload);
    const r = await fetch(API+'/tracks',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
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

export async function deleteTrack(trackId, userId){ 
  try {
    console.log('🗑️ DELETE /tracks/:id for trackId:', trackId);
    const r = await fetch(API+'/tracks/'+trackId,{
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId})
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
