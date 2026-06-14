import { useState } from "react";
import { GameType } from "@/domain/types";
import { GAMES } from "@/domain/constants";
import TicTacToeGame from "@/presentation/page/TicTacToeGame";
import FanoronaGame from "@/presentation/page/FanoronaGame";
import Puissance4Game from "@/presentation/page/Puissance4Game";
import GoGame from "./GoGame";

function HubHome({ onSelect }: { onSelect: (g: GameType) => void }) {
  return (
    <div className="hub-home">
      <section className="hub-hero">
        <h1 className="hub-title">
          Défiez l'Intelligence
          <br />
          <span className="hub-title-accent">Artificielle</span>
        </h1>
      </section>

      <section className="hub-grid">
        {GAMES.map(
          ({ id, title, tagline, desc, badge, accentClass, icon, cta }) => (
            <button
              key={id}
              className={`hub-card ${accentClass}`}
              onClick={() => onSelect(id)}
            >
              <div className="hub-card-badge">{badge}</div>
              <div className="hub-card-icon">{icon}</div>
              <div className="hub-card-body">
                <p className="hub-card-tagline">{tagline}</p>
                <h3 className="hub-card-title">{title}</h3>
                <p className="hub-card-desc">{desc}</p>
              </div>
              <div className="hub-card-cta">{cta}</div>
            </button>
          ),
        )}
      </section>

      <footer className="hub-footer">
        <p>Moteur IA · FastAPI · React · TypeScript</p>
      </footer>
    </div>
  );
}

// ─── ROOT COMPONENT ────────────────────────────────────────────────
export default function GameHub() {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  if (activeGame === "tictactoe")
    return <TicTacToeGame onBack={() => setActiveGame(null)} />;
  if (activeGame === "fanorona")
    return <FanoronaGame onBack={() => setActiveGame(null)} />;
  if (activeGame === "puissance4")
    return <Puissance4Game onBack={() => setActiveGame(null)} />;
  if (activeGame === "go") return <GoGame onBack={() => setActiveGame(null)} />;

  return <HubHome onSelect={setActiveGame} />;
}
