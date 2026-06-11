// History.jsx — Carbon Tracker Premium Activity History Page

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import "./History.css"
import Navbar from "./Navbar"

axios.defaults.withCredentials = true

const CATEGORY_OPTIONS = [
  "ALL",
  "TRANSPORT",
  "FOOD & DIET",
  "HOME ENERGY",
  "SHOPPING",
]

function getCategoryClass(category = "") {
  const value = category.toLowerCase()

  if (value.includes("transport")) return "transport"
  if (value.includes("food")) return "food"
  if (value.includes("energy")) return "energy"
  if (value.includes("shopping")) return "shopping"

  return "other"
}

function getCategoryIcon(category = "") {
  const value = category.toLowerCase()

  if (value.includes("transport")) return "🚗"
  if (value.includes("food")) return "🍽️"
  if (value.includes("energy")) return "⚡"
  if (value.includes("shopping")) return "🛍️"

  return "🌿"
}

function getLocalDateString(dateValue) {
  if (!dateValue) return ""

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getHistoryDate(log) {
  return log.date || log.createdAt
}

function getLogTime(log) {
  const date = new Date(getHistoryDate(log))

  if (Number.isNaN(date.getTime())) {
    return 0
  }

  return date.getTime()
}

function formatDate(dateValue) {
  if (!dateValue) return "-"

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function History({
  user,
  onLogout,
  onNavChange,
}) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [sortType, setSortType] = useState("LATEST")
  const [editingLog, setEditingLog] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  /* ─────────────────────────────
     FETCH LOGS
  ───────────────────────────── */

  useEffect(() => {
    if (!user?.email) return

    fetchLogs()
  }, [user?.email])

  async function fetchLogs() {
    try {
      setLoading(true)

      const response = await axios.get(
        `http://localhost:3000/api/logs/${encodeURIComponent(
          user.email
        )}`,
        {
          withCredentials: true,
        }
      )

      const fetchedLogs = response.data.logs || []

      setLogs(
        [...fetchedLogs].sort(
          (a, b) => getLogTime(b) - getLogTime(a)
        )
      )
    } catch (err) {
      console.log("Fetch history failed:", err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  /* ─────────────────────────────
     DELETE LOG
  ───────────────────────────── */

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Delete this activity from your history?"
    )

    if (!confirmDelete) return

    try {
      await axios.delete(
        `http://localhost:3000/api/logs/${id}`,
        {
          withCredentials: true,
        }
      )

      setLogs((prevLogs) =>
        prevLogs.filter((log) => log._id !== id)
      )
    } catch (err) {
      console.log("Delete failed:", err)
    }
  }

  /* ─────────────────────────────
     EDIT LOG
  ───────────────────────────── */

  function startEdit(log) {
    setEditingLog(log._id)

    setEditForm({
      activity: log.activity || "",
      category: log.category || "",
      amount: log.amount || "",
      unit: log.unit || "",
      kgCO2: log.kgCO2 || "",
      note: log.note || "",
      date: getLocalDateString(getHistoryDate(log)),
    })
  }

  function cancelEdit() {
    setEditingLog(null)
    setEditForm({})
  }

  async function saveEdit(id) {
    try {
      setSaving(true)

      const response = await axios.put(
        `http://localhost:3000/api/logs/${id}`,
        {
          ...editForm,
          kgCO2: Number(editForm.kgCO2 || 0),
          amount: Number(editForm.amount || 0),
        },
        {
          withCredentials: true,
        }
      )

      const updatedLog = response.data.log

      setLogs((prevLogs) =>
        prevLogs
          .map((log) =>
            log._id === id ? updatedLog : log
          )
          .sort((a, b) => getLogTime(b) - getLogTime(a))
      )

      setEditingLog(null)
      setEditForm({})
    } catch (err) {
      console.log("Update failed:", err)
    } finally {
      setSaving(false)
    }
  }

  /* ─────────────────────────────
     FILTERS + SORTING
  ───────────────────────────── */

  const filteredLogs = useMemo(() => {
    let result = [...logs]

    if (search.trim()) {
      const query = search.toLowerCase()

      result = result.filter((log) => {
        const activity = log.activity?.toLowerCase() || ""
        const category = log.category?.toLowerCase() || ""
        const note = log.note?.toLowerCase() || ""

        return (
          activity.includes(query) ||
          category.includes(query) ||
          note.includes(query)
        )
      })
    }

    if (categoryFilter !== "ALL") {
      result = result.filter(
        (log) => log.category === categoryFilter
      )
    }

    if (sortType === "LATEST") {
      result.sort((a, b) => getLogTime(b) - getLogTime(a))
    }

    if (sortType === "OLDEST") {
      result.sort((a, b) => getLogTime(a) - getLogTime(b))
    }

    if (sortType === "HIGHEST") {
      result.sort(
        (a, b) =>
          Number(b.kgCO2 || 0) - Number(a.kgCO2 || 0)
      )
    }

    if (sortType === "LOWEST") {
      result.sort(
        (a, b) =>
          Number(a.kgCO2 || 0) - Number(b.kgCO2 || 0)
      )
    }

    return result
  }, [logs, search, categoryFilter, sortType])

  const totalEmission = filteredLogs.reduce(
    (sum, log) => sum + Number(log.kgCO2 || 0),
    0
  )

  const allTimeEmission = logs.reduce(
    (sum, log) => sum + Number(log.kgCO2 || 0),
    0
  )

  const highestLog = [...logs].sort(
    (a, b) =>
      Number(b.kgCO2 || 0) - Number(a.kgCO2 || 0)
  )[0]

  const uniqueCategories = new Set(
    logs.map((log) => log.category).filter(Boolean)
  ).size

  const recentLog = [...logs].sort(
    (a, b) => getLogTime(b) - getLogTime(a)
  )[0]

  const userName =
    user?.name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "User"

  /* ─────────────────────────────
     UI
  ───────────────────────────── */

  return (
    <div className="history-page">
      <div className="history-bg-image"></div>

      <video
        className="history-page-video history-page-video-dark"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/pollution.mp4" type="video/mp4" />
      </video>

      <div className="history-page-overlay"></div>

      <Navbar
        user={user}
        currentPage="HISTORY"
        onLogout={onLogout}
        onNavChange={onNavChange}
      />

      <main className="history-shell">
        {/* HERO */}

        <section className="history-landing-hero">
          <div className="history-hero-content">
            <div className="history-hero-copy">
              <div className="history-hero-tag">
                <strong>HISTORY MODULE</strong>
                <span>Activity record management</span>
              </div>

              <h1>
                Review every carbon activity you have recorded.
              </h1>

              <p>
                Hello, {userName}. Your history is the complete carbon
                record behind Dashboard, Analytics, Goals, AI insights, and
                notifications. Search, filter, edit, and manage your logs
                from one clean place.
              </p>

              <div className="history-hero-actions">
                <button
                  type="button"
                  className="history-primary-action"
                  onClick={() => onNavChange("LOG")}
                >
                  ADD NEW LOG
                </button>

                <button
                  type="button"
                  className="history-secondary-action"
                  onClick={() => onNavChange("ANALYTICS")}
                >
                  VIEW ANALYTICS
                </button>
              </div>
            </div>

            <aside className="history-hero-panel">
              <div className="history-hero-panel__label">
                FILTERED EMISSIONS
              </div>

              <div className="history-hero-panel__value">
                {totalEmission.toFixed(2)}
                <span>kg</span>
              </div>

              <div className="history-hero-panel__sub">
                From {filteredLogs.length} visible logs
              </div>

              <div className="history-hero-panel__line"></div>

              <div className="history-hero-panel__mini">
                <div>
                  <strong>{logs.length}</strong>
                  <span>total logs</span>
                </div>

                <div>
                  <strong>{uniqueCategories}</strong>
                  <span>categories</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="history-summary-grid">
          <div className="history-stat-card">
            <span>TOTAL LOGS</span>
            <strong>{logs.length}</strong>
            <small>Activities recorded</small>
          </div>

          <div className="history-stat-card">
            <span>ALL-TIME EMISSIONS</span>
            <strong>{allTimeEmission.toFixed(2)} kg</strong>
            <small>Across your full account history</small>
          </div>

          <div className="history-stat-card">
            <span>LATEST ACTIVITY</span>
            <strong>
              {recentLog ? recentLog.activity : "No logs"}
            </strong>
            <small>
              {recentLog
                ? formatDate(getHistoryDate(recentLog))
                : "Start by logging one activity"}
            </small>
          </div>

          <div className="history-stat-card">
            <span>HIGHEST ACTIVITY</span>
            <strong>
              {highestLog
                ? `${Number(highestLog.kgCO2 || 0).toFixed(2)} kg`
                : "0.00 kg"}
            </strong>
            <small>
              {highestLog?.activity || "No activity yet"}
            </small>
          </div>
        </section>

        {/* HISTORY PURPOSE */}

        <section className="history-sync-section">
          <div className="history-sync-visual">
            <div className="history-floating-card one">
              <span>RECORD</span>
              <strong>{logs.length}</strong>
            </div>

            <div className="history-floating-card two">
              <span>SYNC</span>
              <strong>All Pages</strong>
            </div>

            <div className="history-floating-card three">
              <span>DATA</span>
              <strong>MongoDB</strong>
            </div>
          </div>

          <div className="history-sync-copy">
            <p className="history-section-kicker">
              WHY HISTORY MATTERS
            </p>

            <h2>
              Your activity history is the source of truth for the platform.
            </h2>

            <p>
              Every saved record contributes to your carbon score, analytics
              charts, goal progress, notification triggers, and AI
              recommendations. This page gives you control over that data.
            </p>

            <p>
              If you correct an activity here, the rest of the platform
              becomes more accurate when it fetches the latest logs again.
              This keeps your sustainability insights clean and trustworthy.
            </p>
          </div>
        </section>

        {/* FILTERS */}

        <section className="history-filters">
          <div className="history-filter-heading">
            <p className="history-section-kicker">
              FILTER RECORDS
            </p>

            <h2>
              Find the exact activity you need.
            </h2>
          </div>

          <div className="history-filter-left">
            <input
              type="text"
              placeholder="Search by activity, category, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="history-search"
            />

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              className="history-select"
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category === "ALL"
                    ? "All Categories"
                    : category}
                </option>
              ))}
            </select>

            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="history-select"
            >
              <option value="LATEST">
                Latest First
              </option>

              <option value="OLDEST">
                Oldest First
              </option>

              <option value="HIGHEST">
                Highest Emission
              </option>

              <option value="LOWEST">
                Lowest Emission
              </option>
            </select>

            <button
              type="button"
              className="history-refresh-btn"
              onClick={fetchLogs}
            >
              Refresh
            </button>
          </div>
        </section>

        {/* ACTIVITY LIST */}

        <section className="history-list-section">
          <div className="history-list-header">
            <div>
              <p className="history-section-kicker">
                LOG RECORDS
              </p>

              <h2>Saved Activities</h2>
            </div>

            <p>
              Showing {filteredLogs.length} of {logs.length} records
            </p>
          </div>

          {loading ? (
            <div className="history-empty">
              Loading history...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="history-empty">
              No activity logs found for the selected filters.
            </div>
          ) : (
            <div className="history-log-list">
              {filteredLogs.map((log) => {
                const catClass = getCategoryClass(log.category)
                const isEditing = editingLog === log._id

                return (
                  <article
                    key={log._id}
                    className={`history-log-row ${catClass}`}
                  >
                    <div className="history-log-main">
                      <div className={`history-log-icon ${catClass}`}>
                        {getCategoryIcon(log.category)}
                      </div>

                      <div className="history-log-content">
                        {isEditing ? (
                          <>
                            <div className="history-edit-grid">
                              <input
                                className="history-edit-input"
                                value={editForm.activity}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    activity: e.target.value,
                                  })
                                }
                                placeholder="Activity"
                              />

                              <select
                                className="history-edit-input"
                                value={editForm.category}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    category: e.target.value,
                                  })
                                }
                              >
                                {CATEGORY_OPTIONS.filter(
                                  (cat) => cat !== "ALL"
                                ).map((cat) => (
                                  <option
                                    key={cat}
                                    value={cat}
                                  >
                                    {cat}
                                  </option>
                                ))}
                              </select>

                              <input
                                className="history-edit-input"
                                type="number"
                                step="0.01"
                                value={editForm.amount}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    amount: e.target.value,
                                  })
                                }
                                placeholder="Amount"
                              />

                              <input
                                className="history-edit-input"
                                value={editForm.unit}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    unit: e.target.value,
                                  })
                                }
                                placeholder="Unit"
                              />

                              <input
                                className="history-edit-input"
                                type="number"
                                step="0.01"
                                value={editForm.kgCO2}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    kgCO2: e.target.value,
                                  })
                                }
                                placeholder="kgCO2"
                              />

                              <input
                                className="history-edit-input"
                                type="date"
                                value={editForm.date}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    date: e.target.value,
                                  })
                                }
                              />
                            </div>

                            <input
                              className="history-edit-input history-edit-note"
                              value={editForm.note}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  note: e.target.value,
                                })
                              }
                              placeholder="Note"
                            />
                          </>
                        ) : (
                          <>
                            <div className="history-log-title">
                              {log.activity}
                            </div>

                            <div className="history-log-meta">
                              <span className={`history-category-chip ${catClass}`}>
                                {log.category}
                              </span>

                              <span>
                                {log.amount} {log.unit}
                              </span>

                              <span>
                                {formatDate(getHistoryDate(log))}
                              </span>
                            </div>

                            <div className="history-log-note">
                              {log.note || "No note added."}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="history-log-side">
                      <div className="history-log-emission">
                        <strong>
                          {Number(
                            isEditing
                              ? editForm.kgCO2 || 0
                              : log.kgCO2 || 0
                          ).toFixed(2)}
                        </strong>

                        <span>kg CO₂e</span>
                      </div>

                      <div className="history-actions">
                        {isEditing ? (
                          <>
                            <button
                              className="save-btn"
                              onClick={() => saveEdit(log._id)}
                              disabled={saving}
                            >
                              {saving ? "Saving" : "Save"}
                            </button>

                            <button
                              className="cancel-btn"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="edit-btn"
                              onClick={() => startEdit(log)}
                            >
                              Edit
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(log._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}