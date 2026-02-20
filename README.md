# 📊 Real-Time Voting App

A lightweight, real-time voting application designed for live presentations and interactive sessions. Built with React, Node.js, and Socket.IO.

## ✨ Features

- **Poll Creator:** Create multiple custom questions with up to 4 options each.
- **Persistent Drafts:** Your questions are automatically saved to `localStorage` so you never lose your work on refresh.
- **Real-Time Dashboards:** Live-updating bar charts and voter activity feeds.
- **Word Cloud Mode:** Collect open-ended responses in a dynamic word cloud.
- **Audience Identification:** Collect voter names to see who voted for what in real-time.
- **Mobile Friendly:** Integrated QR Code and network-ready configuration for joining via mobile devices on the same Wi-Fi.
- **Anti-Cheat:** Simple duplicate voting prevention per device.

## 🚀 Tech Stack

- **Frontend:** React (TypeScript), Vite, Vanilla CSS.
- **Backend:** Node.js, Express.
- **Real-Time:** Socket.IO (WebSockets).
- **Icons/UI:** QRCode.react, CSS Grid/Flexbox.

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
You need to run both the server and the client in separate terminals.

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

## 📱 How to join from Mobile (Local Wi-Fi)

1. Ensure your computer and mobile device are on the **same Wi-Fi network**.
2. Find your computer's **IPv4 Address** (Run `ipconfig` in CMD/PowerShell).
3. On your mobile browser, go to `http://YOUR_IP_ADDRESS:5173`.
4. Enter the **6-digit PIN** displayed on the Host Dashboard.

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

## 📝 License
MIT License
