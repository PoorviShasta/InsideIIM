import { Routes, Route, NavLink, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Research from "./pages/Research.jsx";
import History from "./pages/History.jsx";
import About from "./pages/About.jsx";

export default function App() {
  return (
    <div className="shell">
      <nav className="navbar">
        <Link to="/" className="brand">
          <span className="brand-mark">IS</span>
          Invest<span className="brand-accent">Scout</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/research">Research</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/about">How it works</NavLink>
        </div>
        <Link to="/research" className="nav-cta">
          New research
        </Link>
      </nav>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer>
        <div className="footer-inner">
          <span className="footer-brand">InvestScout</span>
          <span>
            AI research demo, not financial advice. Built with LangGraph.js,
            Groq and Tavily.
          </span>
        </div>
      </footer>
    </div>
  );
}
