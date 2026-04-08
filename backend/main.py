from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from ticTacToeNode import TicTacToeNode
from fanoronaTelo import FanoronaTeloNode
from puissance4 import Puissance4Node
from alpha_beta import alpha_beta
from typing import List
from pydantic import BaseModel, Field
import math
from constant import O_PLAYER, X_PLAYER

app = FastAPI()

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

# Schéma de requête attendu
class GameRequest(BaseModel):
    board: List[int]
    turn: int

# Schéma de réponse
class GameResponse(BaseModel):
    best_board: List[int]
    next_turn: int
    message: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/best-move", response_model=GameResponse)
def get_best_move(request: GameRequest):
    # Validation personnalisée pour le contenu du tableau et le joueur
    if request.turn not in [X_PLAYER, O_PLAYER]:
        raise HTTPException(status_code=400, detail="Le tour doit être 1 ou -1.")
    if any(cell not in [0, 1, -1] for cell in request.board):
        raise HTTPException(status_code=400, detail="Le plateau ne peut contenir que 0, 1, ou -1.")

    # Création du nœud racine
    node = TicTacToeNode(board=request.board, turn=request.turn)

    # Vérifier si la partie est déjà terminée
    if node.is_terminal():
        raise HTTPException(status_code=400, detail="La partie est déjà terminée sur ce plateau.")

    # Exécution de l'algorithme (profondeur de 9 pour Tic-Tac-Toe)
    alpha_beta(node, depth=9, alpha=-math.inf, beta=math.inf, maximizing_player=node.turn)

    if node.best is None:
        raise HTTPException(status_code=500, detail="Impossible de trouver un mouvement valide.")

    return GameResponse(
        best_board=node.best.board,
        next_turn=node.best.turn,
        message="Meilleur coup calculé avec succès."
    )

@app.post("/fanorona-move")
def get_fanorona_move(request: GameRequest):
    node = FanoronaTeloNode(board=request.board, turn=request.turn)
    
    if node.is_terminal():
        raise HTTPException(status_code=400, detail="Partie finie")

    alpha_beta(node, depth=9, alpha=-math.inf, beta=math.inf, maximizing_player=node.turn)

    print(node.best.turn)

    return GameResponse(
        best_board=node.best.board,
        next_turn=node.best.turn,
        message="Meilleur coup calculé avec succès."
    )

@app.post("/puissance4-move")
def get_puissance4_move(request: GameRequest):
    print(f"Puissance 4 - Requête reçue - Tour: {request.turn}")
    
    node = Puissance4Node(board=request.board, turn=request.turn)
    
    if node.is_terminal():
        return {"best_board": node.board, "next_turn": node.turn, "message": "Terminé"}

    successors = node.get_successors()
    if not successors:
        return {"best_board": node.board, "next_turn": node.turn, "message": "Grille pleine"}

    try:
        alpha_beta(node, depth=5, alpha=-float('inf'), beta=float('inf'), maximizing_player=node.turn)
        
        # Sécurité vue précédemment
        if node.best is None:
            node.best = successors[0]
            
        return {
            "best_board": node.best.board,
            "next_turn": node.best.turn
        }
    except Exception as e:
        print(f"ERREUR ALPHA-BETA P4: {e}")
        raise HTTPException(status_code=500, detail=str(e))
