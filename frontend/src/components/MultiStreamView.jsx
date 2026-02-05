import { useState } from 'react';

function MultiStreamView({ user, onJoinStream }) {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [layout, setLayout] = useState('grid'); // grid, pip, side-by-side

  const availableStreams = [
    { id: 'gaming-fps', name: 'FPS Games', category: 'Gaming', viewers: 1234 },
    { id: 'music-live', name: 'Live Performances', category: 'Music', viewers: 2341 },
    { id: 'tech-coding', name: 'Live Coding', category: 'Tech', viewers: 987 },
    { id: 'sports-live', name: 'Live Sports', category: 'Sports', viewers: 5432 }
  ];

  const addStream = (stream) => {
    if (selectedStreams.length >= 4) {
      alert('Maximum 4 streams allowed');
      return;
    }
    if (!selectedStreams.find(s => s.id === stream.id)) {
      setSelectedStreams([...selectedStreams, stream]);
    }
  };

  const removeStream = (streamId) => {
    setSelectedStreams(selectedStreams.filter(s => s.id !== streamId));
  };

  const getLayoutClass = () => {
    const count = selectedStreams.length;
    if (layout === 'grid') {
      if (count === 1) return 'layout-single';
      if (count === 2) return 'layout-two';
      if (count === 3) return 'layout-three';
      return 'layout-four';
    }
    return `layout-${layout}`;
  };

  return (
    <div className="multi-stream-container">
      <div className="multi-stream-header">
        <h2>📺 Multi-Stream View</h2>
        <div className="layout-controls">
          <button 
            onClick={() => setLayout('grid')} 
            className={`layout-btn ${layout === 'grid' ? 'active' : ''}`}
            title="Grid Layout"
          >
            ⊞
          </button>
          <button 
            onClick={() => setLayout('pip')} 
            className={`layout-btn ${layout === 'pip' ? 'active' : ''}`}
            title="Picture-in-Picture"
          >
            ⊡
          </button>
          <button 
            onClick={() => setLayout('side-by-side')} 
            className={`layout-btn ${layout === 'side-by-side' ? 'active' : ''}`}
            title="Side by Side"
          >
            ⊟
          </button>
        </div>
      </div>

      {selectedStreams.length === 0 ? (
        <div className="no-streams-selected">
          <div className="empty-state">
            <span className="empty-icon">📺</span>
            <h3>No Streams Selected</h3>
            <p>Add up to 4 streams to watch simultaneously</p>
          </div>
          
          <div className="available-streams">
            <h4>Available Streams</h4>
            <div className="streams-list">
              {availableStreams.map(stream => (
                <div key={stream.id} className="stream-option">
                  <div className="stream-info">
                    <h5>{stream.name}</h5>
                    <span className="stream-category">{stream.category}</span>
                    <span className="stream-viewers">👁️ {stream.viewers}</span>
                  </div>
                  <button 
                    onClick={() => addStream(stream)} 
                    className="btn-add-stream"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={`multi-stream-grid ${getLayoutClass()}`}>
            {selectedStreams.map((stream, idx) => (
              <div key={stream.id} className={`stream-window stream-${idx + 1}`}>
                <div className="stream-header">
                  <span className="stream-title">{stream.name}</span>
                  <button 
                    onClick={() => removeStream(stream.id)} 
                    className="btn-remove-stream"
                  >
                    ✕
                  </button>
                </div>
                <div className="stream-placeholder">
                  <div className="placeholder-content">
                    <span className="placeholder-icon">🎥</span>
                    <p>{stream.name}</p>
                    <span className="live-indicator">🔴 LIVE</span>
                  </div>
                </div>
                <div className="stream-footer">
                  <span className="viewers">👁️ {stream.viewers}</span>
                  <span className="category">{stream.category}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedStreams.length < 4 && (
            <div className="add-more-streams">
              <h4>Add More Streams ({selectedStreams.length}/4)</h4>
              <div className="quick-add-list">
                {availableStreams
                  .filter(s => !selectedStreams.find(sel => sel.id === s.id))
                  .map(stream => (
                    <button
                      key={stream.id}
                      onClick={() => addStream(stream)}
                      className="quick-add-btn"
                    >
                      + {stream.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="multi-stream-tips">
        <h4>💡 Pro Tips</h4>
        <ul>
          <li>Click stream title to focus and unmute</li>
          <li>Use layout buttons to change view</li>
          <li>Maximum 4 streams for optimal performance</li>
        </ul>
      </div>
    </div>
  );
}

export default MultiStreamView;
