import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Research from "./pages/Research.jsx";
import History from "./pages/History.jsx";
import About from "./pages/About.jsx";

export default function App() {
  return (
    <div className="shell">
      <nav className="navbar">
        <NavLink to="/" className="brand">
          Invest<span>Scout</span>
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/research">Research</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/about">How it works</NavLink>
        </div>
      </nav>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer>Not financial advice. Built with LangGraph.js, Groq and Tavily.</footer>
    </div>
  );
}
