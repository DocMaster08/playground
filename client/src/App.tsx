import { Toaster, toast } from "sonner";
import NameEntry from "./screens/NameEntry";
import { useEffect, useState } from "react";
import Lobby from "./screens/Lobby";
import { GameView, Player } from "./types";
import socket from "./socket";
import GameBoard from "./screens/GameBoard";

export default function App() {
  const [screen, setScreen] = useState<'name' | 'lobby' | 'game'>("name");
  const [roomCode, setRoomCode] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameView|null>(null)

  useEffect(() => {
    function handlePlayerJoined(data: { players: Player[]; newPlayer: string }) {
      setPlayers(data.players);
      toast.info(`${data.newPlayer} joined the room`);
    }

    function handlePlayerLeft(data: { players: Player[]; leftPlayer: string }) {
      setPlayers(data.players);
      toast.info(`${data.leftPlayer} left the room`);
    }

    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    

    return () => {
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
    };
  }, []);

  return (
    <div className="bg-background">
      <Toaster />
      {screen === "name" && <NameEntry onJoined={({ code, players }) => {
        setScreen("lobby");
        setRoomCode(code);
        setPlayers(players);
      }} />}
      {screen === "lobby" && <Lobby code={roomCode} players={players} onGameStart={(gameState) => {
        setScreen("game")
        setGameState(gameState)
        }} />}
      {screen === "game" && gameState && <GameBoard gameState={gameState} />}
    </div>
  );
}

