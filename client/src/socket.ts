import { io } from 'socket.io-client';

// In dev, Vite proxies /socket.io to localhost:3000
// In production, the server serves the built React app directly
const socket = io();

export default socket;
