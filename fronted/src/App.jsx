import { createRoot } from "react-dom/client"
import { useState } from "react"
import Goals from "./components/Goals"
import Main from "./components/Main"
import Dashboard from "./components/Dashboard"
import Logs from "./components/Logs"
import Analytics from "./components/Analytics"
import History from "./components/History"

export default function App() {

  // AUTH USER
  const [user, setUser] = useState(null)

  // CURRENT PAGE
  const [page, setPage] = useState("DASHBOARD")

  /* ─────────────────────────────
     LOGOUT
  ───────────────────────────── */

  function handleLogout() {

    setUser(null)

    setPage("DASHBOARD")
  }

  /* ─────────────────────────────
     NOT LOGGED IN
  ───────────────────────────── */

  if (!user) {

    return (

      <Main
        onLogin={(userData) => {

          setUser(userData)

          setPage("DASHBOARD")
        }}
      />

    )
  }

  /* ─────────────────────────────
     DASHBOARD PAGE
  ───────────────────────────── */

  if (page === "DASHBOARD") {

    return (

      <Dashboard
        user={user}
        onLogout={handleLogout}
        onNavChange={setPage}
      />

    )
  }

  /* ─────────────────────────────
     LOG PAGE
  ───────────────────────────── */

  if (page === "LOG") {

    return (

      <Logs
        user={user}
        onLogout={handleLogout}
        onNavChange={setPage}
      />

    )
  }

  /* ─────────────────────────────
     ANALYTICS PAGE
  ───────────────────────────── */

  if (page === "ANALYTICS") {

    return (

      <Analytics
        user={user}
        onLogout={handleLogout}
        onNavChange={setPage}
      />

    )
  }
/*HISTORY PAGE */
if (page === "HISTORY") {

  return (

    <History
      user={user}
      onLogout={handleLogout}
      onNavChange={setPage}
    />

  )
}
  /* ─────────────────────────────
   GOALS PAGE
───────────────────────────── */

if (page === "GOALS") {

  return (

    <Goals
      user={user}
      onLogout={handleLogout}
      onNavChange={setPage}
    />

  )
}

  /* ─────────────────────────────
     FALLBACK
  ───────────────────────────── */

  return (

    <Dashboard
      user={user}
      onLogout={handleLogout}
      onNavChange={setPage}
    />

  )
}

/* ─────────────────────────────
   ROOT RENDER
───────────────────────────── */

const root = createRoot(
  document.getElementById("root")
)

root.render(
  <App />
)