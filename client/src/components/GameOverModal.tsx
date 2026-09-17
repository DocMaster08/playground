import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Crown, LogOut, PartyPopper, Award } from 'lucide-react';
import socket from '../socket';
import { GameView } from '../types';

interface GameOverModalProps {
  gameState: GameView;
  onLeave?: () => void;
}

export default function GameOverModal({ gameState, onLeave }: GameOverModalProps) {
  const currentSocketId = socket.id;
  const isWinner = gameState.winner === currentSocketId;
  const winnerPlayer = gameState.players.find((p) => p.id === gameState.winner);

  // Sort players: winner first (cardCount 0), then by card count ascending
  const sortedPlayers = [...gameState.players].sort((a, b) => {
    if (a.id === gameState.winner) return -1;
    if (b.id === gameState.winner) return 1;
    return a.cardCount - b.cardCount;
  });

  useEffect(() => {
    if (isWinner) {
      // Trigger festive confetti cannons
      const count = 200;
      const defaults = {
        origin: { y: 0.7 }
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isWinner]);

  function handlePlayAgain() {
    socket.emit('playAgain');
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-6 flex flex-col gap-6 text-foreground relative overflow-hidden">
        {/* Banner Top Decorative Accent */}
        <div className={`h-3 w-full absolute top-0 left-0 ${isWinner ? 'bg-amber-400' : 'bg-primary'}`} />

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2 pt-2">
          {isWinner ? (
            <>
              <div className="inline-flex items-center justify-center bg-amber-300 p-4 border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <Trophy className="w-12 h-12 text-black" />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <PartyPopper className="w-6 h-6 text-amber-500" />
                <h2 className="text-4xl font-extrabold tracking-tight uppercase text-amber-600">VICTORY!</h2>
                <PartyPopper className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-muted-foreground font-medium">
                You played all your cards and won the game! 🎉
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center bg-secondary p-4 border-2 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Crown className="w-12 h-12 text-amber-500" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight uppercase">GAME OVER</h2>
              <p className="text-base font-semibold text-foreground">
                <span className="bg-amber-300 px-2 py-0.5 border border-black font-bold">
                  {winnerPlayer ? winnerPlayer.name : 'Another player'}
                </span>{' '}
                won the game!
              </p>
            </>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">
            <span>Rank & Player</span>
            <span>Cards Left</span>
          </div>

          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
            {sortedPlayers.map((player, index) => {
              const isSelf = player.id === currentSocketId;
              const isFirst = index === 0;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                    isFirst
                      ? 'bg-amber-100 font-bold'
                      : isSelf
                      ? 'bg-blue-50 font-semibold'
                      : 'bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 flex items-center justify-center border border-black bg-white text-xs font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {player.name}
                      {isSelf && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 uppercase tracking-wide border border-black">
                          YOU
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFirst ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-400 text-black px-2 py-0.5 font-bold border border-black">
                        <Award className="w-3.5 h-3.5" /> WINNER
                      </span>
                    ) : (
                      <span className="text-sm font-bold bg-muted px-2 py-0.5 border border-black">
                        {player.cardCount} {player.cardCount === 1 ? 'card' : 'cards'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handlePlayAgain}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-500 text-black font-extrabold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-base uppercase tracking-wide"
          >
            <RotateCcw className="w-5 h-5" /> Play Again
          </button>
          
          {onLeave && (
            <button
              onClick={onLeave}
              className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-base uppercase tracking-wide"
            >
              <LogOut className="w-5 h-5" /> Leave
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
