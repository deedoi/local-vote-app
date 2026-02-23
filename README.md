# 📊 Real-Time Voting App (V1.1)

A professional, lightweight, real-time voting application designed for live presentations and interactive sessions. Built with React, Node.js, and automated network discovery.

## ✨ New in V1.1

- **📸 Image Attachments:** Hosts can now attach one or more images to any question. Participants see these images above their voting choices.
- **🌐 Smart Networking:** Automatically detects the host's physical network IP address. No more manually typing `localhost`.
- **🔗 QR Auto-Join:** Scan the QR code to join instantly. The PIN is embedded in the link for a zero-click entry experience.
- **📈 Professional Results:** A dedicated Final Results page featuring a sleek vertical Bar Chart (built with Recharts) showing winning choices and vote counts per quiz.
- **⚡ Dynamic Host Panel:** Live tracking of current question responses with horizontal progress bars, plus a scrollable history of previous question popularity.

## ✨ Core Features

- **Poll Creator:** Create multiple custom questions with up to 4 options each.
- **Persistent Drafts:** Questions are automatically saved to `localStorage`.
- **Word Cloud Mode:** Collect open-ended responses in a dynamic word cloud.
- **Audience Identification:** Collect voter names to track individual responses.
- **Anti-Cheat:** Browser-based duplicate voting prevention.

## 🚀 Tech Stack

- **Frontend:** React (TypeScript), Vite, Recharts, QRCode.react.
- **Backend:** Node.js, Express, Multer (Multipart Uploads).
- **Real-Time:** Socket.IO (WebSockets).

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/local-vote-app.git
cd local-vote-app
```

### 2. Install Dependencies
**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd ../client
npm install
```

### 3. Run the Application
**Terminal 1 (Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
```

## 📱 How to join from Mobile

1. Ensure your computer and mobile device are on the **same Wi-Fi**.
2. Launch a Live Session from the Poll Creator.
3. On the Host screen, simply scan the **QR Code** or browse to the displayed URL.

## 🐳 Docker Support

### One-liner (Run without cloning!)
If you just want to use the app immediately, run:
```bash
docker run -p 5173:5173 -p 3001:3001 deedoi30/local-vote-app:latest
```

### Build from source
Run the entire stack using Docker Compose:
```bash
docker-compose up --build
```
The app will be available at `http://localhost:5173`.

### Image Uploads Persistence
The Docker configuration includes a volume for the `uploads` folder, ensuring your question images are saved even if the container restarts.

## 📝 License
MIT License
