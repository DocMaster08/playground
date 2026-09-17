import { createPortal } from "react-dom"
import { Club, Diamond, Heart, Spade, Sparkles, X } from "lucide-react"
import { Card } from "../types"

interface SuitPickerProps {
  onSelect: (suit: Card["suit"]) => void
  onCancel: () => void
}

const suits: { suit: Card["suit"]; label: string; Icon: typeof Heart; colorClass: string; bgClass: string }[] = [
  { suit: "hearts", label: "Hearts", Icon: Heart, colorClass: "text-red-600 fill-red-600", bgClass: "hover:bg-red-50" },
  { suit: "diamonds", label: "Diamonds", Icon: Diamond, colorClass: "text-red-600 fill-red-600", bgClass: "hover:bg-red-50" },
  { suit: "clubs", label: "Clubs", Icon: Club, colorClass: "text-black fill-black", bgClass: "hover:bg-neutral-100" },
  { suit: "spades", label: "Spades", Icon: Spade, colorClass: "text-black fill-black", bgClass: "hover:bg-neutral-100" },
]

function SuitPicker({ onSelect, onCancel }: SuitPickerProps) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-sm w-full flex flex-col items-center gap-5 text-foreground relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="bg-amber-300 w-[calc(100%+3rem)] -mx-6 -mt-6 p-3 border-b-2 border-black flex items-center justify-between mb-3">
          <span className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 fill-black" /> CRAZY EIGHT PLAYED!
          </span>
          <button
            onClick={onCancel}
            className="text-black hover:bg-black hover:text-amber-300 p-0.5 border border-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center flex flex-col items-center gap-1">
          <h3 className="text-2xl font-black uppercase tracking-tight">Choose Next Suit</h3>
          <p className="text-xs font-semibold text-muted-foreground">Select which suit the next player must match</p>
        </div>

        {/* Suit Options Grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {suits.map(({ suit, label, Icon, colorClass, bgClass }) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${bgClass}`}
            >
              <Icon className={`w-8 h-8 ${colorClass}`} />
              <span className="font-black text-xs uppercase tracking-wider text-black">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default SuitPicker