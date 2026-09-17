import { Card } from "../types"
import PlayerCard from "./PlayerCard"
import { Heart, Diamond, Club, Spade, Flame } from "lucide-react"

interface DiscardPileProps {
  topCard: Card
  chosenSuit?: string | null
}

const suit_symbol = { hearts: Heart, diamonds: Diamond, clubs: Club, spades: Spade }
const suit_color_class = {
  hearts: "text-red-600 fill-red-600",
  diamonds: "text-red-600 fill-red-600",
  clubs: "text-black fill-black",
  spades: "text-black fill-black",
}

function DiscardPile({ topCard, chosenSuit }: DiscardPileProps) {
  const ChosenIcon = chosenSuit && suit_symbol[chosenSuit as keyof typeof suit_symbol]
  const chosenColor = chosenSuit && suit_color_class[chosenSuit as keyof typeof suit_color_class]

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Label Badge */}
      <div className="bg-black text-white text-[10px] md:text-xs font-black px-2 py-0.5 border border-white/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-1">
        <Flame className="w-3 h-3 text-red-500" /> Discard
      </div>

      {/* Discard Pile Card & Chosen Suit Overlay */}
      <div id="discard-pile-target" className="relative">
        <div>
          <PlayerCard card={topCard} i={0} />
        </div>


        {/* Active Chosen Suit Indicator Badge when 8 was played */}
        {chosenSuit && ChosenIcon && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 z-50 whitespace-nowrap animate-bounce">
            <span className="text-[10px] font-black uppercase text-black">Suit:</span>
            <ChosenIcon className={`w-3.5 h-3.5 ${chosenColor}`} />
          </div>
        )}
      </div>

    </div>
  )
}

export default DiscardPile