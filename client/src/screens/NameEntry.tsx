import { useCallback, useEffect, useRef, useState } from "react"
import socket from "../socket"
import { toast } from "sonner"
import { GameView, Player } from "../types"
import { Plus, LogIn, Zap, User, KeyRound, Dices } from "lucide-react"

interface NameEntryProps {
  onJoined: (data: { code: string; players: Player[] }) => void
  onQuickStart: (gameState: GameView) => void
}

type RoomResponse =
  | { success: true; code: string; players: Player[] }
  | { success: false; error: string }

function NameEntry({ onJoined, onQuickStart }: NameEntryProps) {
  const [name, setName] = useState<string>("")
  const [code, setCode] = useState<string>("")
  const [error, setError] = useState<{ type: string; message: string } | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)

  const handleRoomResponse = useCallback(
    (response: RoomResponse) => {
      if (response.success) {
        onJoined({ code: response.code, players: response.players })
      } else {
        toast.error(response.error ?? "Something went wrong trying to join room")
      }
    },
    [onJoined]
  )

  function createRoom() {
    if (!name.trim()) {
      nameInputRef.current?.focus()
      setError({ type: "name", message: "Please enter your username" })
      return
    }
    socket.emit("createRoom", name.trim(), handleRoomResponse)
    setError(null)
  }

  function joinRoom() {
    if (!name.trim()) {
      nameInputRef.current?.focus()
      setError({ type: "name", message: "Please enter your username" })
      return
    }
    if (code.trim().length !== 4) {
      codeInputRef.current?.focus()
      setError({ type: "code", message: "Room code must be 4 characters" })
      return
    }
    socket.emit("joinRoom", { code: code.trim().toUpperCase(), playerName: name.trim() }, handleRoomResponse)
    setError(null)
  }

  function quickStart() {
    socket.emit("quickStart")
  }

  useEffect(() => {
    socket.on("gameStateUpdate", onQuickStart)
    return () => {
      socket.off("gameStateUpdate", onQuickStart)
    }
  }, [onQuickStart])

  return (
    <div className="min-h-screen bg-lime-300 flex flex-col justify-center items-center p-4 text-foreground relative overflow-hidden select-none">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="flex flex-col border-4 border-black bg-card w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-amber-300 border-b-4 border-black p-5 text-center flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-2 bg-black text-amber-300 px-3 py-1 font-black text-xs uppercase tracking-wider mb-1 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Dices className="w-4 h-4" /> Multiplayer Cards
          </div>
          <h1 className="text-3xl font-black tracking-tight text-black uppercase flex items-center gap-2">
            Crazy Eights 🎴
          </h1>
          <p className="text-xs font-bold text-black/80">Enter your nickname to create or join a table</p>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Username Section */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
              <User className="w-4 h-4 text-primary" /> Your Username
            </label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (code.trim().length === 4 ? joinRoom() : createRoom())
              }
              className="p-3 border-2 border-black font-bold text-base shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-amber-50 focus:outline-none transition-all placeholder:text-muted-foreground/50 placeholder:font-normal bg-background"
              placeholder="e.g. CardShark_99"
              maxLength={16}
            />
            {error && error.type === "name" && (
              <p className="text-xs font-bold text-red-600 bg-red-100 border border-red-500 p-1.5 mt-0.5">
                ⚠️ {error.message}
              </p>
            )}
          </div>

          {/* Create Room Action */}
          <button
            onClick={createRoom}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase tracking-wider text-sm"
          >
            <Plus className="w-5 h-5 stroke-3" /> Create New Room
          </button>

          {/* Divider */}
          <div className="relative flex items-center my-1">
            <div className="grow border-t-2 border-black" />
            <span className="shrink mx-3 text-xs font-black bg-black text-white px-2 py-0.5 uppercase tracking-widest">
              OR JOIN
            </span>
            <div className="grow border-t-2 border-black" />
          </div>

          {/* Join Room Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground">
              <KeyRound className="w-4 h-4 text-accent" /> Room Code
            </label>
            <div className="flex gap-2">
              <input
                ref={codeInputRef}
                value={code.toUpperCase()}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                className="p-3 border-2 border-black font-mono font-black text-lg text-center tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:bg-blue-50 focus:outline-none uppercase w-1/2 bg-background"
                placeholder="ABCD"
                maxLength={4}
              />
              <button
                onClick={joinRoom}
                className="flex-1 flex items-center justify-center gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground font-black p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase text-sm"
              >
                <LogIn className="w-4 h-4 stroke-3" /> Join Table
              </button>
            </div>
            {error && error.type === "code" && (
              <p className="text-xs font-bold text-red-600 bg-red-100 border border-red-500 p-1.5 mt-0.5">
                ⚠️ {error.message}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center my-1">
            <div className="grow border-t-2 border-black" />
            <span className="shrink mx-3 text-xs font-black bg-emerald-400 text-black px-2 py-0.5 uppercase tracking-widest border border-black">
              DEV MODE
            </span>
            <div className="grow border-t-2 border-black" />
          </div>

          {/* Quick Start Action */}
          <button
            onClick={quickStart}
            className="flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer uppercase text-xs tracking-wider"
          >
            <Zap className="w-4 h-4 fill-black" /> Quick Start Vs Bot Opponents
          </button>
        </div>
      </div>
    </div>
  )
}

export default NameEntry
