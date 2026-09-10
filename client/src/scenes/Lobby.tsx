import { Copy } from "lucide-react";
import { Player } from "../types";
import { useState } from "react";
import Chat from "../components/Chat";
import socket from "../socket";

interface LobbyProps {
  code: string;
  players: Player[];
}
function Lobby({ code, players }: LobbyProps) {
  const [isCopied, setIsCopied] = useState(false)

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);

      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center gap-4 text-foreground">
      <div className="flex flex-col border rounded p-5 gap-3 bg-card w-1/2 max-w-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Lobby</h1>
          <p>
            Code:
            <button onClick={copyRoomCode} className={`font-bold text-lg p-1 cursor-pointer ml-1 ${isCopied ? 'text-green-400' : 'text-primary hover:bg-primary hover:text-primary-foreground'}`}>
              {isCopied ?
                <p className="pr-1">Copied!</p>
                :
                <>
                  <Copy size={18} className="inline mr-2 mb-1" />
                  <span className="tracking-widest">{code}</span>
                </>
              }
            </button>
          </p>
        </div>
        <p className="">Players</p>
        <div className="flex flex-col gap-2">
          {players.map(player =>
            <div key={player.id} className="flex gap-2 items-center ">
              {player.id === socket.id && <img src="hand-right.png" className="w-8"/>}
              <p className={`flex-1 text-secondary-foreground p-1 px-4 shadow-xs ${player.id === socket.id ? 'bg-amber-300' : 'bg-secondary/80'}`}>
                {player.name}
              </p>
            </div>
          )}
        </div>
        <button className="bg-primary text-primary-foreground  p-1">Start Game</button>

      </div>
      <div className="flex flex-col border rounded p-5 gap-3 bg-card w-1/2 max-w-xl">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <Chat />
      </div>
    </div>
  )
}

export default Lobby