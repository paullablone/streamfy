import { useState, useEffect } from 'react';

function InteractivePoll({ user, roomId, socket }) {
  const [polls, setPolls] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''],
    duration: 60
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('poll-created', (poll) => {
      setPolls(prev => [...prev, poll]);
    });

    socket.on('poll-voted', ({ pollId, results }) => {
      setPolls(prev => prev.map(p => 
        p.id === pollId ? { ...p, results } : p
      ));
    });

    socket.on('poll-ended', ({ pollId }) => {
      setPolls(prev => prev.map(p => 
        p.id === pollId ? { ...p, ended: true } : p
      ));
    });

    return () => {
      socket.off('poll-created');
      socket.off('poll-voted');
      socket.off('poll-ended');
    };
  }, [socket]);

  const createPoll = () => {
    if (!user) {
      alert('Please login to create polls');
      return;
    }
    if (!newPoll.question || newPoll.options.some(o => !o)) {
      alert('Please fill all fields');
      return;
    }

    const poll = {
      id: Date.now(),
      question: newPoll.question,
      options: newPoll.options.map(opt => ({ text: opt, votes: 0 })),
      creator: user.username,
      duration: newPoll.duration,
      ended: false,
      voters: []
    };

    socket.emit('create-poll', { roomId, poll });
    setShowCreatePoll(false);
    setNewPoll({ question: '', options: ['', ''], duration: 60 });
  };

  const vote = (pollId, optionIndex) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }
    socket.emit('vote-poll', { roomId, pollId, optionIndex, username: user.username });
  };

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  return (
    <div className="interactive-poll-container">
      <div className="poll-header">
        <h3>📊 Live Polls & Predictions</h3>
        <button 
          onClick={() => setShowCreatePoll(!showCreatePoll)} 
          className="btn-create-poll"
        >
          {showCreatePoll ? '✕ Cancel' : '➕ Create Poll'}
        </button>
      </div>

      {showCreatePoll && (
        <div className="create-poll-form">
          <input
            type="text"
            placeholder="Poll Question"
            value={newPoll.question}
            onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
            className="poll-question-input"
          />
          
          <div className="poll-options">
            {newPoll.options.map((option, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={option}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="poll-option-input"
              />
            ))}
            {newPoll.options.length < 6 && (
              <button onClick={addOption} className="btn-add-option">
                + Add Option
              </button>
            )}
          </div>

          <div className="poll-duration">
            <label>Duration (seconds):</label>
            <input
              type="number"
              min="10"
              max="300"
              value={newPoll.duration}
              onChange={(e) => setNewPoll({ ...newPoll, duration: parseInt(e.target.value) })}
              className="duration-input"
            />
          </div>

          <button onClick={createPoll} className="btn-submit-poll">
            🚀 Launch Poll
          </button>
        </div>
      )}

      <div className="polls-list">
        {polls.length === 0 ? (
          <div className="no-polls">
            <span className="no-polls-icon">📊</span>
            <p>No active polls. Create one to engage your audience!</p>
          </div>
        ) : (
          polls.map(poll => (
            <div key={poll.id} className={`poll-card ${poll.ended ? 'ended' : 'active'}`}>
              <div className="poll-question">
                <span className="poll-icon">❓</span>
                {poll.question}
              </div>
              <div className="poll-creator">by {poll.creator}</div>
              
              <div className="poll-options-list">
                {poll.options.map((option, idx) => {
                  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(1) : 0;
                  const hasVoted = poll.voters?.includes(user?.username);
                  
                  return (
                    <div key={idx} className="poll-option">
                      <button
                        onClick={() => vote(poll.id, idx)}
                        disabled={poll.ended || hasVoted}
                        className="poll-option-btn"
                      >
                        <div className="option-content">
                          <span className="option-text">{option.text}</span>
                          <span className="option-votes">{percentage}%</span>
                        </div>
                        <div 
                          className="option-bar" 
                          style={{ width: `${percentage}%` }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {poll.ended && (
                <div className="poll-ended-badge">Poll Ended</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InteractivePoll;
