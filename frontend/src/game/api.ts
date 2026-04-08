import { O } from "./FanoronaTelo";

const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

export async function wakeUpServer(signal?: AbortSignal) {
  const response = await fetch(`${apiBaseUrl}/health`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Wake-up failed: ${response.status}`);
  }

  return response.json();
}

export class GetBestMoveIa {
  async bestMoveTicTacToe(newBoard: number[], nextTurn: number) {
    try {
      const response = await fetch(`${apiBaseUrl}/best-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: newBoard, turn: nextTurn }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (e) {
      console.error(e);
    }
  }

  async bestMovePuissance4(board: number[]) {
    try {
      const response = await fetch(`${apiBaseUrl}/puissance4-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, turn: O }),
      });
      return await response.json();
    } catch (error) {
      console.error("Erreur IA:", error);
    }
  }

  async bestMoveFanorona(newBoard: number[], nextTurn: number) {
    try {
      const res = await fetch(`${apiBaseUrl}/fanorona-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: newBoard, turn: nextTurn }),
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  }
}
