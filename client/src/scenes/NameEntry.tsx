import { useCallback, useRef, useState } from "react"
import socket from "../socket"
import { toast } from "sonner"
import { Player } from "../types";

interface NameEntryProps {
  onJoined: (data: { code: string, players: Player[] }) => void;
}

type RoomResponse =
  | { success: true; code: string; players: Player[] }
  | { success: false; error: string };

function NameEntry({ onJoined }: NameEntryProps) {
  const [name, setName] = useState<string>("")
  const [code, setCode] = useState<string>("")
  const [error, setError] = useState<{ type: string, message: string } | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const createRoomResult = useCallback((response: RoomResponse) => {

    if (response.success) {
      onJoined({ code: response.code, players: response.players })
    } else {
      toast.error(response.error ?? "Something went wrong trying to create room")
    }
  }, [])

  const joinRoomResult = useCallback((response: RoomResponse) => {
    if (response.success) {
      onJoined({ code: response.code, players: response.players })
    } else {
      toast.error(response.error ?? "Something went wrong trying to join room")
    }
  }, [])

  function createRoom() {
    if (!name) {
      nameInputRef.current?.focus();
      setError({ type: "name", message: "You need to provide a name" })
      return;
    }
    socket.emit("createRoom", name, createRoomResult)
    setError(null)
  }

  function joinRoom() {
    if (!name) {
      nameInputRef.current?.focus();
      setError({ type: "name", message: "You need to provide a name" });
      return;
    }
    if (code.length !== 4) {
      codeInputRef.current?.focus();
      setError({ type: "code", message: "Room code must be 4 characters" });
      return;
    }
    socket.emit("joinRoom", { code, playerName: name }, joinRoomResult);
    setError(null)

  }

  return (
    <div className="flex justify-center items-center min-h-screen text-foreground">
      <div className="flex flex-col border rounded p-5 gap-3 w-1/2 max-w-xl bg-card">
        <p>Username</p>
        <input ref={nameInputRef} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (code.length===4?joinRoom():createRoom())} className="p-2 placeholder:text-foreground/80 border shadow-xs" placeholder="Username" />
        {error && error.type === "name" && <p className="text-red-500">{error.message}</p>}
        <button onClick={createRoom} className="bg-primary p-1 text-primary-foreground">Create Room</button>
        <p className="text-gray-500 text-center font-mono">———————— OR ———————— </p>
        <p>Enter room code</p>
        <input ref={codeInputRef} value={code.toUpperCase()} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (joinRoom())} className="p-2 placeholder:text-foreground/80 border shadow-xs" placeholder="Ex: ABCD" />
        {error && error.type === "code" && <p className="text-red-500">{error.message}</p>}
        <button onClick={joinRoom} className="bg-secondary text-secondary-foreground p-1">Join</button>
      </div>
    </div>
  )
}

export default NameEntry