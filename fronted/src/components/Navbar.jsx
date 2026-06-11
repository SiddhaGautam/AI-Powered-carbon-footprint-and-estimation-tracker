import { useEffect, useState } from "react"

import "./Navbar.css"

import Notifications from "./Notifications"

export default function Navbar({
  user,
  currentPage,
  onLogout,
  onNavChange,
  badge,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark"
  })

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode")
      localStorage.setItem("theme", "dark")
    } else {
      document.body.classList.remove("dark-mode")
      localStorage.setItem("theme", "light")
    }
  }, [darkMode])

  const navItems = [
    "DASHBOARD",
    "LOG",
    "ANALYTICS",
    "HISTORY",
    "GOALS",
  ]

  function handleLogout() {
    setMenuOpen(false)
    onLogout()
  }

  return (
    <nav className="main-nav">
      {/* LEFT LOGO */}

      <div className="main-logo-wrap">
        <div className="main-logo-mark">
          <span></span>
        </div>

        <div className="main-logo-group">
          <div className="main-logo">
            Carbon Tracker
          </div>

          <div className="main-logo-subtitle">
            AI Emission Intelligence
          </div>

          {badge && (
            <div className="main-user-badge">
              <span>{badge.icon}</span>
              <strong>{badge.title}</strong>
            </div>
          )}
        </div>
      </div>

      {/* CENTER LINKS */}

      <ul className="main-links">
        {navItems.map((item) => (
          <li key={item}>
            <button
              className={`main-link ${
                currentPage === item ? "active" : ""
              }`}
              onClick={() => onNavChange(item)}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>

      {/* RIGHT SECTION */}

      <div className="main-right">
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle dark mode"
          type="button"
        >
          <span className="theme-toggle-icon">
            {darkMode ? "☀️" : "🌙"}
          </span>
        </button>

        <Notifications user={user} />

        <div className="main-account">
          <div className="main-account-info">
            <div className="main-account-label">
              ACCOUNT
            </div>

            <div className="main-account-email">
              {user?.email || "user@carbontracker.com"}
            </div>
          </div>

          <div className="main-dropdown-wrap">
            <button
              className={`main-dropdown-btn ${
                menuOpen ? "open" : ""
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
            >
             ⌄
            </button>

            {menuOpen && (
              <div className="main-dropdown-menu">
                <div className="main-dropdown-header">
                  <span>Signed in as</span>
                  <strong>{user?.email}</strong>
                </div>

                <button
                  className="main-dropdown-logout"
                  onClick={handleLogout}
                  type="button"
                >
                  <span>⎋</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}