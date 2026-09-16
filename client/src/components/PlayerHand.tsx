import { Card } from "../types"
import PlayerCard from "./PlayerCard"

interface PlayerHandProps {
  hand?: Card[]
  cardCount: number
  name: string
  placement: number
}

const positions: Map<number, string> = new Map([
  [0, "bottom-6 left-1/2 -translate-x-1/2 rotate-0"],
  [180, "top-6 left-1/2 -translate-x-1/2 rotate-180"],
  [90, "left-6 top-1/2 -translate-y-1/2 rotate-90"],
  [-90, "right-6 top-1/2 -translate-y-1/2 -rotate-90"],
  [135, "top-10 left-10 rotate-150"],
  [-135, "top-10 right-10 -rotate-150"],
  [45, "bottom-10 left-10 rotate-30"],
  [-45, "bottom-10 right-10 -rotate-30"]
])


function PlayerHand({ hand, cardCount, name, placement }: PlayerHandProps) {
  return (
    <div className={`absolute ${positions.get(placement)} flex flex-col items-center`}>

      {hand ?
        <div className="flex">
          {hand.map((card, i) => <PlayerCard key={`${card.rank}-${card.suit}`} card={card} i={i} hover={true} />)}
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