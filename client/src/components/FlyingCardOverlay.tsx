import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import PlayerCard from "./PlayerCard"
import { Card } from "../types"

export interface FlyingCardData {
  id: string
  card: Card | "back"
  startX: number
  startY: number
  endX: number
  endY: number
  shouldFlip?: boolean
  startScale?: number
  endScale?: number
}

interface FlyingCardOverlayProps {
  flyingCards: FlyingCardData[]
}

function SingleFlyingCard({ cardData }: { cardData: FlyingCardData }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let id1: number
    let id2: number
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        setActive(true)
      })
    })
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [])

  const deltaX = cardData.endX - cardData.startX
  const deltaY = cardData.endY - cardData.startY
  const shouldFlip = cardData.shouldFlip && cardData.card !== "back"

  const startScale = cardData.startScale ?? 1
  const endScale = cardData.endScale ?? 1

  return (
    <div
      style={{
        position: "fixed",
        left: `${cardData.startX}px`,
        top: `${cardData.startY}px`,
        zIndex: 9999,
        pointerEvents: "none",
        perspective: "1000px",
        transformOrigin: "top left",
        transform: active
          ? `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${endScale})`
          : `translate3d(0, 0, 0) scale(${startScale})`,
        opacity: active ? 1 : 0.8,
        transition: "transform 440ms cubic-bezier(0.25, 0.9, 0.3, 1), opacity 440ms ease-out",
      }}
    >
      {shouldFlip ? (
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: active ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 440ms cubic-bezier(0.25, 0.9, 0.3, 1)",
            position: "relative",
            width: "max-content",
          }}
        >
          {/* Front Face: Card Back */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <PlayerCard card="back" i={0} />
          </div>

          {/* Back Face: Actual Drawn Card Face (Flipped 180deg) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <PlayerCard card={cardData.card} i={0} />
          </div>
        </div>
      ) : (
        /* Upright Face-Up or Card Back (No 3D Rotation) */
        <div className="shadow-2xl" style={{ width: "max-content" }}>
          <PlayerCard card={cardData.card} i={0} />
        </div>
      )}
    </div>
  )
}

export default function FlyingCardOverlay({ flyingCards }: FlyingCardOverlayProps) {
  if (flyingCards.length === 0) return null

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-50">
      {flyingCards.map((fc) => (
        <SingleFlyingCard key={fc.id} cardData={fc} />
      ))}
    </div>,
    document.body
  )
}
