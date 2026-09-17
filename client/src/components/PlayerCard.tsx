import type { CSSProperties } from "react"
import {  Club, Diamond, Heart, Spade } from "lucide-react"
import { Card } from "../types"

interface PlayerCardProps {
  card: Card | "back"
  i: number
  onCardClicked?: (i: number) => void
  overlap?: number
  hover?: boolean
  small?: boolean
  isPlayable?: boolean
  isUnplayable?: boolean
}

const suit_symbol = { hearts: Heart, diamonds: Diamond, clubs: Club, spades: Spade }
const suit_color_class = {
  hearts: "text-red-600 fill-red-600",
  diamonds: "text-red-600 fill-red-600",
  clubs: "text-black fill-black",
  spades: "text-black fill-black",
}

function PlayerCard({
  card,
  i,
  onCardClicked,
  overlap,
  hover = false,
  small = false,
  isPlayable = false,
  isUnplayable = false,
}: PlayerCardProps) {
  // Default overlap based on card size if not specified
  const effectiveOverlap = overlap ?? (small ? 18 : 26)

  const cardStyle: CSSProperties = {
    marginLeft: i === 0 ? 0 : `-${effectiveOverlap}px`,
    zIndex: i,
  }

  if (card === "back") {
    return (
      <div
        style={cardStyle}
        className={`bg-amber-400 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none relative flex items-center justify-center transition-all ${
          small ? "w-10 h-14" : "w-14 h-20 md:w-16 md:h-24"
        } ${hover ? "hover:z-50! hover:-translate-y-3 hover:scale-105 cursor-pointer" : ""}`}
      >
        {/* Retro Pattern Inside Card Back */}
        <div className="w-[85%] h-[85%] border border-black/40 bg-amber-300/60 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[6px_6px] opacity-20" />
          <span className="font-black text-xs text-black/60 font-mono">8</span>
        </div>
      </div>
    )
  }

  const Suit = suit_symbol[card.suit]
  const colorClass = suit_color_class[card.suit]

  const isClickable = onCardClicked && !isUnplayable

  return (
    <div
      onClick={isClickable ? () => onCardClicked(i) : undefined}
      style={cardStyle}
      className={`select-none relative flex flex-col justify-between p-1 transition-all rounded ${
        small ? "w-11 h-16 text-xs" : "w-14 h-20 md:w-16 md:h-24 text-sm"
      } ${
        isUnplayable
          ? "bg-neutral-200 border-2 border-neutral-400 opacity-70 grayscale-45 pointer-events-none cursor-not-allowed shadow-none"
          : isPlayable
            ? "bg-white border-2 border-black ring-2 ring-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),0_0_12px_rgba(52,211,153,0.7)] z-20"
            : "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      } ${
        hover && !isUnplayable
          ? "hover:z-50! hover:-translate-y-5 hover:scale-110 cursor-pointer active:translate-y-0"
          : ""
      }`}
    >
      {/* Playable Glowing Indicator Dot */}
      {isPlayable && !small && (
        <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black animate-pulse z-30" />
      )}

      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-center leading-none self-start">
        <span className="font-black text-black">{card.rank}</span>
        <Suit className={`w-3 h-3 ${colorClass}`} />
      </div>

      {/* Center Suit */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Suit className={`${small ? "w-4 h-4" : "w-6 h-6 md:w-7 md:h-7"} ${colorClass}`} />
      </div>

      {/* Bottom Right Rank (inverted orientation indicator) */}
      <div className="flex flex-col items-center leading-none self-end rotate-180">
        <span className="font-black text-black">{card.rank}</span>
        <Suit className={`w-3 h-3 ${colorClass}`} />
      </div>
    </div>
  )
}

export default PlayerCard