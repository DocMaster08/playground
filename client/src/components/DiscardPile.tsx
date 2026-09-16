import { Card } from "../types"
import PlayerCard from "./PlayerCard"

interface DiscardPileProps {
    topCard: Card
}
function DiscardPile({ topCard }: DiscardPileProps) {
    return (
        <div>
            <PlayerCard card={topCard} i={0} />
        </div>
    )
}

export default DiscardPile