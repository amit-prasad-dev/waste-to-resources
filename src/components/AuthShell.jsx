import { Link } from 'react-router-dom'
export default function AuthShell({ title, text, points, children }) {
  return (
    <div className="auth-split">
      <aside className="auth-side">
        <Link to="/" className="logo-link">♻️ Waste<b>2</b>Resources</Link>
        <div><h2>{title}</h2><p>{text}</p>
          <ul>{points.map(p => <li key={p}>{p}</li>)}</ul></div>
        <span />
      </aside>
      <section className="auth-main">
        <Link to="/" className="logo-link dark mobile-logo">♻️ Waste<b>2</b>Resources</Link>
        {children}
      </section>
    </div>
  )
}
