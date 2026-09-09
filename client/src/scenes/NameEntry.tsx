import { useCallback, useState } from "react"
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
  const [name, setName] = useState("")
  const [code, setCode] = useState("")

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
    if (!name) return toast.error("You need to put a name");
    socket.emit("createRoom", name, createRoomResult)
  }

  function joinRoom() {
    if (!name) return toast.error("You need to put a name");
    if (code.length !== 4) return toast.error("Room code must be 4 characters");
    socket.emit("joinRoom", { code, playerName: name }, joinRoomResult)
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col border rounded-md p-5 gap-3 bg-base">
        <p>Username</p>
        <input value={name} onChange={(e) => setName(e.target.value)} className="p-2 bg-accent rounded text-accent-foreground placeholder:text-accent-foreground/80 border border-black" placeholder="Username" />
        <button onClick={createRoom} className="bg-primary p-1 rounded text-primary-foreground  border border-black">Create Room</button>
        <p className="text-gray-500 text-center px-20">———————— OR ———————— </p>
        <p>Enter room code</p>
        <input value={code.toUpperCase()} onChange={(e) => setCode(e.target.value)} className="p-2 bg-accent rounded text-accent-foreground placeholder:text-accent-foreground/80  border border-black" placeholder="Ex: ABCD" />
        <button onClick={joinRoom} className="bg-secondary text-secondary-foreground p-1 rounded  border border-black">Join</button>
      </div>
    </div>
  )
}

export default NameEntry