import { useState, useEffect } from 'react';

function SocialHub({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [watchRooms, setWatchRooms] = useState([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
      loadMatches();
      loadWatchRooms();
    }
  }, [user]);

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/social/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setFriends(data.friends);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/social/friends/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setFriendRequests(data.requests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const loadMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/social/match/find', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setMatches(data.matches);
    } catch (err) {
      console.error('Failed to load matches:', err);
    }
  };

  const loadWatchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/social/watch-together/rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setWatchRooms(data.rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendUsername.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/social/friends/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendUsername })
      });
      const data = await response.json();
      if (data.success) {
        alert('Friend request sent!');
        setFriendUsername('');
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Failed to send request:', err);
      alert('Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (friendshipId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/social/friends/accept/${friendshipId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        loadFriends();
        loadFriendRequests();
      }
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const updateInterests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/social/match/interests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interests,
          favoriteCategories: ['Gaming', 'Music', 'Entertainment']
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Interests updated!');
        loadMatches();
      }
    } catch (err) {
      console.error('Failed to update interests:', err);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest)) {
      setInterests([...interests, newInterest]);
      setNewInterest('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#ffffff',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', color: '#1a1a1a' }}>🌟 Social Hub</h1>
          <button onClick={onClose} style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
          {['friends', 'matches', 'watch-together'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab ? '#667eea' : 'transparent',
                color: activeTab === tab ? 'white' : '#1a1a1a',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab === 'friends' && '👥 Friends'}
              {tab === 'matches' && '💕 Stream Lovers'}
              {tab === 'watch-together' && '🎬 Watch Together'}
            </button>
          ))}
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Add Friend</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  placeholder="Enter username"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <button onClick={sendFriendRequest} style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  Send Request
                </button>
              </div>
            </div>

            {friendRequests.length > 0 && (
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Friend Requests ({friendRequests.length})</h2>
                {friendRequests.map(req => (
                  <div key={req._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{req.requester?.username}</span>
                    <button onClick={() => acceptFriendRequest(req._id)} style={{
                      padding: '8px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}>
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>My Friends ({friends.length})</h2>
              {friends.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  No friends yet. Add some friends to see what they're watching!
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                  {friends.map(friend => (
                    <div key={friend._id} style={{
                      padding: '15px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{friend.username}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        Joined {new Date(friend.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stream Lovers Tab */}
        {activeTab === 'matches' && (
          <div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Your Interests</h2>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add interest (e.g., Gaming, Music)"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <button onClick={addInterest} style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                {interests.map((interest, idx) => (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    background: '#667eea',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    {interest}
                    <button onClick={() => setInterests(interests.filter((_, i) => i !== idx))} style={{
                      marginLeft: '8px',
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer'
                    }}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button onClick={updateInterests} style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}>
                Update & Find Matches
              </button>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Your Matches ({matches.length})</h2>
              {matches.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  Add your interests above to find viewers with similar tastes!
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                  {matches.map(match => (
                    <div key={match.userId} style={{
                      padding: '15px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '2px solid #667eea'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{match.username}</div>
                        <div style={{
                          padding: '4px 8px',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {match.matchScore}% Match
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                        Common interests: {match.commonInterests.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Watch Together Tab */}
        {activeTab === 'watch-together' && (
          <div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Active Watch Rooms ({watchRooms.length})</h2>
              {watchRooms.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                  No active watch rooms. Create one from any video to watch with friends!
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {watchRooms.map(room => (
                    <div key={room.roomId} style={{
                      padding: '20px',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '2px solid #667eea'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                            {room.streamTitle}
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            Hosted by {room.hostName}
                          </div>
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}>
                          {room.participants.length} watching
                        </div>
                      </div>
                      <button style={{
                        padding: '10px 20px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}>
                        Join Room
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialHub;
