import { toast } from "sonner"
import socket from "../socket"
import PlayerCard from "./PlayerCard"
import { useCallback } from "react"
import { Card } from "../types"

interface DeckProps {
  count: number
}

type DrawCardResponse = { success: true, event: string, card?: Card } | { success: false, error: string }

function Deck({ count }: DeckProps) {
  const handleDrawCardResponse = useCallback((response: DrawCardResponse) => {
    if (!response.success) {
      toast.error(response.error)
    }
  }, [])
  function drawCard() {
    console.log("card drawn")
    socket.emit("drawCard", handleDrawCardResponse)
  }
  return (
    <div onClick={drawCard} className="flex group cursor-pointer">
      {Array.from({ length: count }).map((_, i) => <PlayerCard key={i} card="back" i={i} overlap={61} hover={i === count - 1} />)}
    </div>
  )
}

export default Deck