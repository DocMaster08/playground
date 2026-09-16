import { useCallback } from "react"
import socket from "../socket"
import { Card } from "../types"
import PlayerCard from "./PlayerCard"
import { toast } from "sonner"

interface PlayerHandProps {
  hand?: Card[]
  cardCount: number
  name: string
  placement: number
  yourTurn: boolean
}

type PlayCardResponse = { success: true, event: string } | { success: false, error: string }

const positions: Map<number, string> = new Map([
  [0, "bottom-6 left-1/2 -translate-x-1/2 rotate-0"],
  [180, "top-6 left-1/2 -translate-x-1/2 rotate-180"],
  [90, "left-6 top-1/2 -translate-y-1/2 rotate-90"],
  [-90, "right-6 top-1/2 -translate-y-1/2 -rotate-90"],
  [135, "top-10 left-20 rotate-150"],
  [-135, "top-10 right-20 -rotate-150"],
  [45, "bottom-10 left-20 rotate-30"],
  [-45, "bottom-10 right-20 -rotate-30"]
])


function PlayerHand({ hand, cardCount, name, placement, yourTurn }: PlayerHandProps) {

  const handlePlayCardResponse = useCallback((response: PlayCardResponse) => {
    if (!response.success) {
      toast.error(response.error)
    }
  }, [])

  function playCard( i: number) {
    socket.emit("playCard", { cardIndex: i }, handlePlayCardResponse)
  }

  return (
    <div className={`absolute ${positions.get(placement)} flex flex-col items-center gap-2`}>
      {yourTurn &&
        <div className="flex items-center text-accent font-bold">
          <img className="rotate-90 w-13" src="hand-right.png" />
          <p>{hand ? "Your turn" : `${name}'s turn`}</p>
        </div>}
      {hand ?
        <div className="flex">
          {hand.map((card, i) => <PlayerCard onCardClicked={playCard} key={`${card.rank}-${card.suit}`} card={card} i={i} hover={true} />)}
        </div>
        :
        <div className="flex">
          {Array.from({ length: cardCount }).map((_, i) => <PlayerCard key={`${name}-${i}`} card="back" i={i} />)}
        </div>
      }
      <p className="w-fit">{name}</p>
    </div>
  )
}

export default PlayerHand