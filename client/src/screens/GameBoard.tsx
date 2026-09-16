import Deck from "../components/Deck"
import DiscardPile from "../components/DiscardPile"
import PlayerHand from "../components/PlayerHand"
import socket from "../socket"
import { GameView } from "../types"

interface GameBoardProps {
  gameState: GameView
}

const placements: Record<number, number[]> = {
  1: [0],
  2: [0, 180],
  3: [0, 90, -90],
  4: [0, 90, 180, -90],
  5: [0, 90, 135, -135, -90],
  6: [0, 90, 135, 180, -135, -90],
  7: [0, 45, 90, 135, -135, -90, -45],
  8: [0, 45, 90, 135, 180, -135, -90, -45]
}

function GameBoard({ gameState }: GameBoardProps) {
  const myPlayerIndex = gameState.players.findIndex((player) => player.id === socket.id)
  const ordered_players = [...gameState.players.slice(myPlayerIndex),
  ...gameState.players.slice(0, myPlayerIndex)
  ]
  return (
    <div>
      <div>
        {ordered_players.map((player, i) => <PlayerHand key={player.id} hand={i === 0 ? gameState.hand : undefined} cardCount={player.cardCount} name={player.name} placement={placements[ordered_players.length]?.[i] ?? 0} />)}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
        <Deck count={gameState.deckCount > 10 ? 10 : gameState.deckCount} />
        <DiscardPile topCard={gameState.topCard} />
      </div>
    </div>
  )
}

export default GameBoard