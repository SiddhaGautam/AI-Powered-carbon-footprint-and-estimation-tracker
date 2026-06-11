// Logs.jsx — Carbon Tracker Premium Log Activity Page

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

import "./Dashboard.css"
import "./Logs.css"
import Navbar from "./Navbar"

axios.defaults.withCredentials = true

/* ─────────────────────────────
   SVG ICONS
───────────────────────────── */

function IconCar({ color = "currentColor" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 17H3v-5l2.5-6h13L21 12v5h-2" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
      <path d="M5 12h14" />
    </svg>
  )
}

function IconFood({ color = "currentColor" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2s-5 0-5 6v3a2 2 0 002 2h3zm0 0v7" />
    </svg>
  )
}

function IconEnergy({ color = "currentColor" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function IconShopping({ color = "currentColor" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

/* ─────────────────────────────
   CATEGORY DATA
───────────────────────────── */

const CATEGORIES = [
  {
    id: "transport",
    label: "TRANSPORT",
    sub: "Movement & travel",
    Icon: IconCar,
    activities: [
      {
        label: "Petrol Car",
        factor: 0.192,
        unit: "km",
        unitLabel: "DISTANCE (KM)",
      },
      {
        label: "Diesel Car",
        factor: 0.171,
        unit: "km",
        unitLabel: "DISTANCE (KM)",
      },
      {
        label: "Electric Car",
        factor: 0.053,
        unit: "km",
        unitLabel: "DISTANCE (KM)",
      },
      {
        label: "Motorbike",
        factor: 0.114,
        unit: "km",
        unitLabel: "DISTANCE (KM)",
      },
      {
        label: "Bus",
        factor: 0.089,
        unit: "km",
        unitLabel: "DISTANCE (KM)",
      },
      {
        label: "Train",
        factor: 0.041,
        unit: "km",
        unitLabel: "DISTANCE (KM)",
      },
      {
        label: "Domestic Flight",
        factor: 90,
        unit: "hr",
        unitLabel: "DURATION (HR)",
      },
      {
        label: "International Flight",
        factor: 195,
        unit: "hr",
        unitLabel: "DURATION (HR)",
      },
    ],
  },
  {
    id: "food",
    label: "FOOD & DIET",
    sub: "Meals & beverages",
    Icon: IconFood,
    activities: [
      {
        label: "Beef Meal",
        factor: 6.0,
        unit: "serving",
        unitLabel: "SERVINGS",
      },
      {
        label: "Pork Meal",
        factor: 2.1,
        unit: "serving",
        unitLabel: "SERVINGS",
      },
      {
        label: "Chicken Meal",
        factor: 1.5,
        unit: "serving",
        unitLabel: "SERVINGS",
      },
      {
        label: "Fish Meal",
        factor: 1.3,
        unit: "serving",
        unitLabel: "SERVINGS",
      },
      {
        label: "Vegetarian Meal",
        factor: 0.8,
        unit: "serving",
        unitLabel: "SERVINGS",
      },
      {
        label: "Vegan Meal",
        factor: 0.5,
        unit: "serving",
        unitLabel: "SERVINGS",
      },
      {
        label: "Dairy (1L Milk)",
        factor: 3.2,
        unit: "litre",
        unitLabel: "LITRES",
      },
    ],
  },
  {
    id: "energy",
    label: "HOME ENERGY",
    sub: "Electricity & gas",
    Icon: IconEnergy,
    activities: [
      {
        label: "Electricity",
        factor: 0.233,
        unit: "kWh",
        unitLabel: "AMOUNT (KWH)",
      },
      {
        label: "Natural Gas",
        factor: 0.184,
        unit: "kWh",
        unitLabel: "AMOUNT (KWH)",
      },
      {
        label: "Air Conditioning",
        factor: 0.7,
        unit: "hr",
        unitLabel: "DURATION (HR)",
      },
      {
        label: "Heating",
        factor: 0.9,
        unit: "hr",
        unitLabel: "DURATION (HR)",
      },
    ],
  },
  {
    id: "shopping",
    label: "SHOPPING",
    sub: "Goods purchased",
    Icon: IconShopping,
    activities: [
      {
        label: "New Clothing",
        factor: 15,
        unit: "item",
        unitLabel: "ITEMS",
      },
      {
        label: "Small Electronics",
        factor: 30,
        unit: "item",
        unitLabel: "ITEMS",
      },
      {
        label: "Large Electronics",
        factor: 300,
        unit: "item",
        unitLabel: "ITEMS",
      },
      {
        label: "Online Delivery",
        factor: 0.5,
        unit: "parcel",
        unitLabel: "PARCELS",
      },
    ],
  },
]

/* ─────────────────────────────
   HELPERS
───────────────────────────── */

function getLocalDateString(dateValue = new Date()) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateValue) {
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

function getLogTimeValue(log) {
  return new Date(log.createdAt || log.date || 0).getTime()
}

export default function Logs({ user, onLogout, onNavChange }) {
  const today = getLocalDateString()

  const [activeCat, setActiveCat] = useState(CATEGORIES[0])
  const [selActivity, setSelActivity] = useState(
    CATEGORIES[0].activities[0]
  )

  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today)
  const [note, setNote] = useState("")
  const [logs, setLogs] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [logFilter, setLogFilter] = useState("ALL")

  /* ─────────────────────────────
     FETCH LOGS
  ───────────────────────────── */

  useEffect(() => {
    async function fetchLogs() {
      try {
        if (!user?.email) return

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
            (a, b) => getLogTimeValue(b) - getLogTimeValue(a)
          )
        )
      } catch (err) {
        console.log("Fetch logs failed:", err)
        setLogs([])
      }
    }

    fetchLogs()
  }, [user?.email])

  /* ─────────────────────────────
     CALCULATIONS
  ───────────────────────────── */

  const numericAmount = Number(amount)

  const kg =
    amount && numericAmount > 0
      ? Number((selActivity.factor * numericAmount).toFixed(4))
      : 0

  const treesPerYr =
    kg > 0 ? Number((kg / 21.77).toFixed(3)) : 0

  const filteredLogs = useMemo(() => {
    const result =
      logFilter === "ALL"
        ? logs
        : logs.filter((log) => log.category === logFilter)

    return [...result].sort(
      (a, b) => getLogTimeValue(b) - getLogTimeValue(a)
    )
  }, [logs, logFilter])

  const filteredTotalKg = filteredLogs.reduce(
    (sum, log) => sum + Number(log.kgCO2 || 0),
    0
  )

  const totalLoggedKg = logs.reduce(
    (sum, log) => sum + Number(log.kgCO2 || 0),
    0
  )

  const highestLog = [...logs].sort(
    (a, b) => Number(b.kgCO2 || 0) - Number(a.kgCO2 || 0)
  )[0]

  const categoryCount = new Set(
    logs.map((log) => log.category).filter(Boolean)
  ).size

  /* ─────────────────────────────
     HANDLERS
  ───────────────────────────── */

  function handleCatChange(cat) {
    setActiveCat(cat)
    setSelActivity(cat.activities[0])
    setAmount("")
  }

  function handleActivityChange(e) {
    const selected = activeCat.activities.find(
      (activity) => activity.label === e.target.value
    )

    if (!selected) return

    setSelActivity(selected)
    setAmount("")
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!user?.email) {
      showToast("error", "Please login again before saving activity.")
      return
    }

    if (!amount || numericAmount <= 0) {
      showToast("error", "Please enter a valid amount.")
      return
    }

    setSubmitting(true)

    try {
      const response = await axios.post(
        "http://localhost:3000/api/logs",
        {
          userEmail: user.email,
          category: activeCat.label,
          activity: selActivity.label,
          amount: numericAmount,
          unit: selActivity.unit,
          factor: selActivity.factor,
          kgCO2: kg,
          note,
          date,
        },
        {
          withCredentials: true,
        }
      )

      const newLog = response.data.log

      if (newLog) {
        setLogs((prevLogs) =>
          [newLog, ...prevLogs].sort(
            (a, b) => getLogTimeValue(b) - getLogTimeValue(a)
          )
        )
      }

      showToast(
        "success",
        `${kg.toFixed(3)} kg CO₂e recorded successfully.`
      )

      setAmount("")
      setNote("")
      setDate(getLocalDateString())
    } catch (err) {
      console.log(err)

      showToast(
        "error",
        err?.response?.data?.message || "Failed to save log."
      )
    } finally {
      setSubmitting(false)
    }
  }

  function showToast(type, msg) {
    setToast({ type, msg })

    window.setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  /* ─────────────────────────────
     UI
  ───────────────────────────── */

  return (
    <div className="db-page logs-page">
      <div className="lg-bg-image"></div>
      <div className="lg-bg-overlay"></div>

      <video
        className="db-page-video db-page-video-dark"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/pollution.mp4" type="video/mp4" />
      </video>

      <Navbar
        user={user}
        currentPage="LOG"
        onLogout={onLogout}
        onNavChange={onNavChange}
      />

      {toast && (
        <div className={`lg-toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
        </div>
      )}

      <main className="lg-shell">
        {/* HERO */}

        <section className="lg-landing-hero">
          <div className="lg-hero-content">
            <div className="lg-hero-copy">
              <div className="lg-hero-tag">
                <strong>INPUT MODULE</strong>
                <span>Carbon Activity Logger</span>
              </div>

              <h1>
                Record activities that shape your carbon footprint.
              </h1>

              <p>
                This page converts everyday choices into measurable CO₂e
                values. Select a category, choose an activity, enter the
                amount, and Carbon Tracker instantly calculates the estimated
                environmental impact.
              </p>

              <div className="lg-hero-actions">
                <button
                  type="button"
                  className="lg-primary-action"
                  onClick={() => {
                    document
                      .querySelector(".lg-entry-panel")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  START LOGGING
                </button>

                <button
                  type="button"
                  className="lg-secondary-action"
                  onClick={() => onNavChange("HISTORY")}
                >
                  VIEW HISTORY
                </button>
              </div>
            </div>

            <aside className="lg-hero-panel">
              <div className="lg-hero-panel-label">
                TOTAL RECORDED
              </div>

              <div className="lg-hero-panel-value">
                {totalLoggedKg.toFixed(2)}
                <span>kg</span>
              </div>

              <div className="lg-hero-panel-sub">
                Across {logs.length} saved activities
              </div>

              <div className="lg-hero-panel-line"></div>

              <div className="lg-hero-panel-mini">
                <div>
                  <strong>{categoryCount}</strong>
                  <span>categories used</span>
                </div>

                <div>
                  <strong>
                    {highestLog
                      ? Number(highestLog.kgCO2 || 0).toFixed(1)
                      : "0.0"}
                  </strong>
                  <span>highest kg</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* WORKFLOW */}

        <section className="lg-workflow-section">
          <div className="lg-section-heading centered">
            <p>HOW LOGGING WORKS</p>

            <h2>
              Turn daily behavior into clear carbon intelligence.
            </h2>
          </div>

          <div className="lg-workflow-grid">
            <article className="lg-workflow-card">
              <span>01</span>
              <h3>Select category</h3>
              <p>
                Choose whether the activity belongs to transport, food,
                home energy, or shopping.
              </p>
            </article>

            <article className="lg-workflow-card active">
              <span>02</span>
              <h3>Enter usage</h3>
              <p>
                Add the distance, duration, quantity, servings, or units
                based on the selected activity.
              </p>
            </article>

            <article className="lg-workflow-card">
              <span>03</span>
              <h3>Save footprint</h3>
              <p>
                The calculated CO₂e value syncs with dashboard, history,
                analytics, goals, notifications, and reports.
              </p>
            </article>
          </div>
        </section>

        {/* CATEGORY CARDS */}

        <section className="lg-category-section">
          <div className="lg-section-heading">
            <p>ACTIVITY CATEGORIES</p>

            <h2>
              Choose the source of your emission.
            </h2>
          </div>

          <div className="lg-categories">
            {CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCat.id

              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`lg-cat-card ${isActive ? "active" : ""}`}
                  onClick={() => handleCatChange(cat)}
                >
                  <div className="lg-cat-icon">
                    <cat.Icon
                      color={isActive ? "#f5f3ee" : "#102116"}
                    />
                  </div>

                  <div>
                    <div className="lg-cat-name">
                      {cat.label}
                    </div>

                    <div className="lg-cat-sub">
                      {cat.sub}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* LOGGING BODY */}

        <section className="lg-entry-panel">
          <div className="lg-entry-intro">
            <p className="lg-section-kicker">
              LOG ACTIVITY
            </p>

            <h2>
              Calculate and save a new carbon record.
            </h2>

            <p>
              Each saved record becomes part of your personal carbon dataset.
              The same data later powers your dashboard score, goal progress,
              history table, analytics charts, notifications, and AI advice.
            </p>
          </div>

          <div className="lg-body">
            <form
              className="lg-form"
              onSubmit={handleSubmit}
            >
              <div className="lg-field">
                <label className="lg-label">
                  ACTIVITY
                </label>

                <select
                  className="lg-select"
                  value={selActivity.label}
                  onChange={handleActivityChange}
                >
                  {activeCat.activities.map((activity) => (
                    <option
                      key={activity.label}
                      value={activity.label}
                    >
                      {activity.label} — {activity.factor} kg/{activity.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg-field-row">
                <div className="lg-field">
                  <label className="lg-label">
                    {selActivity.unitLabel}
                  </label>

                  <input
                    className="lg-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="lg-field">
                  <label className="lg-label">
                    ACTIVITY DATE
                  </label>

                  <input
                    className="lg-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="lg-field">
                <label className="lg-label">
                  NOTE
                </label>

                <input
                  className="lg-input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note about this activity"
                />
              </div>

              <button
                className="lg-submit-btn"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "RECORDING..." : "✓ RECORD EMISSION"}
              </button>
            </form>

            <aside className="lg-preview">
              <div>
                <div className="lg-preview-heading">
                  CALCULATED FOOTPRINT
                </div>

                <div className="lg-preview-number">
                  {kg.toFixed(3)}
                </div>

                <div className="lg-preview-unit">
                  KG CO₂ EQUIVALENT
                </div>
              </div>

              <div>
                <div className="lg-preview-divider" />

                <div className="lg-preview-row">
                  <span>CATEGORY</span>
                  <span>{activeCat.label}</span>
                </div>

                <div className="lg-preview-row">
                  <span>ACTIVITY</span>
                  <span>{selActivity.label}</span>
                </div>

                <div className="lg-preview-row">
                  <span>FACTOR</span>
                  <span>
                    {selActivity.factor} kg/{selActivity.unit}
                  </span>
                </div>

                <div className="lg-preview-row">
                  <span>TREES TO OFFSET</span>
                  <span>{treesPerYr.toFixed(3)} / yr</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* DATA SYNC STORY */}

        <section className="lg-sync-section">
          <div className="lg-sync-visual">
            <div className="lg-sync-card one">
              <span>LOG</span>
              <strong>Activity</strong>
            </div>

            <div className="lg-sync-card two">
              <span>SYNC</span>
              <strong>Dashboard</strong>
            </div>

            <div className="lg-sync-card three">
              <span>AI</span>
              <strong>Insights</strong>
            </div>
          </div>

          <div className="lg-sync-copy">
            <p className="lg-section-kicker">
              SYSTEM SYNC
            </p>

            <h2>
              One saved activity updates the whole platform.
            </h2>

            <p>
              When you record an activity, the backend stores it in MongoDB
              using your account email. That same record is then reused by
              Dashboard, Analytics, History, Goals, Notifications, and AI
              insights.
            </p>

            <p>
              This keeps the platform consistent. A single log can update
              your carbon score, appear in recent activities, change your
              weekly trend, affect your goal percentage, and trigger a
              high-emission alert.
            </p>
          </div>
        </section>

        {/* SAVED LOGS */}

        <section className="lg-saved-section">
          <div className="lg-saved-top">
            <div>
              <p className="lg-saved-eyebrow">
                ACTIVITY HISTORY
              </p>

              <h2 className="lg-saved-heading">
                Recent Logs
              </h2>
            </div>

            <div className="lg-saved-summary">
              <span>{filteredLogs.length} logs</span>
              <strong>
                {filteredTotalKg.toFixed(2)} kg CO₂e
              </strong>
            </div>
          </div>

          <div className="lg-filter-tabs">
            <button
              type="button"
              className={`lg-filter-tab ${
                logFilter === "ALL" ? "active" : ""
              }`}
              onClick={() => setLogFilter("ALL")}
            >
              ALL
            </button>

            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`lg-filter-tab ${
                  logFilter === cat.label ? "active" : ""
                }`}
                onClick={() => setLogFilter(cat.label)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="lg-empty">
              No activity logs found for this category.
            </div>
          ) : (
            <div className="lg-log-list">
              {filteredLogs.map((log) => {
                const catClass = getCategoryClass(log.category)

                return (
                  <article
                    key={log._id}
                    className={`lg-log-row ${catClass}`}
                  >
                    <div className="lg-log-main">
                      <div className={`lg-log-icon ${catClass}`}>
                        {getCategoryIcon(log.category)}
                      </div>

                      <div>
                        <div className="lg-log-activity">
                          {log.activity}
                        </div>

                        <div className="lg-log-meta">
                          <span className={`lg-log-category ${catClass}`}>
                            {log.category}
                          </span>

                          <span>
                            {log.amount} {log.unit}
                          </span>

                          <span>
                            {formatDisplayDate(log.date)}
                          </span>
                        </div>

                        {log.note && (
                          <div className="lg-log-note">
                            {log.note}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg-log-impact">
                      <strong>
                        {Number(log.kgCO2 || 0).toFixed(2)}
                      </strong>

                      <span>kg CO₂e</span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <div className="db-spacer" />
      </main>
    </div>
  )
}