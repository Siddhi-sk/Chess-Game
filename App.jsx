import React, { useRef, useState, useMemo, useCallback } from "react";
import { Chess } from "chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

const PIECE_UNICODE = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

function pieceGlyph(piece) {
  return PIECE_UNICODE[piece.type];
}

export default function App() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [history, setHistory] = useState([]);
  const [promotionChoice, setPromotionChoice] = useState(null);
  const [playerNames, setPlayerNames] = useState({ w: "Player 1", b: "Player 2" });

  const game = gameRef.current;

  const board = useMemo(() => game.board(), [fen]);

  const status = useMemo(() => {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? playerNames.b : playerNames.w;
      return { text: `Checkmate — ${winner} wins!`, type: "over" };
    }
    if (game.isStalemate()) return { text: "Stalemate — Draw", type: "over" };
    if (game.isThreefoldRepetition()) return { text: "Draw by repetition", type: "over" };
    if (game.isInsufficientMaterial()) return { text: "Draw — insufficient material", type: "over" };
    if (game.isDraw()) return { text: "Draw", type: "over" };
    const turnName = game.turn() === "w" ? playerNames.w : playerNames.b;
    if (game.isCheck()) return { text: `${turnName} is in check`, type: "check" };
    return { text: `${turnName}'s turn`, type: "turn" };
  }, [fen, playerNames]);

  const capturedPieces = useMemo(() => {
    const captured = { w: [], b: [] };
    game.history({ verbose: true }).forEach((m) => {
      if (m.captured) {
        const capturedColor = m.color === "w" ? "b" : "w";
        captured[capturedColor].push(m.captured);
      }
    });
    return captured;
  }, [fen]);

  const resetGame = useCallback(() => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setSelected(null);
    setLegalTargets([]);
    setLastMove(null);
    setHistory([]);
    setPromotionChoice(null);
  }, []);

  const undoMove = useCallback(() => {
    game.undo();
    setFen(game.fen());
    setSelected(null);
    setLegalTargets([]);
    const h = game.history({ verbose: true });
    setHistory(h);
    setLastMove(h.length ? { from: h[h.length - 1].from, to: h[h.length - 1].to } : null);
  }, [game]);

  const attemptMove = useCallback(
    (from, to) => {
      const piece = game.get(from);
      const isPromotion =
        piece &&
        piece.type === "p" &&
        ((piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1"));

      if (isPromotion) {
        setPromotionChoice({ from, to });
        return;
      }

      const move = game.move({ from, to });
      if (move) {
        setFen(game.fen());
        setLastMove({ from, to });
        setHistory(game.history({ verbose: true }));
      }
      setSelected(null);
      setLegalTargets([]);
    },
    [game]
  );

  const finishPromotion = useCallback(
    (promotion) => {
      if (!promotionChoice) return;
      const move = game.move({ from: promotionChoice.from, to: promotionChoice.to, promotion });
      if (move) {
        setFen(game.fen());
        setLastMove({ from: promotionChoice.from, to: promotionChoice.to });
        setHistory(game.history({ verbose: true }));
      }
      setPromotionChoice(null);
      setSelected(null);
      setLegalTargets([]);
    },
    [game, promotionChoice]
  );

  const handleSquareClick = useCallback(
    (square) => {
      if (status.type === "over" || promotionChoice) return;

      const clickedPiece = game.get(square);

      if (selected) {
        if (legalTargets.includes(square)) {
          attemptMove(selected, square);
          return;
        }
        if (clickedPiece && clickedPiece.color === game.turn()) {
          const moves = game.moves({ square, verbose: true });
          setSelected(square);
          setLegalTargets(moves.map((m) => m.to));
          return;
        }
        setSelected(null);
        setLegalTargets([]);
        return;
      }

      if (clickedPiece && clickedPiece.color === game.turn()) {
        const moves = game.moves({ square, verbose: true });
        setSelected(square);
        setLegalTargets(moves.map((m) => m.to));
      }
    },
    [selected, legalTargets, game, attemptMove, status, promotionChoice]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Two Player Chess</h1>
        <p className="subtitle">Play locally on one device — laptop or mobile</p>
      </header>

      <div className="player-tags">
        <input
          className={`player-input player-w ${game.turn() === "w" ? "active" : ""}`}
          value={playerNames.w}
          onChange={(e) => setPlayerNames((p) => ({ ...p, w: e.target.value || "Player 1" }))}
          maxLength={16}
        />
        <span className="vs">vs</span>
        <input
          className={`player-input player-b ${game.turn() === "b" ? "active" : ""}`}
          value={playerNames.b}
          onChange={(e) => setPlayerNames((p) => ({ ...p, b: e.target.value || "Player 2" }))}
          maxLength={16}
        />
      </div>

      <div className={`status-banner status-${status.type}`}>{status.text}</div>

      <div className="game-area">
        <section className="board-wrap">
          <div className="captured-row captured-black">
            {capturedPieces.b.map((t, i) => (
              <span key={i} className="captured-piece black-piece">
                {PIECE_UNICODE[t]}
              </span>
            ))}
          </div>

          <div className="board">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const square = `${FILES[cIdx]}${RANKS[rIdx]}`;
                const isDark = (rIdx + cIdx) % 2 === 1;
                const isSelected = selected === square;
                const isTarget = legalTargets.includes(square);
                const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
                const isKingInCheck =
                  cell && cell.type === "k" && cell.color === game.turn() && game.isCheck();

                const classes = [
                  "square",
                  isDark ? "dark" : "light",
                  isSelected ? "selected" : "",
                  isTarget ? (cell ? "target-capture" : "target-empty") : "",
                  isLastMove ? "last-move" : "",
                  isKingInCheck ? "king-check" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div key={square} className={classes} onClick={() => handleSquareClick(square)}>
                    {cIdx === 0 && <span className="coord rank-label">{RANKS[rIdx]}</span>}
                    {rIdx === 7 && <span className="coord file-label">{FILES[cIdx]}</span>}
                    {cell && (
                      <span className={`piece ${cell.color === "w" ? "white-piece" : "black-piece"}`}>
                        {pieceGlyph(cell)}
                      </span>
                    )}
                    {isTarget && !cell && <span className="target-dot" />}
                  </div>
                );
              })
            )}

            {promotionChoice && (
              <div className="promotion-overlay">
                <div className="promotion-box">
                  <p>Promote pawn to:</p>
                  <div className="promotion-options">
                    {["q", "r", "b", "n"].map((p) => (
                      <button key={p} className="promotion-btn" onClick={() => finishPromotion(p)}>
                        {PIECE_UNICODE[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="captured-row captured-white">
            {capturedPieces.w.map((t, i) => (
              <span key={i} className="captured-piece white-piece">
                {PIECE_UNICODE[t]}
              </span>
            ))}
          </div>

          <div className="controls">
            <button className="btn btn-secondary" onClick={undoMove} disabled={history.length === 0}>
              ⟲ Undo
            </button>
            <button className="btn btn-primary" onClick={resetGame}>
              ⟳ New Game
            </button>
          </div>
        </section>

        <aside className="history-panel">
          <h2>Move History</h2>
          <div className="history-list">
            {history.length === 0 && <p className="empty-history">No moves yet</p>}
            <ol>
              {history
                .reduce((rows, move, idx) => {
                  if (idx % 2 === 0) {
                    rows.push([move]);
                  } else {
                    rows[rows.length - 1].push(move);
                  }
                  return rows;
                }, [])
                .map((pair, i) => (
                  <li key={i} className="history-row">
                    <span className="move-number">{i + 1}.</span>
                    <span className="move-white">{pair[0]?.san}</span>
                    <span className="move-black">{pair[1]?.san || ""}</span>
                  </li>
                ))}
            </ol>
          </div>
        </aside>
      </div>

      <footer className="app-footer">
        <p>Built with React, Vite &amp; chess.js</p>
      </footer>
    </div>
  );
}
