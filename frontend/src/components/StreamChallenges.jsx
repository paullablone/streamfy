import { useState, useEffect } from 'react';

function StreamChallenges({ user, socket }) {
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [userProgress, setUserProgress] = useState({});

  const availableChallenges = [
    {
      id: 'first-stream',
      title: 'First Stream',
      description: 'Complete your first stream',
      icon: '🎬',
      reward: 100,
      type: 'beginner'
    },
    {
      id: 'chat-master',
      title: 'Chat Master',
      description: 'Send 100 chat messages',
      icon: '💬',
      reward: 250,
      type: 'social',
      target: 100
    },
    {
      id: 'gift-giver',
      title: 'Gift Giver',
      description: 'Send 10 virtual gifts',
      icon: '🎁',
      reward: 500,
      type: 'supporter',
      target: 10
    },
    {
      id: 'poll-creator',
      title: 'Poll Master',
      description: 'Create 5 interactive polls',
      icon: '📊',
      reward: 300,
      type: 'engagement',
      target: 5
    },
    {
      id: 'party-host',
      title: 'Party Host',
      description: 'Host 3 watch parties',
      icon: '🎉',
      reward: 400,
      type: 'social',
      target: 3
    },
    {
      id: 'loyal-viewer',
      title: 'Loyal Viewer',
      description: 'Watch streams for 10 hours',
      icon: '⏰',
      reward: 1000,
      type: 'dedication',
      target: 600 // minutes
    },
    {
      id: 'multi-tasker',
      title: 'Multi-Tasker',
      description: 'Use multi-stream view 5 times',
      icon: '📺',
      reward: 350,
      type: 'explorer',
      target: 5
    },
    {
      id: 'super-supporter',
      title: 'Super Supporter',
      description: 'Send gifts worth 10,000 coins',
      icon: '💎',
      reward: 2000,
      type: 'supporter',
      target: 10000
    }
  ];

  useEffect(() => {
    if (!socket || !user) return;

    // Load user progress
    socket.emit('get-user-progress', { username: user.username });

    socket.on('user-progress', (progress) => {
      setUserProgress(progress);
    });

    socket.on('challenge-completed', (challenge) => {
      setAchievements(prev => [...prev, challenge]);
      // Show notification
      showNotification(`🎉 Challenge Completed: ${challenge.title}!`);
    });

    return () => {
      socket.off('user-progress');
      socket.off('challenge-completed');
    };
  }, [socket, user]);

  const showNotification = (message) => {
    // Simple notification - could be enhanced with a toast library
    alert(message);
  };

  const getProgress = (challengeId, target) => {
    const current = userProgress[challengeId] || 0;
    return Math.min((current / target) * 100, 100);
  };

  const isCompleted = (challengeId) => {
    return achievements.some(a => a.id === challengeId);
  };

  return (
    <div className="stream-challenges-container">
      <div className="challenges-header">
        <h2>🏆 Challenges & Achievements</h2>
        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-icon">🎯</span>
            <span className="stat-value">{achievements.length}/{availableChallenges.length}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">💰</span>
            <span className="stat-value">
              {achievements.reduce((sum, a) => sum + a.reward, 0)}
            </span>
            <span className="stat-label">Coins Earned</span>
          </div>
        </div>
      </div>

      <div className="challenges-tabs">
        <button className="tab-btn active">All Challenges</button>
        <button className="tab-btn">Completed</button>
        <button className="tab-btn">In Progress</button>
      </div>

      <div className="challenges-grid">
        {availableChallenges.map(challenge => {
          const completed = isCompleted(challenge.id);
          const progress = challenge.target ? getProgress(challenge.id, challenge.target) : 0;

          return (
            <div 
              key={challenge.id} 
              className={`challenge-card ${completed ? 'completed' : ''} ${challenge.type}`}
            >
              <div className="challenge-icon">{challenge.icon}</div>
              <div className="challenge-content">
                <h3>{challenge.title}</h3>
                <p>{challenge.description}</p>
                
                {challenge.target && !completed && (
                  <div className="challenge-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {userProgress[challenge.id] || 0} / {challenge.target}
                    </span>
                  </div>
                )}

                <div className="challenge-footer">
                  <span className="challenge-reward">
                    💰 {challenge.reward} coins
                  </span>
                  {completed && (
                    <span className="completed-badge">✓ Completed</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="achievements-showcase">
        <h3>🏅 Recent Achievements</h3>
        <div className="achievements-list">
          {achievements.length === 0 ? (
            <p className="no-achievements">
              Complete challenges to earn achievements!
            </p>
          ) : (
            achievements.slice(-5).reverse().map((achievement, idx) => (
              <div key={idx} className="achievement-item">
                <span className="achievement-icon">{achievement.icon}</span>
                <div className="achievement-info">
                  <strong>{achievement.title}</strong>
                  <span className="achievement-reward">+{achievement.reward} coins</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default StreamChallenges;
