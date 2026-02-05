import { useState, useEffect } from 'react';

function WatchParty({ user, roomId, socket }) {
  const [partyCode, setPartyCode] = useState('');
  const [partyMembers, setPartyMembers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('party-created', ({ code, host }) => {
      setPartyCode(code);
      setIsHost(host === user?.username);
    });

    socket.on('party-joined', ({ members }) => {
      setPartyMembers(members);
    });

    socket.on('party-member-left', ({ members }) => {
      setPartyMembers(members);
    });

    return () => {
      socket.off('party-created');
      socket.off('party-joined');
      socket.off('party-member-left');
    };
  }, [socket, user]);

  const createParty = () => {
    if (!user) {
      alert('Please login to create a watch party');
      return;
    }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit('create-party', { roomId, code, host: user.username });
    setShowPartyModal(true);
  };

  const joinParty = () => {
    if (!user) {
      alert('Please login to join a watch party');
      return;
    }
    const code = prompt('Enter Watch Party Code:');
    if (code) {
      socket.emit('join-party', { code, username: user.username });
    }
  };

  const leaveParty = () => {
    socket.emit('leave-party', { partyCode, username: user.username });
    setPartyCode('');
    setPartyMembers([]);
    setShowPartyModal(false);
  };

  return (
    <div className="watch-party-container">
      {!partyCode ? (
        <div className="party-actions">
          <button onClick={createParty} className="btn-party create">
            🎉 Create Watch Party
          </button>
          <button onClick={joinParty} className="btn-party join">
            🎊 Join Watch Party
          </button>
        </div>
      ) : (
        <div className="active-party">
          <div className="party-header">
            <span className="party-badge">🎉 Watch Party Active</span>
            <span className="party-code">Code: {partyCode}</span>
            <button onClick={leaveParty} className="btn-leave-party">Leave</button>
          </div>
          <div className="party-members">
            <h4>👥 Party Members ({partyMembers.length})</h4>
            <div className="members-list">
              {partyMembers.map((member, idx) => (
                <div key={idx} className="member-item">
                  <span className="member-avatar">👤</span>
                  <span className="member-name">{member}</span>
                  {member === user?.username && <span className="you-badge">You</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchParty;
