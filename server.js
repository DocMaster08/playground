const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const game = require('./game')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
    }
})

// Serve the client HTML
app.use(express.static(path.join(__dirname, 'public')));

// ── Game rooms state ──────────────────────────────
// In-memory store: { roomCode: { players: [{ id, name }], gameState:{} } }
const rooms = {}

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = ''
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

function broadcastGameState(roomCode) {
    const room = rooms[roomCode]
    if (!room || !room.gameState) return;

    for (const player of room.players) {
        const view = game.getPlayerView(room.gameState, player.id, room.players)
        io.to(player.id).emit("gameStateUpdate", view)
    }
}

// ── Socket.IO connection handler ──────────────────
io.on('connection', (socket) => {
    console.log(`⚡ Connected: ${socket.id}`)

    // ── Create a room ──
    socket.on('createRoom', (playerName, callback) => {
        const code = generateRoomCode()
        rooms[code] = { players: [{ id: socket.id, name: playerName }] }
        socket.join(code);
        socket.data.room = code
        socket.data.name = playerName

        console.log(`🏠 Room ${code} created by ${playerName}`);

        // Send confirmation back to the creator
        callback({ success: true, code, players: rooms[code].players })
    });

    socket.on('joinRoom', (data, callback) => {
        const { code, playerName } = data
        const room = rooms[code]

        if (!room) {
            return callback({ success: false, error: "Room not found" })
        }
        if (room.players.length >= 8) {
            return callback({ success: false, error: "Room is full" })
        }
        if (room.gameState && room.gameState.phase === 'PLAYING') {
            return callback({ success: false, error: 'Game already in progress' });
        }

        for (const player of room.players) {
            if (player.name === playerName) {
                return callback({ success: false, error: "Username already used, try another one." })
            }
        }

        room.players.push({ id: socket.id, name: playerName })
        socket.join(code)
        socket.data.room = code
        socket.data.name = playerName

        console.log(`👋 ${playerName} joined room ${code}`);

        // Tell everyone in the room about the new player
        io.to(code).emit('playerJoined', {
            players: room.players,
            newPlayer: playerName,
        });

        callback({ success: true, code, players: room.players });
    })

    // Start game
    socket.on('startGame', (callback) => {
        const code = socket.data.room
        const room = rooms[code]

        if (!room) return callback({ success: false, error: "Room not found" });
        if (room.players.length < 2) return callback({ success: false, error: "Need at least 2 players" });
        if (room.gameState && room.gameState === "PLAYING") return callback({ success: false, error: "Game already started" });

        // init game state
        const playerIds = room.players.map(p => p.id);
        room.gameState = game.initGame(playerIds)

        console.log(`🎴 Game started in room ${code}`);
        broadcastGameState(code);
        callback({ success: true });
    })

    // Play a card
    socket.on('playCard', (data, callback) => {
        const code = socket.data.room;
        const room = rooms[code];
        if (!room || !room.gameState) return;

        const result = game.playCard(room.gameState, socket.id, data.cardIndex, data.chosenSuit || null)
        if (!result.success) return callback(result);

        console.log(`🃏 ${socket.data.name} played a card in ${code}`)

        if (result.event === "GAME_OVER") {
            const winnerName = room.players.find(p => p.id === socket.id)?.name;
            console.log(`🏆 ${winnerName} won in room ${code}!`)
        }

        broadcastGameState(code);
        callback(result)
    })

    // Draw a card
    socket.on('drawCard', (callback) => {
        const code = socket.data.room;
        const room = rooms[code];
        if (!room || !room.gameState) return;

        const result = game.drawCard(room.gameState, socket.id)
        if (!result.success) return callback(result);

        console.log(`📥 ${socket.data.name} drew a card in ${code}`);
        broadcastGameState(code);
        callback(result);
    })

    // Play again
    socket.on('playAgain', () => {
        const code = socket.data.room;
        const room = rooms[code];
        if (!room || !room.gameState) return;

        room.gameState = null;
        io.to(code).emit('returnToLobby', { players: room.players });
    })


    // ── Chat ──
    socket.on('chatMessage', (message) => {
        const room = socket.data.room;
        if (!room) return;

        io.to(room).emit('chatMessage', {
            id: socket.id,
            from: socket.data.name,
            message,
            timestamp: Date.now(),
        });
    });

    socket.on('typing', () => {
        const room = socket.data.room;
        if (!room) return;

        io.to(room).emit('typing', {
            id: socket.id,
            from: socket.data.name
        })
    })

    socket.on('stopTyping', () => {
        const room = socket.data.room;
        if (!room) return;

        io.to(room).emit('stopTyping', {
            id: socket.id,
            from: socket.data.name
        })
    })

    socket.on('disconnect', () => {
        const code = socket.data.room;
        if (code && rooms[code]) {
            rooms[code].players = rooms[code].players.filter(
                (p) => p.id !== socket.id
            );
            console.log(`💨 ${socket.data.name} left room ${code}`);

            if (rooms[code].players.length === 0) {
                delete rooms[code];
                console.log(`🗑️  Room ${code} deleted (empty)`);
            } else {
                io.to(code).emit('playerLeft', {
                    players: rooms[code].players,
                    leftPlayer: socket.data.name,
                });
                // If game was in progress, broadcast updated state
                if (rooms[code].gameState) {
                    broadcastGameState(code);
                }
            }
        }
    });
});



const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`\n🎮 Playground server running at http://localhost:${PORT}\n`)
})