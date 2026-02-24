import { useState, useEffect } from 'react'
import './App.css'
import { socket } from './socket'
import { QRCodeCanvas } from 'qrcode.react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

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

  const fixUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // Already absolute
    // Construct full URL using current session IP
    const host = session.hostIp || window.location.hostname;
    return `http://${host}:3001${url}`;
  };

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
      {currentQuestion.imageUrls && currentQuestion.imageUrls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
          {currentQuestion.imageUrls.map((url: string, i: number) => (
            <img key={i} src={fixUrl(url)} alt={`Question image ${i + 1}`} style={{ maxWidth: '100%', maxHeight: '300px', margin: '0.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          ))}
        </div>
      )}
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
                {String.fromCharCode(65 + index)}: {option}
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

function ResultsView({ session }: { session: any }) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
  
  const chartData = session.questions.map((q: any, i: number) => {
    const votes = session.votes[q.id] || {};
    const mostVotedIndex = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b, '');
    const mostVotedCount = mostVotedIndex !== '' ? votes[mostVotedIndex] : 0;
    return {
      name: (i + 1).toString(),
      votes: mostVotedCount,
      choiceLetter: mostVotedIndex !== '' ? String.fromCharCode(65 + parseInt(mostVotedIndex)) : 'N/A'
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p className="label" style={{ fontWeight: 'bold', margin: 0 }}>{`Quiz ${label}`}</p>
          <p className="intro" style={{ margin: '5px 0' }}>{`Winner: ${payload[0].payload.choiceLetter}`}</p>
          <p className="desc" style={{ margin: 0, color: '#666' }}>{`Votes: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const maxVotes = Math.max(...chartData.map((d: any) => d.votes), 5);

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Final Poll Results</h1>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Vote Counts for Top Choices</h2>
        <div style={{ width: '100%', height: 450 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                label={{ value: 'Quizzes', position: 'insideBottom', offset: -15, style: { fontWeight: 'bold' } }} 
                tick={{ dy: 5 }}
              />
              <YAxis 
                allowDecimals={false} 
                domain={[0, maxVotes]}
                label={{ value: 'Vote Count', angle: -90, position: 'insideLeft', offset: 0, style: { fontWeight: 'bold' } }} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Legend verticalAlign="top" height={45} wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="votes" name="Top Vote per Quiz" barSize={40} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="choiceLetter" position="top" style={{ fontWeight: 'bold', fill: '#333', fontSize: '14px' }} offset={10} />
                {chartData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <button onClick={() => window.location.reload()} style={{ marginTop: '2.5rem', padding: '14px 40px', fontSize: '1.1rem', background: '#1890ff', color: 'white', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(24,144,255,0.4)' }}>Restart New Poll</button>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<'selection' | 'creator' | 'host' | 'audience' | 'results'>('selection')
  const [joinCode, setJoinCode] = useState('')
  const [session, setSession] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(socket.connected)
  
  // Creator State - Load from localStorage if available
  const [customQuestions, setCustomQuestions] = useState(() => {
    const saved = localStorage.getItem('poll_draft');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'bar', question: '', options: ['', '', '', ''], imageUrls: [] }
    ];
  });

  // Save to localStorage whenever questions change
  useEffect(() => {
    localStorage.setItem('poll_draft', JSON.stringify(customQuestions));
  }, [customQuestions]);

  const addQuestion = () => {
    setCustomQuestions([
      ...customQuestions,
      { id: Date.now().toString(), type: 'bar', question: '', options: ['', '', '', ''], imageUrls: [] }
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
    function onPollFinished(data: any) {
      setSession(data.session);
      setRole('results');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('vote_update', onVoteUpdate);
    socket.on('question_changed', onQuestionChanged);
    socket.on('poll_finished', onPollFinished);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('vote_update', onVoteUpdate);
      socket.off('question_changed', onQuestionChanged);
      socket.off('poll_finished', onPollFinished);
    };
  }, []);

  // Auto-join if PIN is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl && role === 'selection' && isConnected) {
      socket.emit('join_session', codeFromUrl, (res: any) => {
        if (res.success) {
          setJoinCode(codeFromUrl);
          setSession(res.session);
          setRole('audience');
        }
      });
    }
  }, [role, isConnected]);

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

  const fixUrl = (url: string) => {
    if (!url || !session?.hostIp) return url;
    if (url.startsWith('http')) {
      // If it's an old full URL with localhost, fix it
      return url.replace('localhost', session.hostIp);
    }
    // Prepend host IP and port to relative paths
    return `http://${session.hostIp}:3001${url}`;
  };

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
    const handleImageUpload = async (qId: string, file: File) => {
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch(`http://${window.location.hostname}:3001/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const { imageUrl } = await res.json();
          setCustomQuestions(customQuestions.map((q: any) => 
            q.id === qId ? { ...q, imageUrls: [...(q.imageUrls || []), imageUrl] } : q
          ));
        } else {
          console.error('Upload failed');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    };

    const removeImage = (qId: string, imageUrlToRemove: string) => {
      setCustomQuestions(customQuestions.map((q: any) =>
        q.id === qId ? { ...q, imageUrls: q.imageUrls.filter((url: string) => url !== imageUrlToRemove) } : q
      ));
    };

    return (
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card">
          <h2>Poll Creator</h2>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            {customQuestions.map((q: any, qIdx: number) => (
              <div key={q.id} className="creator-q-box" style={{ position: 'relative', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <button 
                  onClick={() => setCustomQuestions(customQuestions.filter((_: any, i: number) => i !== qIdx))}
                  style={{ position: 'absolute', right: '10px', top: '10px', padding: '2px 8px', background: '#ff4d4f', color: 'white' }}
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
                  style={{ width: '90%', fontWeight: 'bold', marginBottom: '10px' }}
                />
                <div style={{ marginTop: '0.5rem' }}>
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
                <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id={`file-input-${q.id}`}
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files && handleImageUpload(q.id, e.target.files[0])}
                  />
                  <button onClick={() => document.getElementById(`file-input-${q.id}`)?.click()} style={{ background: '#1890ff', color: 'white' }}>
                    Add Photo
                  </button>
                  <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '10px' }}>
                    {(q.imageUrls || []).map((url: string, i: number) => (
                      <div key={i} style={{ position: 'relative', marginRight: '10px', marginBottom: '10px' }}>
                        <img src={fixUrl(url)} alt={`preview ${i}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                        <button 
                          onClick={() => removeImage(q.id, url)}
                          style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button onClick={addQuestion} style={{ flex: 2, background: '#52c41a', color: 'white' }}>+ Add Question</button>
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to delete ALL questions?')) {
                  setCustomQuestions([{ id: Date.now().toString(), type: 'bar', question: '', options: ['', '', '', ''], imageUrls: [] }]);
                }
              }} 
              style={{ flex: 1, background: '#ff4d4f', color: 'white' }}
            >
              Clear All
            </button>
          </div>
          <button onClick={startSession} style={{ marginTop: '1rem', width: '100%', padding: '12px', fontSize: '1.1rem', background: '#722ed1', color: 'white' }}>Launch Live Session</button>
        </div>
      </div>
    )
  }

  if (role === 'host') {
    const currentQuestion = session.questions[session.activeQuestionIndex];
    const votes = session.votes[currentQuestion.id] || {};
    const details = session.voterDetails?.[currentQuestion.id] || [];
    const joinBase = `http://${session.hostIp}:${window.location.port}`;
    const fullJoinUrl = `${joinBase}/?code=${joinCode}`;
    const totalVotes = details.length;

    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ margin: 0, opacity: 0.8 }}>Join at <a href={fullJoinUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}><strong>{joinBase}</strong></a></h2>
            <h1 style={{ margin: 0, fontSize: '3rem' }}>PIN: <span className="highlight" style={{ color: '#1890ff' }}>{joinCode}</span></h1>
          </div>
          <div className="card" style={{ padding: '10px', margin: 0 }}>
            <QRCodeCanvas value={fullJoinUrl} size={120} />
          </div>
        </header>

        <main style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{currentQuestion.question}</h3>
            <div className="results-container">
              {currentQuestion.options.map((option: string, index: number) => {
                const count = votes[index] || 0;
                const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                return (
                  <div key={index} className="result-bar-wrapper" style={{ marginBottom: '1rem' }}>
                    <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold' }}>{String.fromCharCode(65 + index)}: {option}</span>
                      <span>{count} votes ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="bar-bg" style={{ background: '#f0f0f0', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                      <div className="bar-fill" style={{ width: `${percentage}%`, background: '#1890ff', height: '100%', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            {currentQuestion.imageUrls && currentQuestion.imageUrls.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Question Images</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentQuestion.imageUrls.map((url: string, i: number) => (
                    <img key={i} src={fixUrl(url)} alt={`question-img-${i}`} style={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
              </div>
            )}
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ borderBottom: '2px solid #1890ff', paddingBottom: '10px', marginBottom: '15px' }}>Current Live Responses</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                {currentQuestion.options.map((_opt: string, idx: number) => {
                  const count = votes[idx] || 0;
                  const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', width: '20px' }}>{String.fromCharCode(65 + idx)}</span>
                      <div style={{ flexGrow: 1, background: '#eee', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          background: COLORS[idx % COLORS.length], 
                          height: '100%',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <span style={{ minWidth: '25px', textAlign: 'right', fontSize: '0.9rem' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>

        <footer style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <button onClick={() => socket.emit('prev_question', joinCode)} disabled={session.activeQuestionIndex === 0} style={{ padding: '10px 20px' }}>Previous</button>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Question {session.activeQuestionIndex + 1} of {session.questions.length}</span>
          {session.activeQuestionIndex === session.questions.length - 1 ? (
            <button onClick={() => socket.emit('finish_poll', joinCode)} style={{ padding: '10px 30px', background: '#52c41a', color: 'white' }}>Finalize</button>
          ) : (
            <button onClick={() => socket.emit('next_question', joinCode)} style={{ padding: '10px 30px' }}>Next</button>
          )}
        </footer>
      </div>
    )
  }

  if (role === 'audience') {
    return <AudienceView session={session} joinCode={joinCode} isConnected={isConnected} submitVote={submitVote} />;
  }
  
  if (role === 'results') {
    return <ResultsView session={session} />;
  }

  return null;
}

export default App;
