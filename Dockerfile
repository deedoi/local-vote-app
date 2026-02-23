# Use Node.js 20 as base
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN cd server && npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Create uploads directory for images
RUN mkdir -p server/uploads/questions

# Build client
RUN cd client && npm run build

# Install static server for client
RUN npm install -g serve

EXPOSE 3001 5173

# Run server and serve client
CMD ["sh", "-c", "cd server && npm start & cd client && serve -s dist -l 5173"]
