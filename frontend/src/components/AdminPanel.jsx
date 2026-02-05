import { useState, useEffect } from 'react';

function AdminPanel({ onClose }) {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const authenticate = () => {
    if (adminKey === 'streamfy-admin-2026') {
      setIsAuthenticated(true);
      localStorage.setItem('adminKey', adminKey);
      loadDashboard();
    } else {
      alert('Invalid admin key');
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('adminKey');
    if (savedKey) {
      setAdminKey(savedKey);
      setIsAuthenticated(true);
      loadDashboard();
    }
  }, []);

  const apiCall = async (endpoint) => {
    const response = await fetch(`http://localhost:3002/api/admin/${endpoint}`, {
      headers: {
        'x-admin-key': adminKey
      }
    });
    return response.json();
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await apiCall('dashboard/stats');
      setStats(data.stats);
      setActivities(data.recentActivities);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('users');
      setUsers(data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const loadChannels = async () => {
    setLoading(true);
    try {
      const data = await apiCall('channels');
      setChannels(data.channels);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
    setLoading(false);
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await apiCall('activities');
      setActivities(data.activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
    setLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'users') loadUsers();
    else if (tab === 'channels') loadChannels();
    else if (tab === 'activities') loadActivities();
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-modal">
          <h2>🔐 Admin Access</h2>
          <input
            type="password"
            placeholder="Enter Admin Key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && authenticate()}
            className="admin-key-input"
          />
          <div className="admin-login-actions">
            <button onClick={authenticate} className="btn-admin-login">
              Login
            </button>
            <button onClick={onClose} className="btn-admin-cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel-container">
        <div className="admin-header">
          <h1>⚙️ Streamfy Admin Panel</h1>
          <button onClick={onClose} className="btn-close-admin">✕</button>
        </div>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            👥 Users
          </button>
          <button 
            className={`admin-tab ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => handleTabChange('channels')}
          >
            📺 Channels
          </button>
          <button 
            className={`admin-tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => handleTabChange('activities')}
          >
            📋 Activities
          </button>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="admin-loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'dashboard' && stats && (
                <div className="dashboard-view">
                  <div className="stats-grid">
                    <div className="stat-card-admin">
                      <div className="stat-icon-admin">👥</div>
                      <div className="stat-info-admin">
                        <h3>{stats.totalUsers}</h3>
                        <p>Total Users</p>
                        <span className="stat-change">+{stats.newUsers} this month</span>
                      </div>
                    </div>
                    <div className="stat-card-admin">
                      <div className="stat-icon-admin">📺</div>
                      <div className="stat-info-admin">
                        <h3>{stats.totalChannels}</h3>
                        <p>Total Channels</p>
                      </div>
                    </div>
                    <div className="stat-card-admin">
                      <div className="stat-icon-admin">✅</div>
                      <div className="stat-info-admin">
                        <h3>{stats.activeUsers}</h3>
                        <p>Active Users</p>
                      </div>
                    </div>
                    <div className="stat-card-admin">
                      <div className="stat-icon-admin">🎁</div>
                      <div className="stat-info-admin">
                        <h3>{stats.totalGifts}</h3>
                        <p>Gifts Sent</p>
                      </div>
                    </div>
                    <div className="stat-card-admin">
                      <div className="stat-icon-admin">📊</div>
                      <div className="stat-info-admin">
                        <h3>{stats.totalPolls}</h3>
                        <p>Polls Created</p>
                      </div>
                    </div>
                    <div className="stat-card-admin">
                      <div className="stat-icon-admin">🎉</div>
                      <div className="stat-info-admin">
                        <h3>{stats.totalWatchParties}</h3>
                        <p>Watch Parties</p>
                      </div>
                    </div>
                    <div className="stat-card-admin">
                      <div className="stat-icon-admin">💰</div>
                      <div className="stat-info-admin">
                        <h3>{stats.totalRevenue.toLocaleString()}</h3>
                        <p>Total Revenue (coins)</p>
                      </div>
                    </div>
                  </div>

                  <div className="recent-activities-admin">
                    <h3>Recent Activities</h3>
                    <div className="activities-list-admin">
                      {activities.slice(0, 10).map((activity, idx) => (
                        <div key={idx} className="activity-item-admin">
                          <span className="activity-icon-admin">
                            {getActivityIcon(activity.type)}
                          </span>
                          <div className="activity-details-admin">
                            <strong>{activity.username || 'Unknown'}</strong>
                            <span>{getActivityText(activity.type)}</span>
                            <span className="activity-time">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="users-view">
                  <h3>All Users ({users.length})</h3>
                  <div className="users-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Coins</th>
                          <th>Status</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user._id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                            <td>{user.stats?.coins || 0}</td>
                            <td>
                              <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'channels' && (
                <div className="channels-view">
                  <h3>All Channels ({channels.length})</h3>
                  <div className="channels-grid-admin">
                    {channels.map(channel => (
                      <div key={channel._id} className="channel-card-admin">
                        <div className="channel-avatar-admin">{channel.avatar}</div>
                        <h4>{channel.name}</h4>
                        <p className="channel-owner-admin">by {channel.ownerUsername}</p>
                        <div className="channel-stats-admin">
                          <span>👥 {channel.stats?.subscribers || 0}</span>
                          <span>👁️ {channel.stats?.totalViews || 0}</span>
                        </div>
                        {channel.isLive && <span className="live-badge-admin">🔴 LIVE</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="activities-view">
                  <h3>All Activities ({activities.length})</h3>
                  <div className="activities-list-admin">
                    {activities.map((activity, idx) => (
                      <div key={idx} className="activity-item-admin detailed">
                        <span className="activity-icon-admin">
                          {getActivityIcon(activity.type)}
                        </span>
                        <div className="activity-details-admin">
                          <strong>{activity.username || 'Unknown'}</strong>
                          <span>{getActivityText(activity.type)}</span>
                          <span className="activity-time">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                          {activity.details && (
                            <pre className="activity-metadata">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(type) {
  const icons = {
    user_signup: '👤',
    user_login: '🔐',
    channel_created: '📺',
    stream_started: '🎥',
    stream_ended: '⏹️',
    gift_sent: '🎁',
    poll_created: '📊',
    poll_voted: '✅',
    watch_party_created: '🎉',
    watch_party_joined: '🎊',
    challenge_completed: '🏆',
    content_uploaded: '📤',
    subscription: '⭐',
    message_sent: '💬'
  };
  return icons[type] || '📋';
}

function getActivityText(type) {
  const texts = {
    user_signup: 'signed up',
    user_login: 'logged in',
    channel_created: 'created a channel',
    stream_started: 'started streaming',
    stream_ended: 'ended stream',
    gift_sent: 'sent a gift',
    poll_created: 'created a poll',
    poll_voted: 'voted in a poll',
    watch_party_created: 'created a watch party',
    watch_party_joined: 'joined a watch party',
    challenge_completed: 'completed a challenge',
    content_uploaded: 'uploaded content',
    subscription: 'subscribed to a channel',
    message_sent: 'sent a message'
  };
  return texts[type] || 'performed an action';
}

export default AdminPanel;
