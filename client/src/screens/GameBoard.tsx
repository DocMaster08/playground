import { useEffect, useRef, useState } from "react"
import Deck from "../components/Deck"
import DiscardPile from "../components/DiscardPile"
import PlayerHand, { PositionKey } from "../components/PlayerHand"
import GameOverModal from "../components/GameOverModal"
import FlyingCardOverlay, { FlyingCardData } from "../components/FlyingCardOverlay"
import socket from "../socket"
import { Card, GameView } from "../types"
import { LogOut, Sparkles } from "lucide-react"

interface GameBoardProps {
  gameState: GameView
  onLeave?: () => void
}

function getPositionKey(index: number, totalPlayers: number): PositionKey {
  if (totalPlayers <= 1) return "bottom"
  if (totalPlayers === 2) {
    return index === 0 ? "bottom" : "top"
  }
  if (totalPlayers === 3) {
    const keys: PositionKey[] = ["bottom", "left", "right"]
    return keys[index] || "bottom"
  }
  if (totalPlayers === 4) {
    const keys: PositionKey[] = ["bottom", "left", "top", "right"]
    return keys[index] || "bottom"
  }
  if (totalPlayers === 5) {
    const keys: PositionKey[] = ["bottom", "left", "top-left", "top-right", "right"]
    return keys[index] || "bottom"
  }
  if (totalPlayers === 6) {
    const keys: PositionKey[] = ["bottom", "left", "top-left", "top", "top-right", "right"]
    return keys[index] || "bottom"
  }
  if (totalPlayers === 7) {
    const keys: PositionKey[] = [
      "bottom",
      "bottom-left",
      "left",
      "top-left",
      "top-right",
      "right",
      "bottom-right",
    ]
    return keys[index] || "bottom"
  }
  // 8 players
  const keys: PositionKey[] = [
    "bottom",
    "bottom-left",
    "left",
    "top-left",
    "top",
    "top-right",
    "right",
    "bottom-right",
  ]
  return keys[index] || "bottom"
}

function GameBoard({ gameState, onLeave }: GameBoardProps) {
  const currentSocketId = socket.id
  const myPlayerIndex = gameState.players.findIndex((p) => p.id === currentSocketId)

  // Rotate players so local player is always index 0 (bottom)
  const orderedPlayers =
    myPlayerIndex >= 0
      ? [
          ...gameState.players.slice(myPlayerIndex),
          ...gameState.players.slice(0, myPlayerIndex),
        ]
      : gameState.players

  const currentTurnPlayer = gameState.players.find((p) => p.isCurrentTurn)
  const isMyTurn = gameState.isYourTurn

  // State for active trajectory flying card animations
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([])
  const [displayedTopCard, setDisplayedTopCard] = useState<Card>(gameState.topCard)
  const [drawingCardState, setDrawingCardState] = useState<{
    playerId: string
    cardIndex: number
  } | null>(null)
  const prevGameStateRef = useRef<GameView | null>(null)

  useEffect(() => {
    if (!gameState) return
    const prev = prevGameStateRef.current

    if (prev) {
      // 1. Detect Played Card: Top card in discard pile changed!
      if (
        gameState.topCard &&
        (prev.topCard.rank !== gameState.topCard.rank ||
          prev.topCard.suit !== gameState.topCard.suit)
      ) {
        const actorId = prev.currentPlayer
        const isSelfPlay = actorId === currentSocketId
        const playedIndex =
          isSelfPlay && prev.hand
            ? prev.hand.findIndex(
                (c) =>
                  c.rank === gameState.topCard.rank && c.suit === gameState.topCard.suit
              )
            : -1

        let startX = 0
        let startY = 0
        let hasStartPos = false

        if (isSelfPlay && playedIndex >= 0) {
          const directSlotEl = document.getElementById(
            `hand-card-slot-${actorId}-${playedIndex}`
          )
          if (directSlotEl) {
            const actualEl =
              (directSlotEl.firstElementChild as HTMLElement) || directSlotEl
            const rect = actualEl.getBoundingClientRect()
            startX = rect.left
            startY = rect.top
            hasStartPos = true
          } else if (playedIndex > 0) {
            // Rightmost card slot that was unmounted: position based on previous slot + offset
            const prevSlotEl = document.getElementById(
              `hand-card-slot-${actorId}-${playedIndex - 1}`
            )
            if (prevSlotEl) {
              const actualEl =
                (prevSlotEl.firstElementChild as HTMLElement) || prevSlotEl
              const rect = actualEl.getBoundingClientRect()
              startX = rect.left + 38
              startY = rect.top
              hasStartPos = true
            }
          }
        } else if (!isSelfPlay) {
          const oppSlotEl = document.getElementById(`hand-card-slot-${actorId}-0`)
          if (oppSlotEl) {
            const actualEl =
              (oppSlotEl.firstElementChild as HTMLElement) || oppSlotEl
            const rect = actualEl.getBoundingClientRect()
            startX = rect.left
            startY = rect.top
            hasStartPos = true
          }
        }

        if (!hasStartPos) {
          const seatEl = document.getElementById(`player-seat-${actorId}`)
          if (seatEl) {
            const rect = seatEl.getBoundingClientRect()
            startX = rect.left
            startY = rect.top
            hasStartPos = true
          }
        }

        const discardEl = document.getElementById("discard-pile-target")

        if (discardEl && hasStartPos) {
          const actualDiscardEl =
            (discardEl.firstElementChild as HTMLElement) || discardEl
          const discardRect = actualDiscardEl.getBoundingClientRect()

          const newFlyingCard: FlyingCardData = {
            id: `fly-play-${Date.now()}-${Math.random()}`,
            card: gameState.topCard,
            startX,
            startY,
            endX: discardRect.left,
            endY: discardRect.top,
            shouldFlip: false,
            startScale: isSelfPlay ? 1.0 : 0.714,
            endScale: 1.0,
          }

          setFlyingCards((prevCards) => [...prevCards, newFlyingCard])

          // Gapless handoff: reveal new top card at 410ms as flying card lands
          setTimeout(() => {
            setDisplayedTopCard(gameState.topCard)
          }, 410)

          setTimeout(() => {
            setFlyingCards((prevCards) => prevCards.filter((c) => c.id !== newFlyingCard.id))
          }, 450)
        } else {
          setDisplayedTopCard(gameState.topCard)
        }
      } else if (gameState.topCard) {
        setDisplayedTopCard(gameState.topCard)
      }



      // 2. Detect Drawn Card: Deck count decreased!
      if (gameState.deckCount < prev.deckCount) {
        const actorId = prev.currentPlayer
        const isSelfDraw = actorId === currentSocketId

        let drawnIndex = -1

        if (isSelfDraw) {
          drawnIndex =
            gameState.hand && gameState.hand.length > 0
              ? gameState.hand.length - 1
              : -1
          if (drawnIndex >= 0) {
            setDrawingCardState({ playerId: actorId, cardIndex: drawnIndex })
          }
        } else {
          const oppPlayer =
            gameState.players.find((p) => p.id === actorId) ||
            prev.players.find((p) => p.id === actorId)
          const oppCardCount = oppPlayer ? oppPlayer.cardCount : 1

          const displayedCount = Math.min(oppCardCount, 6)
          drawnIndex = Math.max(0, displayedCount - 1)

          if (oppCardCount <= 6) {
            setDrawingCardState({ playerId: actorId, cardIndex: drawnIndex })
          }
        }

        setTimeout(() => {
          const deckEl = document.getElementById("deck-pile-target")
          const targetSlotEl =
            document.getElementById(`hand-card-slot-${actorId}-${drawnIndex}`) ||
            document.getElementById(`player-hand-end-slot-${actorId}`) ||
            document.getElementById(`player-hand-container-${actorId}`) ||
            document.getElementById(`player-seat-${actorId}`)

          if (deckEl && targetSlotEl) {
            const actualDeckEl = (deckEl.firstElementChild as HTMLElement) || deckEl
            const deckRect = actualDeckEl.getBoundingClientRect()

            const actualTargetEl =
              (targetSlotEl.firstElementChild as HTMLElement) || targetSlotEl
            const targetRect = actualTargetEl.getBoundingClientRect()

            const drawnCard: Card | "back" =
              (isSelfDraw && gameState.hand && gameState.hand.length > 0 && gameState.hand[gameState.hand.length - 1]) ||
              "back"

            const newFlyingCard: FlyingCardData = {
              id: `fly-draw-${Date.now()}-${Math.random()}`,
              card: drawnCard,
              startX: deckRect.left,
              startY: deckRect.top,
              endX: targetRect.left,
              endY: targetRect.top,
              shouldFlip: isSelfDraw,
              startScale: 1.0,
              endScale: isSelfDraw ? 1.0 : 0.714,
            }

            setFlyingCards((prevCards) => [...prevCards, newFlyingCard])

            // Gapless handoff: reveal static hand card at 410ms, then unmount flying card at 450ms
            setTimeout(() => {
              setDrawingCardState(null)
            }, 410)

            setTimeout(() => {
              setFlyingCards((prevCards) => prevCards.filter((c) => c.id !== newFlyingCard.id))
            }, 450)
          }


        }, 20)
      }
    }

    prevGameStateRef.current = gameState
  }, [gameState, currentSocketId])


  return (
    <div className="w-full h-screen overflow-hidden bg-lime-300 relative select-none flex flex-col justify-between p-2 md:p-4">
      {/* Trajectory Flying Card Overlay */}
      <FlyingCardOverlay flyingCards={flyingCards} />

      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-30 flex items-center justify-between w-full max-w-5xl mx-auto bg-card border-2 border-black p-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm uppercase tracking-wider text-black flex items-center gap-1.5">
            🎴 CRAZY EIGHTS
          </span>
          <span className="text-xs font-bold bg-amber-300 text-black px-2 py-0.5 border border-black hidden sm:inline-block">
            Direction: {gameState.direction === 1 ? "Clockwise ↻" : "Counter-Clockwise ↺"}
          </span>
        </div>

        {/* Current Turn Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase text-muted-foreground hidden md:inline">Turn:</span>
          {isMyTurn ? (
            <span className="bg-emerald-400 text-black font-black text-xs px-2.5 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-black" /> YOUR TURN
            </span>
          ) : (
            <span className="bg-amber-100 text-black font-extrabold text-xs px-2.5 py-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {currentTurnPlayer ? `${currentTurnPlayer.name}'s turn` : "Waiting..."}
            </span>
          )}
        </div>

        {/* Leave Button */}
        {onLeave && (
          <button
            onClick={onLeave}
            className="flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs px-2.5 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer uppercase"
            title="Leave table"
          >
            <LogOut className="w-3.5 h-3.5" /> Leave
          </button>
        )}
      </div>

      {/* Main Poker/Card Felt Table Container */}
      <div className="relative flex-1 w-full my-1 flex items-center justify-center overflow-hidden">
        {/* Felt Oval Table Base */}
        <div className="w-[94%] md:w-[96%] max-w-6xl h-[82%] md:h-[86%] rounded-[48px] md:rounded-[90px] border-4 md:border-8 border-amber-950 bg-emerald-700 shadow-[inset_0_0_60px_rgba(0,0,0,0.6),8px_8px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center">

          {/* Felt Watermark Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[24px_24px] opacity-5 pointer-events-none" />
          <div className="text-emerald-900/40 font-black text-3xl md:text-5xl uppercase tracking-widest pointer-events-none select-none text-center transform -rotate-12">
            PLAYGROUND
          </div>

          {/* Center Board: Deck & Discard Pile (Dead Center of Felt Table) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-6 md:gap-12 bg-black/40 p-4 md:p-6 rounded-2xl border-2 border-black/40 backdrop-blur-xs shadow-xl">
            <Deck count={gameState.deckCount} isYourTurn={isMyTurn} />
            <DiscardPile
              topCard={displayedTopCard || gameState.topCard}
              chosenSuit={gameState.chosenSuit}
            />

          </div>

          {/* Render Players Seated Directly Around Table Rail/Perimeter */}
          {orderedPlayers.map((player, i) => {
            const positionKey = getPositionKey(i, orderedPlayers.length)
            const isSelf = player.id === currentSocketId

            return (
              <PlayerHand
                key={player.id}
                playerId={player.id}
                hand={isSelf ? gameState.hand : undefined}
                cardCount={player.cardCount}
                name={player.name}
                positionKey={positionKey}
                yourTurn={player.isCurrentTurn}
                isSelf={isSelf}
                drawingCardIndex={
                  drawingCardState?.playerId === player.id ? drawingCardState.cardIndex : null
                }
                topCard={displayedTopCard || gameState.topCard}
                chosenSuit={gameState.chosenSuit}
              />
            )

          })}
        </div>
      </div>

      {/* Game Over Screen Modal */}
      {gameState.phase === "FINISHED" && (
        <GameOverModal gameState={gameState} onLeave={onLeave} />
      )}
    </div>
  )
}

export default GameBoard