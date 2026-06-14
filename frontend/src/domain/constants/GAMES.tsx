import { GameType } from "../types/GameType";

export const GAMES = [
  {
    id: "tictactoe" as GameType,
    title: "Tic-Tac-Toe",
    tagline: "Le grand classique",
    desc: "Alignez 3 symboles avant l'IA sur une grille 3×3. Simple à apprendre, impossible à maîtriser face à Alpha-Beta.",
    badge: "Facile",
    accentClass: "card-ttt",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" />
        <circle cx="36" cy="12" r="6" strokeWidth="2" />
        <path d="M8 28l8 8M16 28l-8 8" strokeLinecap="round" />
        <circle cx="36" cy="36" r="6" strokeWidth="2" />
      </svg>
    ),
    cta: "Jouer →",
  },
  {
    id: "fanorona" as GameType,
    title: "Fanorona Telo",
    tagline: "Jeu traditionnel malgache",
    desc: "Placez vos 3 pions sur la grille, puis déplacez-les le long des lignes pour aligner 3 en ligne.",
    badge: "Stratégie",
    accentClass: "card-fanorona",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="5" />
        <circle cx="36" cy="12" r="5" />
        <circle cx="12" cy="36" r="5" />
        <circle cx="36" cy="36" r="5" />
        <circle cx="24" cy="24" r="5" />
        <line x1="12" y1="12" x2="36" y2="36" />
        <line x1="36" y1="12" x2="12" y2="36" />
        <line x1="12" y1="12" x2="36" y2="12" />
        <line x1="12" y1="36" x2="36" y2="36" />
        <line x1="12" y1="12" x2="12" y2="36" />
        <line x1="36" y1="12" x2="36" y2="36" />
      </svg>
    ),
    cta: "Découvrir →",
  },
  {
    id: "puissance4" as GameType,
    title: "Puissance 4",
    tagline: "La gravité comme alliée",
    desc: "Lâchez vos jetons et anticipez. Alignez 4 en horizontal, vertical ou diagonal avant l'IA.",
    badge: "Classique",
    accentClass: "card-p4",
    icon: (
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="4" y="20" width="40" height="24" rx="4" />
        <circle cx="14" cy="32" r="4" fill="currentColor" opacity=".25" />
        <circle cx="24" cy="32" r="4" fill="currentColor" opacity=".25" />
        <circle cx="34" cy="32" r="4" fill="currentColor" opacity=".25" />
        <circle cx="14" cy="14" r="5" />
        <circle cx="24" cy="8" r="5" />
      </svg>
    ),
    cta: "Lancer →",
  },
  {
    id: "go" as GameType,
    title: "Jeu de Go",
    tagline: "L'art de l'influence",
    desc: "Posez vos pierres sur un goban 9×9, capturez les groupes adverses et contrôlez le territoire. Ko, atari, komi — la profondeur du Go.",
    badge: "Expert",
    accentClass: "card-go",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity=".4"
        />
        <line
          x1="4"
          y1="17"
          x2="44"
          y2="17"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".4"
        />
        <line
          x1="4"
          y1="31"
          x2="44"
          y2="31"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".4"
        />
        <line
          x1="17"
          y1="4"
          x2="17"
          y2="44"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".4"
        />
        <line
          x1="31"
          y1="4"
          x2="31"
          y2="44"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".4"
        />
        <circle cx="17" cy="17" r="6" fill="currentColor" />
        <circle
          cx="31"
          cy="31"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" opacity=".5" />
      </svg>
    ),
    cta: "Jouer →",
  },
];
