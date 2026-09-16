import PlayerCard from "./PlayerCard"

interface DeckProps {
    count: number
}
function Deck({count}:DeckProps) {
  return (
    <div className="flex">
        {Array.from({length: count}).map((_, i) => <PlayerCard key={i} card="back" i={i} overlap={61} hover={i===count-1} />)}
    </div>
  )
}

export default Deck