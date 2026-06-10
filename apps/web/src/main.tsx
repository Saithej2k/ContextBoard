import React from "react";
import ReactDOM from "react-dom/client";
import { pilotMetrics } from "@contextboard/shared";
import "./styles.css";

function App() {
  return (
    <main className="shell">
      <section className="workspace">
        <p className="eyebrow">ContextBoard</p>
        <h1>Collaborative notes and action review workspace</h1>
        <p>
          Demo workspace seeded with {pilotMetrics.betaUsers} beta users,{" "}
          {pilotMetrics.notesCaptured.toLocaleString()} notes, and{" "}
          {pilotMetrics.acceptedTasks} tracked tasks.
        </p>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

