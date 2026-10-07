import { useTheme } from '../ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className={`theme-toggle ${className}`} 
      onClick={toggleTheme} 
      aria-label="Switch to dark/light mode"
      title="Toggle Theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
