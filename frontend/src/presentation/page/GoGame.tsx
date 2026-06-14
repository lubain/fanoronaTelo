import { O, X } from "@/domain/constants";
import { apiPost } from "@/infrastructure/ApiPost";
import { useCallback, useState } from "react";
import ResetBtn from "../components/ui/ResetBtn";
import GameStatusBar from "../components/GameStatusBar";
import ThinkingOverlay from "../components/ThinkingOverlay";

const GO_SIZE = 9;
const GO_PASS = -1;
const GO_KOMI = 6.5;

function goNeighbors(idx: number): number[] {
  const row = Math.floor(idx / GO_SIZE),
    col = idx % GO_SIZE;
  const res: number[] = [];
  if (row > 0) res.push((row - 1) * GO_SIZE + col);
  if (row < GO_SIZE - 1) res.push((row + 1) * GO_SIZE + col);
  if (col > 0) res.push(row * GO_SIZE + col - 1);
  if (col < GO_SIZE - 1) res.push(row * GO_SIZE + col + 1);
  return res;
}

function goGetGroup(board: number[], idx: number): Set<number> {
  const color = board[idx];
  if (color === 0) return new Set();
  const visited = new Set<number>();
  const stack = [idx];
  while (stack.length) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    goNeighbors(cur).forEach((n) => {
      if (board[n] === color && !visited.has(n)) stack.push(n);
    });
  }
  return visited;
}

function goGetLiberties(board: number[], group: Set<number>): Set<number> {
  const libs = new Set<number>();
  group.forEach((idx) =>
    goNeighbors(idx).forEach((n) => {
      if (board[n] === 0) libs.add(n);
    }),
  );
  return libs;
}

function goApplyCaptures(
  board: number[],
  lastPlayed: number,
  opponent: number,
): number[] {
  const b = [...board];
  goNeighbors(lastPlayed).forEach((n) => {
    if (b[n] === opponent) {
      const grp = goGetGroup(b, n);
      if (goGetLiberties(b, grp).size === 0)
        grp.forEach((s) => {
          b[s] = 0;
        });
    }
  });
  return b;
}

function goIsValidMove(
  board: number[],
  idx: number,
  player: number,
  koState: number[] | null,
): boolean {
  if (board[idx] !== 0) return false;
  const b = [...board];
  b[idx] = player;
  const opponent = -player;
  const afterCapture = goApplyCaptures(b, idx, opponent);
  const grp = goGetGroup(afterCapture, idx);
  if (goGetLiberties(afterCapture, grp).size === 0) return false;
  if (koState && afterCapture.every((v, i) => v === koState[i])) return false;
  return true;
}

function goComputeTerritory(board: number[]): { x: number; o: number } {
  const visited = new Set<number>();
  let x = 0,
    o = 0;
  for (let start = 0; start < GO_SIZE * GO_SIZE; start++) {
    if (board[start] !== 0 || visited.has(start)) continue;
    const zone = new Set<number>();
    const borders = new Set<number>();
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop()!;
      if (zone.has(cur)) continue;
      zone.add(cur);
      visited.add(cur);
      goNeighbors(cur).forEach((n) => {
        if (board[n] === 0 && !zone.has(n)) stack.push(n);
        else if (board[n] !== 0) borders.add(board[n]);
      });
    }
    if (borders.size === 1) {
      const owner = [...borders][0];
      if (owner === X) x += zone.size;
      else o += zone.size;
    }
  }
  return { x, o };
}

interface GoState {
  board: number[];
  turn: number;
  koState: number[] | null;
  passes: number;
  capturesX: number;
  capturesO: number;
  lastMove: number;
  gameOver: boolean;
  winner: string | null;
  xTerritory: number;
  oTerritory: number;
}

function makeGoState(): GoState {
  return {
    board: Array(GO_SIZE * GO_SIZE).fill(0),
    turn: X,
    koState: null,
    passes: 0,
    capturesX: 0,
    capturesO: 0,
    lastMove: GO_PASS,
    gameOver: false,
    winner: null,
    xTerritory: 0,
    oTerritory: 0,
  };
}

function GoScoreModal({
  state,
  onClose,
}: {
  state: GoState;
  onClose: () => void;
}) {
  const xTotal =
    state.board.filter((c) => c === X).length +
    state.xTerritory +
    state.capturesX;
  const oTotal =
    state.board.filter((c) => c === O).length +
    state.oTerritory +
    state.capturesO +
    GO_KOMI;
  const winner = xTotal > oTotal ? "⚫ Noir (Vous)" : "⚪ Blanc (IA)";
  const margin = Math.abs(xTotal - oTotal).toFixed(1);
  return (
    <div className="go-modal-backdrop">
      <div className="go-modal">
        <div className="go-modal-title">Partie terminée</div>
        <div className="go-modal-winner">{winner}</div>
        <div className="go-modal-margin">par {margin} points</div>
        <table className="go-score-table">
          <thead>
            <tr>
              <th></th>
              <th>⚫ Noir</th>
              <th>⚪ Blanc</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pierres</td>
              <td>{state.board.filter((c) => c === X).length}</td>
              <td>{state.board.filter((c) => c === O).length}</td>
            </tr>
            <tr>
              <td>Territoire</td>
              <td>{state.xTerritory}</td>
              <td>{state.oTerritory}</td>
            </tr>
            <tr>
              <td>Captures</td>
              <td>{state.capturesX}</td>
              <td>{state.capturesO}</td>
            </tr>
            <tr>
              <td>Komi</td>
              <td>—</td>
              <td>{GO_KOMI}</td>
            </tr>
            <tr className="go-score-total">
              <td>Total</td>
              <td>{xTotal}</td>
              <td>{oTotal.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
        <button className="go-modal-close" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}

export default function GoGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GoState>(makeGoState);
  const [thinking, setThinking] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showScore, setShowScore] = useState(false);
  // const [lastCaptured, setLastCaptured] = useState<number[]>([]);
  const [justPlaced, setJustPlaced] = useState<number | null>(null);

  const reset = () => {
    setGs(makeGoState());
    setThinking(false);
    setHoverIdx(null);
    setShowScore(false);
    // setLastCaptured([]);
    setJustPlaced(null);
  };

  const fetchAI = useCallback(async (state: GoState) => {
    setThinking(true);
    try {
      const data = await apiPost("/go-move", {
        board: state.board,
        turn: state.turn,
        ko_state: state.koState,
        passes: state.passes,
        captures_x: state.capturesX,
        captures_o: state.capturesO,
      });

      const captured: number[] = [];
      state.board.forEach((v, i) => {
        if (v === X && data.best_board[i] === 0) captured.push(i);
      });
      // setLastCaptured(captured);
      setJustPlaced(data.last_move);

      const newGs: GoState = {
        board: data.best_board,
        turn: data.next_turn,
        koState: data.ko_state,
        passes: data.passes,
        capturesX: data.captures_x,
        capturesO: data.captures_o,
        lastMove: data.last_move,
        gameOver: data.passes >= 2,
        winner: null,
        xTerritory: 0,
        oTerritory: 0,
      };

      if (newGs.gameOver) {
        const terr = goComputeTerritory(newGs.board);
        newGs.xTerritory = terr.x;
        newGs.oTerritory = terr.o;
        const xT =
          newGs.board.filter((c) => c === X).length + terr.x + newGs.capturesX;
        const oT =
          newGs.board.filter((c) => c === O).length +
          terr.o +
          newGs.capturesO +
          GO_KOMI;
        newGs.winner = xT > oT ? "Noir (Vous)" : "Blanc (IA)";
        setShowScore(true);
      }

      setGs(newGs);
    } catch {
      /* réseau indisponible */
    } finally {
      setThinking(false);
    }
  }, []);

  const handleIntersectionClick = useCallback(
    async (idx: number) => {
      if (gs.gameOver || thinking || gs.turn !== X) return;
      if (!goIsValidMove(gs.board, idx, X, gs.koState)) return;

      // Jouer le coup humain localement
      const newBoard = [...gs.board];
      newBoard[idx] = X;
      const afterCapture = goApplyCaptures(newBoard, idx, O);

      const captured: number[] = [];
      gs.board.forEach((v, i) => {
        if (v === O && afterCapture[i] === 0) captured.push(i);
      });
      // setLastCaptured(captured);
      setJustPlaced(idx);

      const newGs: GoState = {
        ...gs,
        board: afterCapture,
        turn: O,
        koState: gs.board,
        passes: 0,
        capturesX: gs.capturesX + captured.length,
        lastMove: idx,
        gameOver: false,
        winner: null,
      };
      setGs(newGs);
      await fetchAI(newGs);
    },
    [gs, thinking, fetchAI],
  );

  const handlePass = useCallback(async () => {
    if (gs.gameOver || thinking || gs.turn !== X) return;
    const newPasses = gs.passes + 1;
    const newGs: GoState = {
      ...gs,
      turn: O,
      passes: newPasses,
      koState: null,
      lastMove: GO_PASS,
      gameOver: newPasses >= 2,
      winner: null,
      xTerritory: 0,
      oTerritory: 0,
    };
    if (newGs.gameOver) {
      const terr = goComputeTerritory(newGs.board);
      newGs.xTerritory = terr.x;
      newGs.oTerritory = terr.o;
      const xT =
        newGs.board.filter((c) => c === X).length + terr.x + newGs.capturesX;
      const oT =
        newGs.board.filter((c) => c === O).length +
        terr.o +
        newGs.capturesO +
        GO_KOMI;
      newGs.winner = xT > oT ? "Noir (Vous)" : "Blanc (IA)";
      setGs(newGs);
      setShowScore(true);
      return;
    }
    setGs(newGs);
    await fetchAI(newGs);
  }, [gs, thinking, fetchAI]);

  const statusLabel = gs.gameOver
    ? `Fin de partie — ${gs.winner} gagne !`
    : thinking
      ? "L'IA calcule…"
      : `Votre tour — Noir (${GO_SIZE}×${GO_SIZE})`;

  // Calcul des libertés pour l'affichage
  const atariGroups = new Set<number>();
  if (!thinking && !gs.gameOver) {
    const visited = new Set<number>();
    gs.board.forEach((c, i) => {
      if (c !== 0 && !visited.has(i)) {
        const grp = goGetGroup(gs.board, i);
        grp.forEach((s) => visited.add(s));
        if (goGetLiberties(gs.board, grp).size === 1)
          grp.forEach((s) => atariGroups.add(s));
      }
    });
  }

  return (
    <div className="hub-game-wrap">
      {showScore && (
        <GoScoreModal state={gs} onClose={() => setShowScore(false)} />
      )}

      <div className="hub-game-header">
        <button className="hub-back-btn" onClick={onBack}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Hub
        </button>
        <h2 className="hub-game-title go-accent">Jeu de Go</h2>
        <ResetBtn onClick={reset} />
      </div>

      <GameStatusBar label={statusLabel} />

      {/* Compteurs de captures */}
      <div className="go-captures">
        <div className="go-capture-pill black">
          <span className="go-stone-dot black-dot" />
          Noir : {gs.capturesX} cap.
        </div>
        <div className="go-captures-sep">·</div>
        <div className="go-capture-pill white">
          <span className="go-stone-dot white-dot" />
          Blanc : {gs.capturesO} cap.
        </div>
        <button
          className="go-pass-btn"
          onClick={handlePass}
          disabled={thinking || gs.gameOver || gs.turn !== X}
        >
          Passer
        </button>
      </div>

      {/* Plateau Go */}
      <div className="go-board-container" style={{ position: "relative" }}>
        <div className={`go-board${thinking ? " is-thinking" : ""}`}>
          {/* SVG unique : lignes + hoshi + zones cliquables parfaitement alignées */}
          <svg
            className="go-svg"
            viewBox={`0 0 ${(GO_SIZE - 1) * 44 + 44} ${(GO_SIZE - 1) * 44 + 44}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* ── Lignes horizontales ── */}
            {Array.from({ length: GO_SIZE }, (_, r) => (
              <line
                key={`h${r}`}
                x1={22}
                y1={22 + r * 44}
                x2={22 + (GO_SIZE - 1) * 44}
                y2={22 + r * 44}
                stroke="rgba(180,150,80,0.35)"
                strokeWidth="1"
              />
            ))}
            {/* ── Lignes verticales ── */}
            {Array.from({ length: GO_SIZE }, (_, c) => (
              <line
                key={`v${c}`}
                x1={22 + c * 44}
                y1={22}
                x2={22 + c * 44}
                y2={22 + (GO_SIZE - 1) * 44}
                stroke="rgba(180,150,80,0.35)"
                strokeWidth="1"
              />
            ))}
            {/* ── Points hoshi 9×9 : (2,2) (2,4) (2,6) (4,4) (6,2) (6,4) (6,6) ── */}
            {(
              [
                [2, 2],
                [2, 4],
                [2, 6],
                [4, 4],
                [6, 2],
                [6, 4],
                [6, 6],
              ] as [number, number][]
            ).map(([hr, hc], i) => (
              <circle
                key={`hoshi${i}`}
                cx={22 + hc * 44}
                cy={22 + hr * 44}
                r="3.5"
                fill="rgba(200,170,90,0.6)"
              />
            ))}
            {/* ── Intersections cliquables ── */}
            {gs.board.map((cell, idx) => {
              const row = Math.floor(idx / GO_SIZE);
              const col = idx % GO_SIZE;
              const cx = 22 + col * 44;
              const cy = 22 + row * 44;
              const isLast = idx === justPlaced;
              const isAtari = atariGroups.has(idx);
              const canPlay =
                cell === 0 &&
                !thinking &&
                !gs.gameOver &&
                gs.turn === X &&
                goIsValidMove(gs.board, idx, X, gs.koState);
              const isHov = hoverIdx === idx && cell === 0 && canPlay;

              return (
                <g key={idx}>
                  {/* Pierre noire */}
                  {cell === X && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="19"
                      fill="url(#blackStone)"
                      stroke={isAtari ? "#f87171" : "none"}
                      strokeWidth={isAtari ? 2 : 0}
                      style={{
                        filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.8))",
                      }}
                    >
                      {isLast && (
                        <animate
                          attributeName="r"
                          from="6"
                          to="19"
                          dur="0.18s"
                          fill="freeze"
                        />
                      )}
                    </circle>
                  )}
                  {/* Pierre blanche */}
                  {cell === O && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="19"
                      fill="url(#whiteStone)"
                      stroke={isAtari ? "#f87171" : "rgba(0,0,0,0.25)"}
                      strokeWidth={isAtari ? 2 : 0.5}
                      style={{
                        filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.5))",
                      }}
                    >
                      {isLast && (
                        <animate
                          attributeName="r"
                          from="6"
                          to="19"
                          dur="0.18s"
                          fill="freeze"
                        />
                      )}
                    </circle>
                  )}
                  {/* Marqueur dernier coup */}
                  {isLast && cell !== 0 && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5"
                      fill={
                        cell === X
                          ? "rgba(255,255,255,0.65)"
                          : "rgba(0,0,0,0.45)"
                      }
                    />
                  )}
                  {/* Pierre fantôme au survol */}
                  {isHov && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="17"
                      fill="rgba(200,200,200,0.35)"
                    />
                  )}
                  {/* Zone cliquable transparente */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="22"
                    fill="transparent"
                    style={{ cursor: canPlay ? "pointer" : "default" }}
                    onClick={() => canPlay && handleIntersectionClick(idx)}
                    onMouseEnter={() => setHoverIdx(idx)}
                    onMouseLeave={() => setHoverIdx(null)}
                  />
                </g>
              );
            })}
            {/* ── Dégradés pour les pierres ── */}
            <defs>
              <radialGradient id="blackStone" cx="38%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#5a5a5a" />
                <stop offset="55%" stopColor="#111111" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>
              <radialGradient id="whiteStone" cx="38%" cy="28%" r="65%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#e0e0e0" />
                <stop offset="100%" stopColor="#aaaaaa" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        {thinking && <ThinkingOverlay text="L'IA évalue le goban…" />}
      </div>

      {/* Bouton score */}
      {gs.gameOver && (
        <button
          className="go-show-score-btn"
          onClick={() => setShowScore(true)}
        >
          Voir le score détaillé
        </button>
      )}

      {/* Légende coordonnées */}
      <div className="go-legend">
        <span>⚫ Noir = Vous (1er)</span>
        <span>·</span>
        <span>⚪ Blanc = IA</span>
        <span>·</span>
        <span>Komi {GO_KOMI}</span>
      </div>
    </div>
  );
}
