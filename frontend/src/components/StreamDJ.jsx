import { useState, useEffect } from 'react';

function StreamDJ({ channelId, user, isOwner, onClose }) {
  const [djState, setDjState] = useState(null);
  const [showAddSong, setShowAddSong] = useState(false);
  const [newSong, setNewSong] = useState({ title: '', artist: '', url: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (channelId) {
      initializeDJ();
      // Refresh every 5 seconds
      const interval = setInterval(loadDJState, 5000);
      return () => clearInterval(interval);
    }
  }, [channelId]);

  const initializeDJ = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/stream-dj/init/${channelId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDjState(data.dj);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize DJ:', err);
      setLoading(false);
    }
  };

  const loadDJState = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/stream-dj/${channelId}`);
      const data = await response.json();
      if (data.success) {
        setDjState(data.dj);
      }
    } catch (err) {
      console.error('Failed to load DJ state:', err);
    }
  };

  const addSong = async () => {
    if (!newSong.title || !newSong.artist) {
      alert('Please enter song title and artist');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/stream-dj/${channelId}/queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSong)
      });
      const data = await response.json();
      if (data.success) {
        setDjState(data.dj);
        setNewSong({ title: '', artist: '', url: '' });
        setShowAddSong(false);
        alert('Song added to queue!');
      } else {
        alert(data.error || 'Failed to add song');
      }
    } catch (err) {
      console.error('Failed to add song:', err);
      alert('Failed to add song');
    }
  };

  const voteForTrack = async (trackIndex) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/stream-dj/${channelId}/vote/${trackIndex}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDjState(data.dj);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const playNext = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/stream-dj/${channelId}/next`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDjState(data.dj);
      }
    } catch (err) {
      console.error('Failed to play next:', err);
    }
  };

  const skipTrack = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/stream-dj/${channelId}/skip`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDjState(data.dj);
      }
    } catch (err) {
      console.error('Failed to skip:', err);
    }
  };

  const removeTrack = async (trackIndex) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/stream-dj/${channelId}/queue/${trackIndex}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDjState(data.dj);
      }
    } catch (err) {
      console.error('Failed to remove track:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#1a1a1a' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎵</div>
        <div style={{ fontSize: '20px' }}>Loading Stream DJ...</div>
      </div>
    );
  }

  if (!djState) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#1a1a1a' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <div style={{ fontSize: '20px' }}>Failed to load DJ</div>
      </div>
    );
  }

  const hasVoted = (track) => {
    return user && track.voters && track.voters.includes(user.id);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '36px', color: 'white', margin: 0 }}>
            🎵 Stream DJ
          </h1>
          {onClose && (
            <button onClick={onClose} style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              ← Back
            </button>
          )}
        </div>

        {/* Now Playing */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px', fontWeight: 'bold' }}>
            NOW PLAYING
          </div>
          {djState.currentTrack ? (
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>
                {djState.currentTrack.title}
              </div>
              <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '12px' }}>
                by {djState.currentTrack.artist}
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                Requested by {djState.currentTrack.addedBy}
              </div>
              {isOwner && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button onClick={skipTrack} style={{
                    padding: '10px 20px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    ⏭️ Skip
                  </button>
                  <button onClick={playNext} style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    ▶️ Play Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎵</div>
              <div style={{ fontSize: '18px' }}>No track playing</div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>Add songs to the queue to get started!</div>
            </div>
          )}
        </div>

        {/* Queue Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '24px', color: 'white', margin: 0 }}>
            Queue ({djState.queue.length})
          </h2>
          {user && djState.settings.allowViewerRequests && (
            <button onClick={() => setShowAddSong(true)} style={{
              padding: '12px 24px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              ➕ Add Song
            </button>
          )}
        </div>

        {/* Queue */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {djState.queue.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '60px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎶</div>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>Queue is empty</div>
              <div style={{ fontSize: '14px' }}>Be the first to add a song!</div>
            </div>
          ) : (
            djState.queue.map((track, index) => (
              <div key={index} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: hasVoted(track) ? '2px solid #667eea' : '2px solid transparent'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                      background: '#667eea',
                      color: 'white',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {track.artist}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '44px' }}>
                    Requested by {track.addedByUsername}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Vote Button */}
                  {user && djState.settings.votingEnabled && (
                    <button
                      onClick={() => voteForTrack(index)}
                      style={{
                        padding: '10px 20px',
                        background: hasVoted(track) ? '#667eea' : '#f3f4f6',
                        color: hasVoted(track) ? 'white' : '#1a1a1a',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{hasVoted(track) ? '✓' : '👍'}</span>
                      <span>{track.votes || 0}</span>
                    </button>
                  )}

                  {/* Remove Button (Owner Only) */}
                  {isOwner && (
                    <button
                      onClick={() => removeTrack(index)}
                      style={{
                        padding: '10px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Song Modal */}
        {showAddSong && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#1a1a1a' }}>
                🎵 Add Song to Queue
              </h2>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                  Song Title *
                </label>
                <input
                  type="text"
                  value={newSong.title}
                  onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                  placeholder="Enter song title"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                  Artist *
                </label>
                <input
                  type="text"
                  value={newSong.artist}
                  onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                  placeholder="Enter artist name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                  URL (optional)
                </label>
                <input
                  type="url"
                  value={newSong.url}
                  onChange={(e) => setNewSong({ ...newSong, url: e.target.value })}
                  placeholder="https://youtube.com/..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAddSong(false)} style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  Cancel
                </button>
                <button onClick={addSong} style={{
                  flex: 1,
                  padding: '12px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  Add Song
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StreamDJ;
