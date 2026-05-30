# Task Manager 🚀

## 🌐 Live Demo
You can try out the live version of this application here: **[Live Demo Link](https://moody-comics-shake.loca.lt)**

*(Note: The live demo is hosted via a secure localtunnel. If you see a "Localtunnel Reminder" page, simply click the blue "Click to Continue" button to view the app!)*

A modern, full-stack Task Management application built with React, Node.js, and real-time WebSockets.

## 🌟 Features
- **Real-Time Updates**: Instantly see new tasks and edits across multiple devices using `Socket.io`.
- **Secure Authentication**: Full JWT-based user registration and login system with secure password hashing.
- **Dynamic Dashboard**: Track your productivity with live statistics (Total Tasks, Pending, In Progress).
- **Task Filtering**: Quickly sort your tasks by status using interactive filter tabs.
- **Premium Dark Mode UI**: A beautifully crafted, responsive dark theme with sleek micro-animations.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), React Router, Axios, CSS Modules
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: SQLite
- **Security**: JSON Web Tokens (JWT), bcryptjs

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine

### 1. Backend Setup
Navigate to the server directory, install dependencies, and start the server:
```bash
cd server
npm install
node index.js
```
*The backend server will run on `http://localhost:5005`.*

### 2. Frontend Setup
Open a new terminal, navigate to the client directory, install dependencies, and start the development server:
```bash
cd client
npm install
npm run dev
```
*The frontend application will run on `http://localhost:5173` (or `5174` if port is in use).*

## 💡 Usage
1. Open the application in your browser.
2. Create a new account or log in.
3. Start creating, editing, and managing your tasks from the dashboard!
