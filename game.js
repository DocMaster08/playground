
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

// Create and shuffle
function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank })
        }
    }
    return shuffle(deck)
}

function shuffle(cards) {
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards
}

// Initialize game
function initGame(playerIds) {
    const deck = createDeck()
    const hands = {}
    const cardsPerPlayer = 5;

    // Deal cards
    for (const id of playerIds) {
        hands[id] = deck.splice(0, cardsPerPlayer);
    }

    // Flip the first non-8 card to start the discard pile
    let startCardIndex = deck.findIndex(c => c.rank !== '8');
    if (startCardIndex === -1) startCardIndex = 0;
    const [startCard] = deck.splice(startCardIndex, 1);

    return {
        phase: 'PLAYING',
        deck,
        discardPile: [startCard],
        hands,
        playerOrder: [...playerIds],
        currentPlayerIndex: 0,
        direction: 1,
        chosenSuit: null,
        winner: null
    }
}

// Card Matching
function isValidPlay(card, topCard, chosenSuit) {
    // 8s are always valid
    if (card.rank === '8') return true

    if (chosenSuit) return card.suit === chosenSuit;

    return card.rank === topCard.rank || card.suit === topCard.suit;
}

// Advance Turn
function advanceTurn(gameState) {
    const count = gameState.playerOrder.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + count) % count;
}

// Play a Card
function playCard(gameState, playerId, cardIndex, chosenSuit) {
    // Guard: correct phase
    if (gameState.phase !== 'PLAYING') return { success: false, error: 'Game is not in progress' }

    // Guard: correct turn
    const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    if (currentPlayerId !== playerId) return { success: false, error: 'It is not your turn' }

    // Guard: valid card index
    const hand = gameState.hands[playerId]
    if (cardIndex < 0 || cardIndex > hand.length - 1) return { success: false, error: 'Card not found' }

    // Guard: legal play
    const playedCard = hand[cardIndex]
    const topCard = gameState.discardPile[gameState.discardPile.length - 1]
    if (!isValidPlay(playedCard, topCard, gameState.chosenSuit)) return { success: false, error: 'Illegal move' }


    // 8 played
    if (playedCard.rank === '8') {
        if (!chosenSuit || !SUITS.includes(chosenSuit)) return { success: false, error: "Must choose a suit when playing an 8" };
        gameState.chosenSuit = chosenSuit
    }

    // Apply the move
    hand.splice(cardIndex, 1)
    gameState.discardPile.push(playedCard)
    gameState.chosenSuit = playedCard.rank === '8' ? chosenSuit : null;       

    // check win condition
    if (hand.length === 0) {
        gameState.phase = 'FINISHED'
        gameState.winner = playerId;
        return { success: true, event: "GAME_OVER" }
    }

    // advance turn
    advanceTurn(gameState)

    return { success: true, event: "CARD_PLAYED" }
}

// Draw Card
function drawCard(gameState, playerId) {
    if (gameState.phase !== 'PLAYING') {
        return { success: false, error: 'Game is not in progress' };
    }

    const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex];
    if (playerId !== currentPlayerId) {
        return { success: false, error: 'Not your turn' };
    }

    // If deck is empty, reshuffle discard pile (keep top card)
    if (gameState.deck.length === 0) {
        if (gameState.discardPile.length <= 1) {
            // No cards anywhere — extremely rare. Skip turn.
            advanceTurn(gameState);
            return { success: true, event: 'NO_CARDS_LEFT' };
        }
        const topCard = gameState.discardPile.pop();
        gameState.deck = shuffle([...gameState.discardPile]);
        gameState.discardPile = [topCard];
    }

    // Draw one card
    const card = gameState.deck.pop();
    gameState.hands[playerId].push(card);

    // After drawing, advance turn (standard Crazy Eights: draw = end of turn)
    advanceTurn(gameState);

    return { success: true, event: 'CARD_DRAWN', card };
}

// Player View 
function getPlayerView(gameState, playerId, players) {
    const topCard = gameState.discardPile[gameState.discardPile.length - 1]
    const hand = gameState.hands[playerId] || []
    const currentPlayerId = gameState.playerOrder[gameState.currentPlayerIndex]
    return {
        phase: gameState.phase,
        topCard,
        hand,
        chosenSuit: gameState.chosenSuit,
        deckCount: gameState.deck.length,
        currentPlayer: currentPlayerId,
        isYourTurn: currentPlayerId === playerId,

        players: players.map(player => ({
            id: player.id,
            name: player.name,
            cardCount: (gameState.hands[player.id] || []).length,
            isCurrentTurn: currentPlayerId === player.id
        })),
        winner: gameState.winner,
        direction: gameState.direction

    }
}

module.exports = {
    initGame,
    playCard,
    drawCard,
    getPlayerView,
    isValidPlay,
    SUITS
}