# Use Node.js 20 as base (required by Vite 6+)
FROM node:20-alpine

WORKDIR /app

# Copy server and client
COPY server/package*.json ./server/
RUN cd server && npm install

COPY client/package*.json ./client/
RUN cd client && npm install

COPY . .

# Build client
RUN cd client && npm run build

# Install a simple static server for the client
RUN npm install -g serve

EXPOSE 3001 5173

# We will use a script to run both
CMD ["sh", "-c", "cd server && npm start & cd client && serve -s dist -l 5173"]
