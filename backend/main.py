from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from ticTacToeNode import TicTacToeNode
from fanoronaTelo import FanoronaTeloNode
from puissance4 import Puissance4Node
from goNode import GoNode, SIZE as GO_SIZE, PASS_MOVE, compute_territory
from alpha_beta import alpha_beta
from typing import List, Optional
from pydantic import BaseModel, Field
import math
from constant import O_PLAYER, X_PLAYER, GO_KOMI

app = FastAPI(
    title="Strategy AI Games API",
    description="Moteur IA Alpha-Beta pour Tic-Tac-Toe, Fanorona Telo, Puissance 4 et Go 9×9",
    version="2.0.0"
)

allowed_origins = [
    origin.strip()
    for origin in settings.frontend_urls.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
#  SCHÉMAS COMMUNS
# ═══════════════════════════════════════════════════════════════════════════

class GameRequest(BaseModel):
    board: List[int]
    turn: int

class GameResponse(BaseModel):
    best_board: List[int]
    next_turn: int
    message: str


# ═══════════════════════════════════════════════════════════════════════════
#  TIC-TAC-TOE
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/best-move", response_model=GameResponse)
def get_best_move(request: GameRequest):
    if request.turn not in [X_PLAYER, O_PLAYER]:
        raise HTTPException(status_code=400, detail="Le tour doit être 1 ou -1.")
    if any(cell not in [0, 1, -1] for cell in request.board):
        raise HTTPException(status_code=400, detail="Le plateau ne peut contenir que 0, 1, ou -1.")

    node = TicTacToeNode(board=request.board, turn=request.turn)

    if node.is_terminal():
        raise HTTPException(status_code=400, detail="La partie est déjà terminée sur ce plateau.")

    alpha_beta(node, depth=9, alpha=-math.inf, beta=math.inf, maximizing_player=node.turn)

    if node.best is None:
        raise HTTPException(status_code=500, detail="Impossible de trouver un mouvement valide.")

    return GameResponse(
        best_board=node.best.board,
        next_turn=node.best.turn,
        message="Meilleur coup calculé avec succès."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  FANORONA TELO
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/fanorona-move", response_model=GameResponse)
def get_fanorona_move(request: GameRequest):
    node = FanoronaTeloNode(board=request.board, turn=request.turn)

    if node.is_terminal():
        raise HTTPException(status_code=400, detail="Partie finie.")

    alpha_beta(node, depth=9, alpha=-math.inf, beta=math.inf, maximizing_player=node.turn)

    return GameResponse(
        best_board=node.best.board,
        next_turn=node.best.turn,
        message="Meilleur coup calculé avec succès."
    )


# ═══════════════════════════════════════════════════════════════════════════
#  PUISSANCE 4
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/puissance4-move")
def get_puissance4_move(request: GameRequest):
    node = Puissance4Node(board=request.board, turn=request.turn)

    if node.is_terminal():
        return {"best_board": node.board, "next_turn": node.turn, "message": "Terminé"}

    successors = node.get_successors()
    if not successors:
        return {"best_board": node.board, "next_turn": node.turn, "message": "Grille pleine"}

    try:
        alpha_beta(node, depth=5, alpha=-float('inf'), beta=float('inf'), maximizing_player=node.turn)
        if node.best is None:
            node.best = successors[0]
        return {"best_board": node.best.board, "next_turn": node.best.turn}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════
#  JEU DE GO 9×9
# ═══════════════════════════════════════════════════════════════════════════

class GoRequest(BaseModel):
    board: List[int] = Field(
        ...,
        description=f"Plateau {GO_SIZE}×{GO_SIZE} = {GO_SIZE * GO_SIZE} entiers. 0=vide, 1=Noir(X), -1=Blanc(O)"
    )
    turn: int = Field(..., description="Joueur courant : 1 (Noir) ou -1 (Blanc)")
    ko_state: Optional[List[int]] = Field(
        None,
        description="État du plateau avant le coup précédent (règle de Ko). Null si pas de Ko actif."
    )
    passes: int = Field(0, ge=0, le=1, description="Nombre de passes consécutives en cours (0 ou 1)")
    captures_x: int = Field(0, ge=0, description="Pierres adverses capturées par Noir")
    captures_o: int = Field(0, ge=0, description="Pierres adverses capturées par Blanc")


class GoResponse(BaseModel):
    best_board: List[int]
    next_turn: int
    ko_state: Optional[List[int]]
    passes: int
    captures_x: int
    captures_o: int
    is_pass: bool
    last_move: int
    message: str


@app.post("/go-move", response_model=GoResponse, tags=["Go"])
def get_go_move(request: GoRequest):
    """
    Calcule le meilleur coup de l'IA au Jeu de Go (grille 9×9).

    - Règles : placement, capture de groupes, Ko, suicide interdit
    - Algorithme : Alpha-Beta profondeur 3
    - Score : règle chinoise avec Komi 6.5 pour le Blanc
    - L'IA peut passer (is_pass=true) si aucun coup n'est jugé rentable
    """
    expected = GO_SIZE * GO_SIZE
    if len(request.board) != expected:
        raise HTTPException(
            status_code=400,
            detail=f"Le plateau Go doit contenir {expected} cases ({GO_SIZE}×{GO_SIZE})."
        )
    if request.turn not in [X_PLAYER, O_PLAYER]:
        raise HTTPException(status_code=400, detail="Le tour doit être 1 (Noir) ou -1 (Blanc).")
    if any(cell not in [0, 1, -1] for cell in request.board):
        raise HTTPException(status_code=400, detail="Le plateau ne peut contenir que 0, 1 ou -1.")
    if request.ko_state and len(request.ko_state) != expected:
        raise HTTPException(status_code=400, detail="ko_state doit avoir la même taille que board.")

    ko_tuple = tuple(request.ko_state) if request.ko_state else None

    node = GoNode(
        board=request.board,
        turn=request.turn,
        ko_state=ko_tuple,
        passes=request.passes,
        captures_x=request.captures_x,
        captures_o=request.captures_o,
    )

    # Partie déjà terminée (deux passes consécutives)
    if node.is_terminal():
        x_terr, o_terr = compute_territory(node.board)
        return GoResponse(
            best_board=node.board,
            next_turn=node.turn,
            ko_state=None,
            passes=node.passes,
            captures_x=node.captures_x,
            captures_o=node.captures_o,
            is_pass=True,
            last_move=PASS_MOVE,
            message=f"Partie terminée. Territoire Noir={x_terr}, Blanc={o_terr}."
        )

    try:
        alpha_beta(
            node,
            depth=3,
            alpha=-math.inf,
            beta=math.inf,
            maximizing_player=node.turn
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Alpha-Beta : {e}")

    # Fallback : passer si aucun meilleur coup trouvé
    best = node.best if node.best is not None else node.pass_turn()
    is_pass = best.last_move == PASS_MOVE

    row, col = divmod(best.last_move, GO_SIZE) if not is_pass else (-1, -1)
    msg = "L'IA passe son tour." if is_pass else f"L'IA joue en ({row}, {col})."

    return GoResponse(
        best_board=best.board,
        next_turn=best.turn,
        ko_state=list(node.board) if not is_pass else None,
        passes=best.passes,
        captures_x=best.captures_x,
        captures_o=best.captures_o,
        is_pass=is_pass,
        last_move=best.last_move,
        message=msg
    )


class GoScoreRequest(BaseModel):
    board: List[int]
    captures_x: int = Field(0, ge=0)
    captures_o: int = Field(0, ge=0)


class GoScoreResponse(BaseModel):
    x_stones: int
    o_stones: int
    x_territory: int
    o_territory: int
    x_total: float
    o_total: float
    komi: float
    winner: str
    margin: float


@app.post("/go-score", response_model=GoScoreResponse, tags=["Go"])
def get_go_score(request: GoScoreRequest):
    """
    Calcule le score final d'une partie de Go terminée (règle chinoise).
    Score = pierres vivantes + territoire + captures. Komi 6.5 pour le Blanc.
    """
    if len(request.board) != GO_SIZE * GO_SIZE:
        raise HTTPException(status_code=400, detail=f"Plateau invalide : {GO_SIZE * GO_SIZE} cases attendues.")

    x_stones = request.board.count(X_PLAYER)
    o_stones = request.board.count(O_PLAYER)
    x_terr, o_terr = compute_territory(request.board)

    x_total = float(x_stones + x_terr + request.captures_x)
    o_total = float(o_stones + o_terr + request.captures_o) + GO_KOMI

    winner = "Noir (X)" if x_total > o_total else "Blanc (O)"
    margin = abs(x_total - o_total)

    return GoScoreResponse(
        x_stones=x_stones,
        o_stones=o_stones,
        x_territory=x_terr,
        o_territory=o_terr,
        x_total=x_total,
        o_total=o_total,
        komi=GO_KOMI,
        winner=winner,
        margin=margin
    )