export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
}

export interface Player {
  id: string;
  name: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  cardCount: number;
  isCurrentTurn: boolean;
}

export interface GameView {
  phase: 'PLAYING' | 'FINISHED';
  topCard: Card;
  hand: Card[];
  chosenSuit: string | null;    // non-null when an 8 was played
  deckCount: number;
  currentPlayer: string;        // socket ID
  isYourTurn: boolean;
  players: PlayerInfo[];
  winner: string | null;        // socket ID of winner, or null
  direction: 1 | -1;            // 1 = clockwise, -1 = counter
}