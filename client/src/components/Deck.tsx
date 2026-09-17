import { toast } from "sonner"
import socket from "../socket"
import PlayerCard from "./PlayerCard"
import { useCallback } from "react"
import { Card } from "../types"
import { Layers, ArrowUp } from "lucide-react"

interface DeckProps {
  count: number
  isYourTurn?: boolean
}

type DrawCardResponse =
  | { success: true; event: string; card?: Card }
  | { success: false; error: string }

function Deck({ count, isYourTurn }: DeckProps) {
  const handleDrawCardResponse = useCallback((response: DrawCardResponse) => {
    if (!response.success) {
      toast.error(response.error)
    }
  }, [])

  function drawCard() {
    socket.emit("drawCard", handleDrawCardResponse)
  }

  const displayCount = Math.min(count, 8)

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      {/* Label Badge */}
      <div className="bg-black text-white text-[10px] md:text-xs font-black px-2 py-0.5 border border-white/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-1">
        <Layers className="w-3 h-3 text-amber-400" /> Deck ({count})
      </div>

      {/* Stacked Cards */}
      <div
        id="deck-pile-target"
        onClick={drawCard}
        className={`relative flex items-center justify-center cursor-pointer transition-all active:scale-90 active:translate-y-2 ${
          isYourTurn ? "animate-pulse scale-105" : "hover:scale-105"
        }`}
        title="Click to draw a card"
      >


        {count > 0 ? (
          <div className="relative">
            {Array.from({ length: displayCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: i === 0 ? "relative" : "absolute",
                  top: `-${i * 2}px`,
                  left: `-${i * 2}px`,
                }}
              >
                <PlayerCard card="back" i={0} />
              </div>
            ))}
            {isYourTurn && (
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-2/3 bg-amber-400 text-black border border-black font-black text-[10px] px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 whitespace-nowrap animate-bounce z-30">
                <ArrowUp className="w-3 h-3 stroke-3" /> DRAW
              </div>
            )}
          </div>
        ) : (
          <div className="w-14 h-20 md:w-16 md:h-24 border-2 border-dashed border-black/40 rounded flex items-center justify-center text-xs font-bold text-black/50">
            EMPTY
          </div>
        )}
      </div>
    </div>
  )
}

export default Deck