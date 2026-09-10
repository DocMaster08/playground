import { GameView } from "../types"

interface GameBoardProps {
  gameState: GameView
}

function GameBoard({ gameState }: GameBoardProps) {
  return (
    <div>
      {gameState.phase}
      {gameState.topCard.rank}
      {gameState.topCard.suit}
    </div>
  )
}

export default GameBoard