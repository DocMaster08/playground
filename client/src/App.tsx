import { Toaster } from "sonner";
import NameEntry from "./scenes/NameEntry";
import { useState } from "react";
import Lobby from "./scenes/Lobby";
import { Player } from "./types";

export default function App() {
  const [screen, setScreen] = useState<'name' | 'lobby' | 'game'>("name");
  const [roomCode, setRoomCode] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  return (
    <div className="font-mono bg-gray-300">
      <Toaster />
      {screen === "name" && <NameEntry onJoined={({ code, players }) => {
        setScreen("lobby");
        setRoomCode(code);
        setPlayers(players);
      }} />}
      {screen === "lobby" && <Lobby />}
    </div>
  );
}
