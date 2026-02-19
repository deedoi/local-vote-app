const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const sessions = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create_session', (questions, callback) => {
    const joinCode = Math.floor(100000 + Math.random() * 900000).toString();
    sessions[joinCode] = {
      hostId: socket.id,
      questions: questions || [
        {
          id: '1',
          type: 'bar',
          question: 'Default Question',
          options: ['Option 1', 'Option 2']
        }
      ],
      activeQuestionIndex: 0,
      votes: {}, // questionId -> { key -> count }
      voterDetails: {} // questionId -> [ { name, option } ]
    };
    socket.join(joinCode);
    callback({ joinCode, session: sessions[joinCode] });
  });

  socket.on('join_session', (joinCode, callback) => {
    if (sessions[joinCode]) {
      socket.join(joinCode);
      callback({ success: true, session: sessions[joinCode] });
    } else {
      callback({ success: false, message: 'Session not found' });
    }
  });

  socket.on('submit_vote', ({ joinCode, questionId, optionIndex, voterName }) => {
    if (sessions[joinCode]) {
      const session = sessions[joinCode];
      
      if (!session.votes[questionId]) session.votes[questionId] = {};
      if (!session.voterDetails[questionId]) session.voterDetails[questionId] = [];

      const key = optionIndex;
      session.votes[questionId][key] = (session.votes[questionId][key] || 0) + 1;
      
      // Save the name and what they voted for
      session.voterDetails[questionId].push({ 
        name: voterName || 'Anonymous', 
        option: session.questions[session.activeQuestionIndex].options[optionIndex] || optionIndex 
      });
      
      io.to(joinCode).emit('vote_update', {
        questionId,
        votes: session.votes[questionId],
        voterDetails: session.voterDetails[questionId]
      });
    }
  });

  socket.on('next_question', (joinCode) => {
    if (sessions[joinCode] && sessions[joinCode].hostId === socket.id) {
      const session = sessions[joinCode];
      if (session.activeQuestionIndex < session.questions.length - 1) {
        session.activeQuestionIndex++;
        io.to(joinCode).emit('question_changed', {
          activeQuestionIndex: session.activeQuestionIndex,
          session: session
        });
      }
    }
  });

  socket.on('prev_question', (joinCode) => {
    if (sessions[joinCode] && sessions[joinCode].hostId === socket.id) {
      const session = sessions[joinCode];
      if (session.activeQuestionIndex > 0) {
        session.activeQuestionIndex--;
        io.to(joinCode).emit('question_changed', {
          activeQuestionIndex: session.activeQuestionIndex,
          session: session
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
