"""
goNode.py — Jeu de Go (grille 9×9) pour l'algorithme Alpha-Beta

Règles implémentées :
  • Placement d'une pierre sur une case vide
  • Capture : un groupe sans liberté est retiré après chaque coup
  • Règle de Ko : interdiction de rejouer l'état précédent exactement
  • Suicide interdit : un coup qui prive son propre groupe de libertés sans capturer est invalide
  • Fin de partie : deux passes consécutives → calcul du territoire (règle chinoise)
  • Heuristique : libertés, influence, menaces de capture, territory

Convention :
  board[i] = 0 (vide) | 1 (X_PLAYER, Noir) | -1 (O_PLAYER, Blanc)
  index i = ligne * SIZE + colonne
"""

from typing import List, Optional, Set, Tuple
from gameNode import GameNode
from constant import X_PLAYER, O_PLAYER

SIZE = 9          # Taille de la grille (9×9 pour une partie rapide mais riche)
PASS_MOVE = -1    # Valeur spéciale : passer son tour


# ─── Utilitaires bas niveau ────────────────────────────────────────────────

def neighbors(idx: int) -> List[int]:
    """Retourne les voisins orthogonaux (haut, bas, gauche, droite) d'une case."""
    row, col = divmod(idx, SIZE)
    result = []
    if row > 0:        result.append((row - 1) * SIZE + col)
    if row < SIZE - 1: result.append((row + 1) * SIZE + col)
    if col > 0:        result.append(row * SIZE + col - 1)
    if col < SIZE - 1: result.append(row * SIZE + col + 1)
    return result


def get_group(board: List[int], idx: int) -> Set[int]:
    """BFS : retourne l'ensemble des indices du groupe connecté à idx."""
    color = board[idx]
    if color == 0:
        return set()
    visited: Set[int] = set()
    stack = [idx]
    while stack:
        cur = stack.pop()
        if cur in visited:
            continue
        visited.add(cur)
        for n in neighbors(cur):
            if board[n] == color and n not in visited:
                stack.append(n)
    return visited


def get_liberties(board: List[int], group: Set[int]) -> Set[int]:
    """Retourne les libertés (cases vides adjacentes) d'un groupe."""
    libs: Set[int] = set()
    for idx in group:
        for n in neighbors(idx):
            if board[n] == 0:
                libs.add(n)
    return libs


def apply_captures(board: List[int], last_played: int, opponent: int) -> List[int]:
    """
    Après avoir posé une pierre en last_played, retire les groupes adverses
    sans liberté. Retourne le nouveau plateau.
    """
    b = list(board)
    for n in neighbors(last_played):
        if b[n] == opponent:
            grp = get_group(b, n)
            if not get_liberties(b, grp):
                for stone in grp:
                    b[stone] = 0
    return b


def is_valid_move(board: List[int], idx: int, player: int,
                  ko_state: Optional[Tuple[int, ...]]) -> bool:
    """
    Vérifie qu'un placement en idx est légal :
      1. Case vide
      2. Non-suicide (sauf si le coup capture)
      3. Non-Ko
    """
    if board[idx] != 0:
        return False

    # Simuler le coup
    b = list(board)
    b[idx] = player
    opponent = -player
    b = apply_captures(b, idx, opponent)

    # Règle suicide : si notre groupe n'a plus de liberté → coup invalide
    grp = get_group(b, idx)
    if not get_liberties(b, grp):
        return False

    # Règle Ko : interdiction de recréer le plateau précédent exactement
    if ko_state is not None and tuple(b) == ko_state:
        return False

    return True


def compute_territory(board: List[int]) -> Tuple[int, int]:
    """
    Calcule le territoire (méthode chinoise simplifiée) par flood-fill :
    - Chaque zone de cases vides entièrement entourée par X → territoire X
    - Idem pour O
    Retourne (territoire_X, territoire_O).
    """
    visited: Set[int] = set()
    x_territory = 0
    o_territory = 0

    for start in range(SIZE * SIZE):
        if board[start] != 0 or start in visited:
            continue

        # BFS sur la zone vide
        zone: Set[int] = set()
        borders: Set[int] = set()
        stack = [start]
        while stack:
            cur = stack.pop()
            if cur in zone:
                continue
            zone.add(cur)
            visited.add(cur)
            for n in neighbors(cur):
                if board[n] == 0 and n not in zone:
                    stack.append(n)
                elif board[n] != 0:
                    borders.add(board[n])

        if len(borders) == 1:
            owner = next(iter(borders))
            if owner == X_PLAYER:
                x_territory += len(zone)
            else:
                o_territory += len(zone)

    return x_territory, o_territory


# ─── GoNode ───────────────────────────────────────────────────────────────

class GoNode(GameNode['GoNode', int]):
    """
    Nœud de l'arbre de jeu pour le Go 9×9.

    Attributs supplémentaires par rapport à GameNode :
      ko_state      : état du plateau avant le dernier coup (pour la règle de Ko)
      passes        : nombre de passes consécutives (2 → fin de partie)
      captures_x    : pierres de O capturées par X (pour le score)
      captures_o    : pierres de X capturées par O
      last_move     : dernier indice joué (ou PASS_MOVE)
    """

    def __init__(
        self,
        board: Optional[List[int]] = None,
        turn: int = X_PLAYER,
        ko_state: Optional[Tuple[int, ...]] = None,
        passes: int = 0,
        captures_x: int = 0,
        captures_o: int = 0,
        last_move: int = PASS_MOVE,
    ):
        super().__init__(turn)
        self.board: List[int] = list(board) if board else [0] * (SIZE * SIZE)
        self.ko_state: Optional[Tuple[int, ...]] = ko_state
        self.passes: int = passes
        self.captures_x: int = captures_x
        self.captures_o: int = captures_o
        self.last_move: int = last_move

    # ── Clonage ──────────────────────────────────────────────────────────

    def clone(self) -> 'GoNode':
        return GoNode(
            board=self.board.copy(),
            turn=self.turn,
            ko_state=self.ko_state,
            passes=self.passes,
            captures_x=self.captures_x,
            captures_o=self.captures_o,
            last_move=self.last_move,
        )

    # ── Action : passer ──────────────────────────────────────────────────

    def pass_turn(self) -> 'GoNode':
        child = self.clone()
        child.turn = O_PLAYER if self.turn == X_PLAYER else X_PLAYER
        child.passes = self.passes + 1
        child.ko_state = None           # Le Ko se lève après une passe
        child.last_move = PASS_MOVE
        return child

    # ── Action : placer une pierre ────────────────────────────────────────

    def play(self, idx: int) -> 'GoNode':
        """Retourne un nouveau GoNode après avoir joué en idx."""
        child = self.clone()
        old_board = tuple(child.board)   # Mémorise pour Ko

        # Poser la pierre
        child.board[idx] = self.turn
        opponent = -self.turn

        # Capturer les groupes adverses sans liberté
        captured = []
        for n in neighbors(idx):
            if child.board[n] == opponent:
                grp = get_group(child.board, n)
                if not get_liberties(child.board, grp):
                    for stone in grp:
                        child.board[stone] = 0
                        captured.append(stone)

        # Mettre à jour les captures
        if self.turn == X_PLAYER:
            child.captures_x += len(captured)
        else:
            child.captures_o += len(captured)

        child.ko_state = old_board
        child.passes = 0
        child.turn = opponent
        child.last_move = idx
        return child

    # ── Successeurs ───────────────────────────────────────────────────────

    def get_successors(self) -> List['GoNode']:
        """
        Génère tous les coups légaux + la passe.
        Pour limiter le facteur de branchement dans Alpha-Beta,
        on priorise les coups intéressants (adjacents aux pierres existantes)
        puis on ajoute les autres.
        """
        children: List[GoNode] = []

        # Partition : coups prioritaires (adjacent à une pierre) vs le reste
        adjacent: List[int] = []
        others: List[int] = []

        for idx in range(SIZE * SIZE):
            if self.board[idx] != 0:
                continue
            if not is_valid_move(self.board, idx, self.turn, self.ko_state):
                continue
            if any(self.board[n] != 0 for n in neighbors(idx)):
                adjacent.append(idx)
            else:
                others.append(idx)

        for idx in adjacent + others:
            children.append(self.play(idx))

        # Toujours ajouter la passe en dernier recours
        children.append(self.pass_turn())
        return children

    # ── Fin de partie ─────────────────────────────────────────────────────

    def is_terminal(self) -> bool:
        """Fin de partie si deux passes consécutives."""
        return self.passes >= 2

    # ── Score final (règle chinoise) ──────────────────────────────────────

    def final_score(self, player: int) -> float:
        """
        Score final = pierres vivantes + territoire + captures.
        Komi de 6.5 points pour le Blanc (O_PLAYER).
        """
        x_stones = self.board.count(X_PLAYER)
        o_stones = self.board.count(O_PLAYER)
        x_terr, o_terr = compute_territory(self.board)

        x_score = x_stones + x_terr + self.captures_x
        o_score = o_stones + o_terr + self.captures_o + 6.5   # Komi

        if player == X_PLAYER:
            return x_score - o_score
        return o_score - x_score

    # ── Heuristique ───────────────────────────────────────────────────────

    def evaluate(self, player: int) -> float:
        """
        Heuristique multi-critères pour Alpha-Beta (positions non terminales).

        Critères (par ordre d'importance) :
          1. Capturer / éviter d'être capturé (libertés critiques)
          2. Influence spatiale (nombre de libertés totales de mes groupes)
          3. Menaces de capture (groupes adverses à 1 liberté = atari)
          4. Estimation du territoire (flood-fill léger)
          5. Score de capture accumulé
        """
        if self.is_terminal():
            return self.final_score(player)

        opponent = -player
        score = 0.0

        # ── 1. Libertés de mes groupes vs adversaire ──────────────────────
        my_total_liberties = 0
        opp_total_liberties = 0
        visited_my: Set[int] = set()
        visited_opp: Set[int] = set()

        for idx in range(SIZE * SIZE):
            if self.board[idx] == player and idx not in visited_my:
                grp = get_group(self.board, idx)
                visited_my |= grp
                libs = get_liberties(self.board, grp)
                n_libs = len(libs)
                my_total_liberties += n_libs
                # Groupes en danger critique (atari = 1 liberté)
                if n_libs == 1:
                    score -= 50 * len(grp)   # Punir sévèrement les groupes en atari
                elif n_libs == 2:
                    score -= 10 * len(grp)

            elif self.board[idx] == opponent and idx not in visited_opp:
                grp = get_group(self.board, idx)
                visited_opp |= grp
                libs = get_liberties(self.board, grp)
                n_libs = len(libs)
                opp_total_liberties += n_libs
                # Groupes adverses en atari → opportunité de capture
                if n_libs == 1:
                    score += 40 * len(grp)
                elif n_libs == 2:
                    score += 8 * len(grp)

        score += (my_total_liberties - opp_total_liberties) * 2

        # ── 2. Contrôle du centre ─────────────────────────────────────────
        # Le centre d'un 9×9 est particulièrement stratégique
        center_zone = [
            idx for idx in range(SIZE * SIZE)
            if 2 <= idx // SIZE <= 6 and 2 <= idx % SIZE <= 6
        ]
        for idx in center_zone:
            if self.board[idx] == player:
                score += 3
            elif self.board[idx] == opponent:
                score -= 3

        # ── 3. Estimation du territoire (simplifié) ───────────────────────
        x_terr, o_terr = compute_territory(self.board)
        if player == X_PLAYER:
            score += (x_terr - o_terr) * 4
        else:
            score += (o_terr - x_terr) * 4

        # ── 4. Pierres capturées (avantage matériel) ──────────────────────
        if player == X_PLAYER:
            score += (self.captures_x - self.captures_o) * 10
        else:
            score += (self.captures_o - self.captures_x) * 10

        # ── 5. Nombre de pierres posées ───────────────────────────────────
        my_stones = self.board.count(player)
        opp_stones = self.board.count(opponent)
        score += (my_stones - opp_stones) * 1.5

        return score