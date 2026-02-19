import { useState, useEffect } from 'react'
import './App.css'
import { socket } from './socket'
import { QRCodeCanvas } from 'qrcode.react'

function AudienceView({ session, joinCode, isConnected, submitVote }: any) {
  const [voterName, setVoterName] = useState(localStorage.getItem('voterName') || '');
  const [isNameSet, setIsNameSet] = useState(!!localStorage.getItem('voterName'));
  const currentQuestion = session.questions[session.activeQuestionIndex];
  const hasVoted = localStorage.getItem(`voted_${joinCode}_${currentQuestion.id}`);
  const [wordInput, setWordInput] = useState('');

  const handleVote = (val: string | number) => {
    submitVote(val, voterName);
    localStorage.setItem(`voted_${joinCode}_${currentQuestion.id}`, 'true');
  }

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterName.trim()) {
      localStorage.setItem('voterName', voterName);
      setIsNameSet(true);
    }
  }

  if (!isNameSet) {
    return (
      <div className="container">
        <div className="card">
          <h2>Enter your name to join</h2>
          <form onSubmit={saveName}>
            <input 
              type="text" 
              placeholder="Your Name" 
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              style={{ width: '80%', marginBottom: '1rem' }}
              required
            />
            <button type="submit" style={{ width: '80%' }}>Continue</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{currentQuestion.question}</h1>
      {hasVoted ? (
        <div className="card">
          <h3>Thanks, {voterName}!</h3>
          <p>Wait for the host to show the next question.</p>
        </div>
      ) : (
        <div className="options-grid">
          {currentQuestion.type === 'bar' ? (
            currentQuestion.options.map((option: string, index: number) => (
              <button key={index} onClick={() => handleVote(index)}>
                {option}
              </button>
            ))
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if(wordInput) handleVote(wordInput); }} style={{ gridColumn: '1 / -1' }}>
              <input 
                type="text" 
                placeholder="Enter a word..." 
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                style={{ width: '100%', marginBottom: '1rem' }}
              />
              <button type="submit" style={{ width: '100%' }}>Submit</button>
            </form>
          )}
        </div>
      )}
      <p style={{ marginTop: '2rem', opacity: 0.6 }}>Connected: {isConnected ? 'Yes' : 'No'}</p>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<'selection' | 'creator' | 'host' | 'audience'>('selection')
  const [joinCode, setJoinCode] = useState('')
  const [session, setSession] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(socket.connected)
  
  // Creator State - Load from localStorage if available
  const [customQuestions, setCustomQuestions] = useState(() => {
    const saved = localStorage.getItem('poll_draft');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'bar', question: '', options: ['', '', '', ''] }
    ];
  });

  // Save to localStorage whenever questions change
  useEffect(() => {
    localStorage.setItem('poll_draft', JSON.stringify(customQuestions));
  }, [customQuestions]);

  const addQuestion = () => {
    setCustomQuestions([
      ...customQuestions,
      { id: Date.now().toString(), type: 'bar', question: '', options: ['', '', '', ''] }
    ]);
  }

  useEffect(() => {
    socket.connect();
    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }
    function onVoteUpdate(data: any) {
      setSession((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          votes: { ...prev.votes, [data.questionId]: data.votes },
          voterDetails: { ...prev.voterDetails, [data.questionId]: data.voterDetails }
        }
      });
    }
    function onQuestionChanged(data: any) { setSession(data.session); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('vote_update', onVoteUpdate);
    socket.on('question_changed', onQuestionChanged);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('vote_update', onVoteUpdate);
      socket.off('question_changed', onQuestionChanged);
    };
  }, []);

  const startSession = () => {
    socket.emit('create_session', customQuestions, (res: any) => {
      setJoinCode(res.joinCode);
      setSession(res.session);
      setRole('host');
    });
  }

  const submitVote = (optionIndex: any, voterName: string) => {
    const questionId = session.questions[session.activeQuestionIndex].id;
    socket.emit('submit_vote', { joinCode, questionId, optionIndex, voterName });
  }

  if (role === 'selection') {
    return (
      <div className="container">
        <h1>Real-time Vote App</h1>
        <div className="card">
          <p style={{ color: isConnected ? 'green' : 'red' }}>Server: {isConnected ? 'Connected' : 'Disconnected'}</p>
          <button onClick={() => setRole('creator')}>Create New Poll</button>
          <hr />
          <form onSubmit={(e: any) => {
            e.preventDefault();
            socket.emit('join_session', joinCode, (res: any) => {
              if (res.success) { setSession(res.session); setRole('audience'); }
              else alert(res.message);
            });
          }}>
            <input type="text" placeholder="PIN" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
            <button type="submit">Join</button>
          </form>
        </div>
      </div>
    )
  }

  if (role === 'creator') {
    return (
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card">
          <h2>Poll Creator</h2>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            {customQuestions.map((q: any, qIdx: number) => (
              <div key={q.id} className="creator-q-box" style={{ position: 'relative' }}>
                <button 
                  onClick={() => setCustomQuestions(customQuestions.filter((_: any, i: number) => i !== qIdx))}
                  style={{ position: 'absolute', right: '10px', top: '10px', padding: '2px 8px', background: '#ff4d4f' }}
                  disabled={customQuestions.length === 1}
                >
                  ✕
                </button>
                <input 
                  placeholder={`Question ${qIdx + 1}`} 
                  value={q.question} 
                  onChange={(e) => {
                    const newQs = [...customQuestions];
                    newQs[qIdx].question = e.target.value;
                    setCustomQuestions(newQs);
                  }}
                  style={{ width: '90%', fontWeight: 'bold' }}
                />
                <div style={{ marginTop: '1rem' }}>
                  {q.options.map((opt: string, oIdx: number) => (
                    <input 
                      key={oIdx}
                      placeholder={`Option ${oIdx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newQs = [...customQuestions];
                        newQs[qIdx].options[oIdx] = e.target.value;
                        setCustomQuestions(newQs);
                      }}
                      style={{ display: 'block', width: '95%', margin: '0.5rem 0' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button onClick={addQuestion} style={{ flex: 2, background: '#52c41a' }}>+ Add Question</button>
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to delete ALL questions?')) {
                  setCustomQuestions([{ id: Date.now().toString(), type: 'bar', question: '', options: ['', '', '', ''] }]);
                }
              }} 
              style={{ flex: 1, background: '#ff4d4f' }}
            >
              Clear All
            </button>
          </div>
          <button onClick={startSession} style={{ marginTop: '1rem', width: '100%' }}>Launch Live Session</button>
        </div>
      </div>
    )
  }

  if (role === 'host') {
    const currentQuestion = session.questions[session.activeQuestionIndex];
    const votes = session.votes[currentQuestion.id] || {};
    const details = session.voterDetails?.[currentQuestion.id] || [];

    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <h2>Join at <strong>{window.location.hostname}:5173</strong></h2>
            <h1>PIN: <span className="highlight">{joinCode}</span></h1>
          </div>
          <QRCodeCanvas value={`${window.location.origin}?code=${joinCode}`} size={100} />
        </header>

        <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          <div className="card">
            <h3>{currentQuestion.question}</h3>
            <div className="results-container">
              {currentQuestion.options.map((option: string, index: number) => {
                const count = votes[index] || 0;
                return (
                  <div key={index} className="result-bar-wrapper">
                    <div className="label-row">
                      <span>{option}</span>
                      <span>{count}</span>
                    </div>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${Math.min(count * 10, 100)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h4>Recent Voters</h4>
            <div style={{ textAlign: 'left', fontSize: '0.9rem' }}>
              {details.slice().reverse().map((v: any, i: number) => (
                <div key={i} style={{ padding: '0.3rem 0', borderBottom: '1px solid #eee' }}>
                  <strong>{v.name}</strong> voted for <em>{v.option}</em>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer style={{ marginTop: '2rem' }}>
          <button onClick={() => socket.emit('prev_question', joinCode)} disabled={session.activeQuestionIndex === 0}>Previous</button>
          <span style={{ margin: '0 1rem' }}>{session.activeQuestionIndex + 1} / {session.questions.length}</span>
          <button onClick={() => socket.emit('next_question', joinCode)} disabled={session.activeQuestionIndex === session.questions.length - 1}>Next</button>
        </footer>
      </div>
    )
  }

  if (role === 'audience') {
    return <AudienceView session={session} joinCode={joinCode} isConnected={isConnected} submitVote={submitVote} />;
  }

  return null;
}

export default App
