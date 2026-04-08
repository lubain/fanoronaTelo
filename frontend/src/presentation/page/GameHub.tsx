import { useEffect, useState } from "react";
// Importez vos jeux ici (ajustez les chemins selon votre structure)
import { wakeUpServer } from "@/game/api";
import TicTacToe from "@/presentation/components/TicTacToe";
import FanoronaTelo from "@/presentation/components/FanoronaTelo";
import Puissance4 from "@/presentation/components/Puissance4";

// Définition des types de jeux disponibles
type GameType = "tictactoe" | "fanorona" | "puissance4" | null;

const GameHub = () => {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const wakeServer = async () => {
      try {
        await wakeUpServer(controller.signal);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Wake-up server error:", error);
        }
      } finally {
        window.clearTimeout(fallbackTimer);
        setIsBooting(false);
      }
    };

    const fallbackTimer = window.setTimeout(() => {
      setIsBooting(false);
      controller.abort();
    }, 7000);

    void wakeServer();

    return () => {
      window.clearTimeout(fallbackTimer);
      controller.abort();
    };
  }, []);

  if (isBooting) {
    return (
      <div className="min-h-screen bg-color text-white font-sans px-4">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
            <span className="thinking-spinner h-9 w-9" aria-hidden="true" />
          </div>
          <h1 className="mb-3 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Préparation de l'arcade
          </h1>
          <p className="max-w-md text-base text-slate-300">
            Réveil du serveur en cours pour éviter un premier chargement trop
            long au lancement d'une partie.
          </p>
        </div>
      </div>
    );
  }

  // --- RENDU DU JEU ACTIF ---
  // Si un jeu est sélectionné, on l'affiche avec un bouton de retour
  if (activeGame) {
    return (
      <div className="min-h-screen bg-color text-white font-sans p-4 md:p-8">
        <button
          onClick={() => setActiveGame(null)}
          className="cursor-pointer mb-6 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium text-gray-300 hover:text-white"
        >
          <span>←</span> Retour au Hub
        </button>

        {/* On charge le composant correspondant */}
        {activeGame === "tictactoe" && <TicTacToe />}
        {activeGame === "fanorona" && <FanoronaTelo />}
        {activeGame === "puissance4" && <Puissance4 />}
      </div>
    );
  }

  // --- RENDU DE LA PAGE D'ACCUEIL ---
  return (
    <div className="min-h-screen bg-color text-white font-sans py-12 px-4 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
          Arcade IA Stratégique
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Défiez notre intelligence artificielle sur 3 jeux de réflexion
          classiques. Sélectionnez un jeu ci-dessous pour commencer la partie.
        </p>
      </div>

      {/* Grille des jeux */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* CARTE : Tic Tac Toe */}
        <div
          onClick={() => setActiveGame("tictactoe")}
          className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:border-blue-500"
        >
          <div className="text-5xl mb-4">❌⭕</div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2 group-hover:text-blue-400 transition-colors">
            Tic-Tac-Toe
          </h2>
          <p className="text-gray-400 text-sm mb-6 line-clamp-3">
            Le grand classique incontournable. Alignez 3 symboles avant l'IA.
            Simple à apprendre, idéal pour s'échauffer.
          </p>
          <span className="inline-block px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg font-semibold text-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
            Jouer au Morpion →
          </span>
        </div>

        {/* CARTE : Fanorona Telo */}
        <div
          onClick={() => setActiveGame("fanorona")}
          className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500"
        >
          <div className="text-5xl mb-4">🇲🇬♟️</div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2 group-hover:text-emerald-400 transition-colors">
            Fanorona Telo
          </h2>
          <p className="text-gray-400 text-sm mb-6 line-clamp-3">
            Le jeu de stratégie traditionnel malgache. Placez vos 3 pions puis
            déplacez-les sur les lignes pour aligner une victoire.
          </p>
          <span className="inline-block px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg font-semibold text-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            Découvrir ce jeu →
          </span>
        </div>

        {/* CARTE : Puissance 4 */}
        <div
          onClick={() => setActiveGame("puissance4")}
          className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:border-red-500"
        >
          <div className="text-5xl mb-4">🔴🟡</div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2 group-hover:text-red-400 transition-colors">
            Puissance 4
          </h2>
          <p className="text-gray-400 text-sm mb-6 line-clamp-3">
            Laissez tomber vos jetons et anticipez la gravité. Alignez 4 jetons
            horizontalement, verticalement ou en diagonale.
          </p>
          <span className="inline-block px-4 py-2 bg-red-500/10 text-red-400 rounded-lg font-semibold text-sm group-hover:bg-red-500 group-hover:text-white transition-colors">
            Lancer les jetons →
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameHub;
