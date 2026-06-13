X_PLAYER = 1
O_PLAYER = -1
PIECES_PER_PLAYER = 3

# Combinaisons gagnantes (Tic-Tac-Toe / Fanorona)
LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Horizontales
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Verticales
    [0, 4, 8], [2, 4, 6]              # Diagonales
]

# Adjacences Fanorona Telo (corrigées)
ADJACENCES = [
    [1, 3, 4],                   # 0 coin haut-gauche
    [0, 2, 4],                   # 1 bord haut (pas de diagonale)
    [1, 4, 5],                   # 2 coin haut-droite
    [0, 4, 6],                   # 3 bord gauche (pas de diagonale)
    [0, 1, 2, 3, 5, 6, 7, 8],   # 4 centre (tous)
    [2, 4, 8],                   # 5 bord droite (pas de diagonale)
    [3, 4, 7],                   # 6 coin bas-gauche
    [4, 6, 8],                   # 7 bord bas (pas de diagonale)
    [4, 5, 7],                   # 8 coin bas-droite
]

# Go
GO_SIZE = 9
GO_PASS = -1
GO_KOMI = 6.5