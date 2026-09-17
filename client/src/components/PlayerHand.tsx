import { useCallback, useMemo, useState } from "react"
import socket from "../socket"
import { Card } from "../types"
import PlayerCard from "./PlayerCard"
import SuitPicker from "./SuitPicker"
import { toast } from "sonner"
import { Sparkles, ArrowUpDown, Layers } from "lucide-react"

export type PositionKey =
  | "bottom"
  | "top"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"

interface PlayerHandProps {
  playerId: string
  hand?: Card[]
  cardCount: number
  name: string
  positionKey: PositionKey
  yourTurn: boolean
  isSelf: boolean
  drawingCardIndex?: number | null
  topCard?: Card | null
  chosenSuit?: string | null
}

type PlayCardResponse =
  | { success: true; event: string }
  | { success: false; error: string }

const SUIT_ORDER: Record<string, number> = { hearts: 0, diamonds: 1, clubs: 2, spades: 3 }
const RANK_ORDER: Record<string, number> = {
  "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13
}

export function isValidPlay(card: Card, topCard?: Card | null, chosenSuit?: string | null): boolean {
  if (card.rank === "8") return true
  if (chosenSuit) return card.suit === chosenSuit
  if (!topCard) return true
  return card.rank === topCard.rank || card.suit === topCard.suit
}

const positionClasses: Record<PositionKey, string> = {
  bottom: "-bottom-6 left-1/2 -translate-x-1/2 flex-col items-center max-w-[95vw]",
  top: "-top-3 left-1/2 -translate-x-1/2 flex-col-reverse items-center",
  left: "left-2 md:left-5 top-1/2 -translate-y-1/2 flex-col items-center",
  right: "right-2 md:right-5 top-1/2 -translate-y-1/2 flex-col items-center",
  "top-left": "top-2 left-4 md:left-12 flex-col items-start",
  "top-right": "top-2 right-4 md:right-12 flex-col items-end",
  "bottom-left": "bottom-2 left-4 md:left-12 flex-col-reverse items-start",
  "bottom-right": "bottom-2 right-4 md:right-12 flex-col-reverse items-end",
}

function PlayerHand({
  playerId,
  hand,
  cardCount,
  name,
  positionKey,
  yourTurn,
  isSelf,
  drawingCardIndex,
  topCard,
  chosenSuit,
}: PlayerHandProps) {
  const [pendingEightIndex, setPendingEightIndex] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"none" | "suit" | "rank">("none")

  const handlePlayCardResponse = useCallback((response: PlayCardResponse) => {
    if (!response.success) {
      toast.error(response.error)
    }
  }, [])

  function playCard(i: number, chosenSuitParam: Card["suit"] | null = null) {
    socket.emit("playCard", { cardIndex: i, chosenSuit: chosenSuitParam }, handlePlayCardResponse)
  }

  // Sorted hand representation for display
  const displayHand = useMemo(() => {
    if (!hand) return []
    if (sortBy === "none") return hand

    const copy = [...hand]
    if (sortBy === "suit") {
      copy.sort((a, b) => {
        const suitDiff = (SUIT_ORDER[a.suit] ?? 0) - (SUIT_ORDER[b.suit] ?? 0)
        if (suitDiff !== 0) return suitDiff
        return (RANK_ORDER[a.rank] ?? 0) - (RANK_ORDER[b.rank] ?? 0)
      })
    } else if (sortBy === "rank") {
      copy.sort((a, b) => {
        const rankDiff = (RANK_ORDER[a.rank] ?? 0) - (RANK_ORDER[b.rank] ?? 0)
        if (rankDiff !== 0) return rankDiff
        return (SUIT_ORDER[a.suit] ?? 0) - (SUIT_ORDER[b.suit] ?? 0)
      })
    }
    return copy
  }, [hand, sortBy])

  const hasPlayableCards = useMemo(() => {
    if (!yourTurn || !hand) return false
    return hand.some((c) => isValidPlay(c, topCard, chosenSuit))
  }, [yourTurn, hand, topCard, chosenSuit])

  function handleCardClicked(displayIdx: number) {
    const card = displayHand[displayIdx]
    if (!card || !hand) return

    // Find original index in unsorted hand
    const originalIndex = hand.findIndex(
      (c) => c.rank === card.rank && c.suit === card.suit
    )
    if (originalIndex === -1) return

    if (card.rank === "8") {
      setPendingEightIndex(originalIndex)
      return
    }
    playCard(originalIndex)
  }

  const containerClass = positionClasses[positionKey]

  return (
    <div
      id={`player-seat-${playerId}`}
      className={`absolute z-20 flex gap-1.5 transition-all ${containerClass}`}
    >
      {/* Player Header Badge */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
          yourTurn
            ? "bg-amber-300 ring-2 ring-amber-500 animate-pulse scale-105"
            : isSelf
              ? "bg-blue-100"
              : "bg-white/95"
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center bg-black text-white text-[10px] font-black">
          {name.slice(0, 2).toUpperCase()}
        </div>

        <span className="font-bold text-xs max-w-22.5 truncate text-black">{name}</span>

        {isSelf && (
          <span className="text-[9px] font-black bg-primary text-primary-foreground px-1 border border-black uppercase">
            YOU
          </span>
        )}

        {!isSelf && (
          <span className="text-[10px] font-extrabold bg-muted text-foreground px-1 border border-black">
            {cardCount}🎴
          </span>
        )}
      </div>

      {/* Turn Prompt for Local Player */}
      {yourTurn && isSelf && (
        <div
          className={`inline-flex items-center gap-1 text-black px-2 py-0.5 border border-black text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce ${
            hasPlayableCards ? "bg-emerald-400" : "bg-amber-400"
          }`}
        >
          {hasPlayableCards ? (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-black" /> YOUR TURN! SELECT A CARD
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-black" /> NO PLAYABLE CARDS! DRAW FROM DECK
            </>
          )}
        </div>
      )}

      {/* Local Player Controls & Sorting Bar */}
      {isSelf && hand && hand.length > 1 && (
        <div className="relative z-30 flex items-center gap-1 bg-black/70 backdrop-blur-xs px-2 py-0.5 border border-white/30 shadow-md">
          <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1 mr-0.5 select-none pointer-events-none">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <button
            type="button"
            onClick={() => setSortBy(sortBy === "suit" ? "none" : "suit")}
            className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-0.5 relative z-30 pointer-events-auto ${
              sortBy === "suit"
                ? "bg-amber-300 text-black ring-1 ring-black scale-105"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            <span className="pointer-events-none">Suit</span>
            <span className="text-[9px] pointer-events-none">♠️</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy(sortBy === "rank" ? "none" : "rank")}
            className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center gap-0.5 relative z-30 pointer-events-auto ${
              sortBy === "rank"
                ? "bg-amber-300 text-black ring-1 ring-black scale-105"
                : "bg-white text-black hover:bg-neutral-100"
            }`}
          >
            <span className="pointer-events-none">Rank</span>
            <span className="text-[9px] pointer-events-none">#</span>
          </button>
          {sortBy !== "none" && (
            <button
              type="button"
              onClick={() => setSortBy("none")}
              className="text-[9px] font-bold text-white/80 hover:text-white underline ml-1 cursor-pointer relative z-30 pointer-events-auto"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Cards Render */}
      {isSelf && hand ? (
        /* Local Player Interactive Hand */
        <div
          id={`player-hand-container-${playerId}`}
          className="flex p-1 pt-8 -mt-6 max-w-[95vw] sm:max-w-none items-center relative overflow-visible"
        >
          {displayHand.map((card, i) => {
            const isCurrentlyDrawing = drawingCardIndex === i
            const valid = isValidPlay(card, topCard, chosenSuit)
            const isPlayable = yourTurn && valid
            const isUnplayable = yourTurn && !valid

            return (
              <div
                key={`${card.rank}-${card.suit}-${i}`}
                id={`hand-card-slot-${playerId}-${i}`}
                style={{ zIndex: i }}
                className={isCurrentlyDrawing ? "opacity-0 pointer-events-none" : "opacity-100"}
              >
                <PlayerCard
                  card={card}
                  i={i}
                  onCardClicked={handleCardClicked}
                  hover={yourTurn && !isCurrentlyDrawing && isPlayable}
                  isPlayable={isPlayable}
                  isUnplayable={isUnplayable}
                />
              </div>
            )
          })}
        </div>
      ) : (
        /* Opponent Stacked Cards */
        <div
          id={`player-hand-container-${playerId}`}
          className="flex items-center relative"
        >
          {Array.from({ length: Math.min(cardCount, 6) }).map((_, i) => {
            const isCurrentlyDrawing = drawingCardIndex === i
            return (
              <div
                key={`${name}-${i}`}
                id={`hand-card-slot-${playerId}-${i}`}
                style={{ zIndex: i }}
                className={isCurrentlyDrawing ? "opacity-0 pointer-events-none" : "opacity-100"}
              >
                <PlayerCard
                  card="back"
                  i={i}
                  small={!isSelf}
                  overlap={14}
                />
              </div>
            )
          })}
          <div
            id={`player-hand-end-slot-${playerId}`}
            className="w-4 h-12 inline-block shrink-0"
          />
        </div>
      )}

      {/* Suit Picker Modal when an 8 is clicked */}
      {pendingEightIndex !== null && (
        <SuitPicker
          onSelect={(suit) => {
            playCard(pendingEightIndex, suit)
            setPendingEightIndex(null)
          }}
          onCancel={() => setPendingEightIndex(null)}
        />
      )}
    </div>
  )
}

export default PlayerHand