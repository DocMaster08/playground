import type { CSSProperties } from "react"
import { CircleQuestionMark, Club, Diamond, Heart, Spade } from "lucide-react"
import { Card } from "../types"

interface PlayerCardProps {
  card: Card | "back"
  i: number,
  overlap?: number
  hover?: boolean
}

const suit_symbol = { "hearts": Heart, "diamonds": Diamond, "clubs": Club, "spades": Spade }
const suit_color = { "hearts": "red", "diamonds": "red", "clubs": "black", "spades": "black" }

function PlayerCard({ card, i, overlap = 32, hover = false }: PlayerCardProps) {
  const Suit = card !== "back" ? suit_symbol[card.suit] : CircleQuestionMark

  const cardStyle: CSSProperties = {
    marginLeft: i === 0 ? 0 : `-${overlap}px`,
    zIndex: i,
  }

  return (
    <>
      {card !== "back" ? (
        <div
          style={cardStyle}
          className={`w-16 h-22 bg-white border rounded flex items-center justify-center gap-2 select-none relative transition-transform ${hover && "hover:z-50! hover:-translate-y-6 hover:scale-105"}`}
        >
          {card.rank}
          <Suit size={18} color={suit_color[card.suit]} fill={suit_color[card.suit]} />
        </div>
      ) : (
        <div
          style={cardStyle}
          className={`w-16 h-22 bg-amber-300 border rounded flex items-center justify-center gap-2 select-none relative ${hover && "hover:z-50! hover:-translate-y-6 hover:scale-105"}`}
        >
          a
        </div>
      )}
    </>
  )
}

export default PlayerCard