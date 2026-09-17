import { Copy, Check, Users, Play, MessageSquare, Crown } from "lucide-react"
import { GameView, Player } from "../types"
import { useCallback, useEffect, useState } from "react"
import Chat from "../components/Chat"
import socket from "../socket"
import { toast } from "sonner"

interface LobbyProps {
  code: string
  players: Player[]
  onGameStart: (gameState: GameView) => void
}

type StartGameResponse = { success: true } | { success: false; error: string }

function Lobby({ code, players, onGameStart }: LobbyProps) {
  const [isCopied, setIsCopied] = useState(false)
  const isHost = players.length > 0 && players[0]?.id === socket.id

  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      toast.success("Room code copied to clipboard!")
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const handleStartGameResponse = useCallback((response: StartGameResponse) => {
    if (!response.success) {
      toast.error(response.error ?? "Something went wrong trying to start game")
    }
  }, [])

  function startGame() {
    socket.emit("startGame", handleStartGameResponse)
  }

  useEffect(() => {
    socket.on("gameStateUpdate", onGameStart)
    return () => {
      socket.off("gameStateUpdate", onGameStart)
    }
  }, [onGameStart])

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col justify-center items-center p-4 text-foreground relative overflow-hidden select-none">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] bg-size:[16px_16px] pointer-events-none" />

      <div className="w-full max-w-xl flex flex-col gap-6 relative z-10">
        {/* Main Lobby Card */}
        <div className="flex flex-col border-4 border-black bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Header */}
          <div className="bg-amber-300 border-b-4 border-black p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 tracking-wider mb-1">
                <Users className="w-3 h-3" /> GAME LOBBY
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                Crazy Eights Table 🎴
              </h1>
            </div>

            {/* Room Code Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-black/80">Code:</span>
              <button
                onClick={copyRoomCode}
                className="group flex items-center gap-2 bg-white text-black border-2 border-black font-mono font-black text-xl px-3 py-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-100 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Click to copy room code"
              >
                <span className="tracking-widest">{code}</span>
                {isCopied ? (
                  <Check className="w-5 h-5 text-emerald-600 stroke-3" />
                ) : (
                  <Copy className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>
          </div>

          {/* Players List Container */}
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-primary" /> Connected Players ({players.length}/8)
              </h2>
              {players.length < 2 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-400 px-2 py-0.5 animate-pulse">
                  Waiting for at least 2 players...
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              {players.map((player, index) => {
                const isSelf = player.id === socket.id
                const isRoomHost = index === 0

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                      isSelf ? "bg-blue-50 font-bold" : "bg-background font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-amber-300 border border-black font-black text-sm text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base text-foreground font-bold">{player.name}</span>
                        {isSelf && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 uppercase tracking-wide border border-black">
                            YOU
                          </span>
                        )}
                        {isRoomHost && (
                          <span className="inline-flex items-center gap-1 bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 uppercase tracking-wide border border-black">
                            <Crown className="w-3 h-3 fill-black" /> HOST
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
                      <span className="text-[11px] font-extrabold uppercase text-emerald-700">Ready</span>
                    </div>

                  </div>
                )
              })}
            </div>

            {/* Start Game Action Button */}
            <div className="pt-2">
              <button
                onClick={startGame}
                disabled={players.length < 2 || !isHost}
                className="w-full flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black py-4 px-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase tracking-wider text-lg disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6 fill-black stroke-black" />
                {!isHost
                  ? "Waiting for host to start..."
                  : players.length < 2
                  ? "Need at least 2 players to start"
                  : "Start Game Now!"}
              </button>
            </div>
          </div>
        </div>

        {/* Room Chat Card */}
        <div className="flex flex-col border-4 border-black bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 gap-3">
          <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
            <MessageSquare className="w-4 h-4 text-accent" /> Table Chat
          </h2>
          <Chat />
        </div>
      </div>
    </div>
  )
}

export default Lobby
