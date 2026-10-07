import { Link } from 'react-router-dom'
import { CATEGORIES } from '../constants'
import '../landing.css'

const ICONS = { 'Books': '📚', 'Stationery': '✏️', 'Paper & Cardboard': '📄', 'Clothes': '👕', 'Furniture': '🪑', 'Plastic': '🧴', 'Metal': '🔩', 'Glass': '🪟', 'E-Waste': '💻', 'Batteries': '🔋', 'Other': '📦' }
const STEPS = [['Post', 'List items you no longer need: books, electronics, furniture, or recyclables.'],
  ['Browse', 'Explore available resources by category, condition, or location on campus.'],
  ['Request', 'Send a request to the lister and coordinate details securely.'],
  ['Handover', 'Meet on campus for a safe, convenient exchange or pickup.'],
  ['Reuse', 'Give the item a second life: reduce waste and help someone out.']]
const TIPS = [['♻️', 'Reuse first', 'Before recycling, check if someone on campus can still use the item.'],
  ['🔋', 'E-waste & batteries', 'Never throw them in regular bins. List them under Recycle for safe disposal.'],
  ['📄', 'Sort your waste', 'Keep paper, plastic, metal and glass separate so more of it can be recycled.']]

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <a href="#top" className="lp-logo">♻️ Waste<b>2</b>Resources</a>
        <nav className="lp-links">
          <a href="#top">Home</a><Link to="/browse">Browse Resources</Link><a href="#how">How It Works</a><a href="#learn">Learn & Recycle</a>
        </nav>
        <div className="lp-cta"><Link to="/login" className="lp-login">Log In</Link><Link to="/register" className="btn small">Get Started</Link></div>
      </header>

      <section id="top" className="hero">
        <span className="pill">🌱 CAMPUS SUSTAINABILITY INITIATIVE</span>
        <h1>Give Unused Items<br />a Second Life.</h1>
        <p>College students, faculty, and staff can donate, exchange, reuse, and responsibly recycle unwanted resources, all within our campus community.</p>
        <div className="row center-row"><Link to="/register" className="btn">Start Sharing →</Link><a href="#how" className="btn outline plain">How It Works</a></div>
      </section>

      <section id="how" className="sec">
        <span className="eyebrow">HOW IT WORKS</span><h2>Five Simple Steps to Reuse</h2>
        <p className="muted">Listing or finding resources is quick and easy, from posting to handover.</p>
        <div className="steps">{STEPS.map(([t, d], i) => <div key={t} className="step"><span className="n">{i + 1}</span><h4>{t}</h4><p className="muted small">{d}</p></div>)}</div>
      </section>

      <section className="sec alt">
        <span className="eyebrow">BROWSE BY CATEGORY</span><h2>Resource Categories</h2>
        <p className="muted">Find what you need or list what you no longer use.</p>
        <div className="cats">{CATEGORIES.map(c => <Link to="/browse" key={c} className="cat"><span>{ICONS[c]}</span>{c}</Link>)}</div>
      </section>

      <section id="learn" className="sec">
        <span className="eyebrow">LEARN & RECYCLE</span><h2>Small Habits, Big Impact</h2>
        <div className="tips">{TIPS.map(([i, t, d]) => <div key={t} className="card"><div className="ti">{i}</div><h4>{t}</h4><p className="muted small">{d}</p></div>)}</div>
      </section>

      <section className="band">
        <h2>Ready to make a difference?</h2>
        <p>Join our growing campus community. List your unused items, find what you need, and help build a more sustainable college.</p>
        <div className="row center-row"><Link to="/register" className="btn">Create Your Account →</Link><a href="#how" className="btn outline light">Learn More</a></div>
      </section>

      <footer className="lp-foot">
        <div><div className="lp-logo light">♻️ Waste<b>2</b>Resources</div><p><i>From Waste to Resource — Reuse, Share & Recycle.</i></p>
          <p className="small">A college community platform for donating, exchanging, reusing and recycling resources responsibly.</p></div>
        <div><h5>Quick Links</h5><a href="#top">Home</a><Link to="/browse">Browse Resources</Link><a href="#how">How It Works</a><a href="#learn">Learn & Recycle</a></div>
        <div><h5>Account</h5><Link to="/login">Log In</Link><Link to="/register">Register</Link><Link to="/dashboard">Dashboard</Link></div>
        <p className="copy">© 2026 Waste to Resources. All rights reserved. · Digital Waste-to-Resources Platform for College</p>
      </footer>
    </div>
  )
}
