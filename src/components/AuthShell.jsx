import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function AuthShell({ title, text, points, children }) {
  return (
    <div className="auth-split">
      <aside className="auth-side">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <Link to="/" className="logo-link">♻️ Waste<b>2</b>Resources</Link>
          <ThemeToggle />
        </div>
        <div><h2>{title}</h2><p>{text}</p>
          <ul>{points.map(p => <li key={p}>{p}</li>)}</ul></div>
        <span />
      </aside>
      <section className="auth-main">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', maxWidth:'460px', margin:'0 auto'}} className="mobile-logo-container">
          <Link to="/" className="logo-link dark mobile-logo">♻️ Waste<b>2</b>Resources</Link>
          <div className="mobile-logo"><ThemeToggle /></div>
        </div>
        {children}
      </section>
    </div>
  )
}
