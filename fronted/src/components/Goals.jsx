// Goals.jsx — Carbon Tracker Premium Goals Page

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Navbar from "./Navbar"

import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar"

import "react-circular-progressbar/dist/styles.css"
import "./Goals.css"

axios.defaults.withCredentials = true

const DEFAULT_GOALS = {
  dailyGoal: 12,
  weeklyGoal: 80,
  monthlyGoal: 320,
}

function safePercent(value, goal) {
  if (!goal || Number(goal) <= 0) return 0

  return Math.min(
    100,
    (Number(value || 0) / Number(goal)) * 100
  )
}

function getGoalStatus(percent) {
  if (percent >= 100) {
    return {
      label: "Exceeded",
      tone: "danger",
      message:
        "This target has been crossed. Review high-emission activities.",
    }
  }

  if (percent >= 80) {
    return {
      label: "Warning",
      tone: "warning",
      message:
        "You are close to the limit. Reduce avoidable emissions.",
    }
  }

  if (percent >= 50) {
    return {
      label: "On Track",
      tone: "moderate",
      message:
        "You are progressing steadily but still have room to optimize.",
    }
  }

  return {
    label: "Healthy",
    tone: "success",
    message:
      "Your emissions are currently within a safe range.",
  }
}

function getRiskTone(risk) {
  if (risk === "HIGH") return "danger"
  if (risk === "MEDIUM") return "warning"
  return "success"
}

function formatLocalDate(dateValue = new Date()) {
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

function getGoalLogDate(log) {
  return log.date || log.createdAt
}

function getLogTime(log) {
  const date = new Date(getGoalLogDate(log))

  if (Number.isNaN(date.getTime())) {
    return 0
  }

  return date.getTime()
}

export default function Goals({
  user,
  onLogout,
  onNavChange,
}) {
  const [goalData, setGoalData] = useState(DEFAULT_GOALS)
  const [logs, setLogs] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [message, setMessage] = useState(null)

  /* ─────────────────────────────
     FETCH GOALS
  ───────────────────────────── */

  useEffect(() => {
    if (!user?.email) return

    async function fetchGoals() {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/goals/${encodeURIComponent(
            user.email
          )}`,
          {
            withCredentials: true,
          }
        )

        if (response.data.success && response.data.goal) {
          setGoalData({
            dailyGoal:
              Number(response.data.goal.dailyGoal) ||
              DEFAULT_GOALS.dailyGoal,

            weeklyGoal:
              Number(response.data.goal.weeklyGoal) ||
              DEFAULT_GOALS.weeklyGoal,

            monthlyGoal:
              Number(response.data.goal.monthlyGoal) ||
              DEFAULT_GOALS.monthlyGoal,
          })
        }
      } catch (err) {
        console.log("Fetch goals failed:", err)
      }
    }

    fetchGoals()
  }, [user?.email])

  /* ─────────────────────────────
     FETCH LOGS
  ───────────────────────────── */

  useEffect(() => {
    if (!user?.email) return

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
        console.log("Fetch logs failed:", err)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [user?.email])

  /* ─────────────────────────────
     DATE RANGES
  ───────────────────────────── */

  const today = new Date()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(todayStart.getDate() + 1)

  const todayStr = formatLocalDate(todayStart)

  const weekStart = new Date(todayStart)
  weekStart.setDate(todayStart.getDate() - 6)

  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const userName =
    user?.name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "User"

  /* ─────────────────────────────
     EMISSION CALCULATIONS
  ───────────────────────────── */

  const dailyEmission = useMemo(() => {
    return logs
      .filter((log) => {
        return formatLocalDate(getGoalLogDate(log)) === todayStr
      })
      .reduce(
        (sum, log) => sum + Number(log.kgCO2 || 0),
        0
      )
  }, [logs, todayStr])

  const weeklyEmission = useMemo(() => {
    return logs
      .filter((log) => {
        const date = new Date(getGoalLogDate(log))

        if (Number.isNaN(date.getTime())) {
          return false
        }

        return date >= weekStart && date < tomorrowStart
      })
      .reduce(
        (sum, log) => sum + Number(log.kgCO2 || 0),
        0
      )
  }, [logs, weekStart, tomorrowStart])

  const monthlyEmission = useMemo(() => {
    return logs
      .filter((log) => {
        const date = new Date(getGoalLogDate(log))

        if (Number.isNaN(date.getTime())) {
          return false
        }

        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        )
      })
      .reduce(
        (sum, log) => sum + Number(log.kgCO2 || 0),
        0
      )
  }, [logs, currentMonth, currentYear])

  const dailyPercent = safePercent(
    dailyEmission,
    goalData.dailyGoal
  )

  const weeklyPercent = safePercent(
    weeklyEmission,
    goalData.weeklyGoal
  )

  const monthlyPercent = safePercent(
    monthlyEmission,
    goalData.monthlyGoal
  )

  const dailyStatus = getGoalStatus(dailyPercent)
  const weeklyStatus = getGoalStatus(weeklyPercent)
  const monthlyStatus = getGoalStatus(monthlyPercent)

  const remainingDaily = Math.max(
    0,
    Number(goalData.dailyGoal || 0) - dailyEmission
  )

  const remainingWeekly = Math.max(
    0,
    Number(goalData.weeklyGoal || 0) - weeklyEmission
  )

  const remainingMonthly = Math.max(
    0,
    Number(goalData.monthlyGoal || 0) - monthlyEmission
  )

  const totalGoalBudget =
    Number(goalData.dailyGoal || 0) +
    Number(goalData.weeklyGoal || 0) +
    Number(goalData.monthlyGoal || 0)

  const totalUsed =
    dailyEmission + weeklyEmission + monthlyEmission

  const overallPercent = safePercent(totalUsed, totalGoalBudget)

  const bestStatus =
    monthlyPercent < 50
      ? "Strong control"
      : monthlyPercent < 80
      ? "Stable progress"
      : monthlyPercent < 100
      ? "Needs attention"
      : "Budget exceeded"

  /* ─────────────────────────────
     ALERTS
  ───────────────────────────── */

  useEffect(() => {
    const newAlerts = []

    if (dailyPercent >= 100) {
      newAlerts.push({
        type: "danger",
        title: "Daily goal exceeded",
        text: "Your emissions crossed today’s carbon budget.",
      })
    } else if (dailyPercent >= 80) {
      newAlerts.push({
        type: "warning",
        title: "Daily goal warning",
        text: "You have crossed 80% of your daily limit.",
      })
    }

    if (weeklyPercent >= 100) {
      newAlerts.push({
        type: "danger",
        title: "Weekly goal exceeded",
        text: "This week’s carbon budget has been crossed.",
      })
    } else if (weeklyPercent >= 90) {
      newAlerts.push({
        type: "warning",
        title: "Weekly emissions are high",
        text: "You are close to the weekly goal limit.",
      })
    }

    if (monthlyPercent >= 100) {
      newAlerts.push({
        type: "danger",
        title: "Monthly target exceeded",
        text: "Your monthly sustainability target has been crossed.",
      })
    } else if (monthlyPercent >= 85) {
      newAlerts.push({
        type: "warning",
        title: "Monthly target warning",
        text: "Your monthly budget is close to its limit.",
      })
    }

    setAlerts(newAlerts)
  }, [dailyPercent, weeklyPercent, monthlyPercent])

  /* ─────────────────────────────
     SMART PREDICTION
  ───────────────────────────── */

  useEffect(() => {
    const avgDailyFromWeek =
      weeklyEmission > 0 ? weeklyEmission / 7 : 0

    const projectedMonth = avgDailyFromWeek * 30

    let risk = "LOW"

    if (projectedMonth > goalData.monthlyGoal) {
      risk = "HIGH"
    } else if (projectedMonth > goalData.monthlyGoal * 0.75) {
      risk = "MEDIUM"
    }

    const requiredDailyLimit =
      goalData.monthlyGoal > 0
        ? goalData.monthlyGoal / 30
        : 0

    const gapToMonthlyGoal =
      Number(goalData.monthlyGoal || 0) - projectedMonth

    setPrediction({
      tomorrow: avgDailyFromWeek.toFixed(2),
      projectedMonth: projectedMonth.toFixed(2),
      requiredDailyLimit: requiredDailyLimit.toFixed(2),
      gapToMonthlyGoal: gapToMonthlyGoal.toFixed(2),
      risk,
    })
  }, [weeklyEmission, goalData.monthlyGoal])

  /* ─────────────────────────────
     SAVE GOALS
  ───────────────────────────── */

  async function saveGoals() {
    if (!user?.email) return

    try {
      setSaving(true)
      setMessage(null)

      const response = await axios.post(
        "http://localhost:3000/api/goals",
        {
          userEmail: user.email,
          dailyGoal: Number(goalData.dailyGoal),
          weeklyGoal: Number(goalData.weeklyGoal),
          monthlyGoal: Number(goalData.monthlyGoal),
        },
        {
          withCredentials: true,
        }
      )

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Goals updated successfully.",
        })
      }
    } catch (err) {
      console.log("Save goals failed:", err)

      setMessage({
        type: "error",
        text: "Failed to save goals. Please try again.",
      })
    } finally {
      setSaving(false)

      window.setTimeout(() => {
        setMessage(null)
      }, 3500)
    }
  }

  function handleGoalChange(field, value) {
    setGoalData((prev) => ({
      ...prev,
      [field]: value === "" ? "" : Number(value),
    }))
  }

  /* ─────────────────────────────
     UI
  ───────────────────────────── */

  return (
    <div className="goals-page">
      <div className="goals-bg-image"></div>

      <video
        className="goals-page-video goals-page-video-dark"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/pollution.mp4" type="video/mp4" />
      </video>

      <div className="goals-page-overlay"></div>

      <Navbar
        user={user}
        currentPage="GOALS"
        onLogout={onLogout}
        onNavChange={onNavChange}
      />

      {message && (
        <div className={`goals-toast ${message.type}`}>
          {message.type === "success" ? "✓" : "⚠"} {message.text}
        </div>
      )}

      <main className="goals-main">
        {/* HERO */}

        <section className="goals-landing-hero">
          <div className="goals-hero-content">
            <div className="goals-hero-copy">
              <div className="goals-hero-tag">
                <strong>GOALS MODULE</strong>
                <span>Budget control system</span>
              </div>

              <h1>
                Build smarter carbon limits for your lifestyle.
              </h1>

              <p>
                Hello, {userName}. Set daily, weekly, and monthly carbon
                budgets. Carbon Tracker compares your real activity logs
                against these limits and helps you stay within a healthier
                sustainability range.
              </p>

              <div className="goals-hero-actions">
                <button
                  type="button"
                  className="goals-primary-action"
                  onClick={() => onNavChange("LOG")}
                >
                  LOG ACTIVITY
                </button>

                <button
                  type="button"
                  className="goals-secondary-action"
                  onClick={() => onNavChange("ANALYTICS")}
                >
                  VIEW ANALYTICS
                </button>
              </div>
            </div>

            <aside className="goals-hero-card">
              <div className="goals-hero-card__label">
                MONTHLY PROJECTION
              </div>

              <div className="goals-hero-card__value">
                {prediction?.projectedMonth || "0.00"}
                <span>kg</span>
              </div>

              <div
                className={`goals-risk-pill ${getRiskTone(
                  prediction?.risk
                )}`}
              >
                {prediction?.risk || "LOW"} RISK
              </div>

              <div className="goals-hero-card__line"></div>

              <div className="goals-hero-card__mini">
                <div>
                  <strong>{Math.round(overallPercent)}%</strong>
                  <span>overall usage</span>
                </div>

                <div>
                  <strong>{logs.length}</strong>
                  <span>logs tracked</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* QUICK SUMMARY */}

        <section className="goals-summary-grid">
          <div className="goals-summary-card">
            <span>TODAY USED</span>
            <strong>{dailyEmission.toFixed(2)} kg</strong>
            <small>
              {remainingDaily.toFixed(2)} kg remaining today
            </small>
          </div>

          <div className="goals-summary-card">
            <span>WEEK USED</span>
            <strong>{weeklyEmission.toFixed(2)} kg</strong>
            <small>
              {remainingWeekly.toFixed(2)} kg remaining this week
            </small>
          </div>

          <div className="goals-summary-card">
            <span>MONTH USED</span>
            <strong>{monthlyEmission.toFixed(2)} kg</strong>
            <small>
              {remainingMonthly.toFixed(2)} kg remaining this month
            </small>
          </div>

          <div className="goals-summary-card">
            <span>GOAL STATUS</span>
            <strong>{bestStatus}</strong>
            <small>
              Based on current monthly usage pattern
            </small>
          </div>
        </section>

        {/* GOALS EXPLAINER */}

        <section className="goals-sync-section">
          <div className="goals-sync-visual">
            <div className="goals-floating-card one">
              <span>DAILY</span>
              <strong>{goalData.dailyGoal} kg</strong>
            </div>

            <div className="goals-floating-card two">
              <span>WEEKLY</span>
              <strong>{goalData.weeklyGoal} kg</strong>
            </div>

            <div className="goals-floating-card three">
              <span>MONTH</span>
              <strong>{goalData.monthlyGoal} kg</strong>
            </div>
          </div>

          <div className="goals-sync-copy">
            <p className="section-kicker">
              WHY GOALS MATTER
            </p>

            <h2>
              Goals turn carbon tracking into measurable improvement.
            </h2>

            <p>
              Without targets, carbon logs only show past activity. Goals
              create a limit to compare against, so your daily choices become
              easier to evaluate and improve.
            </p>

            <p>
              Every saved activity updates goal progress. If your emissions
              approach a limit, the system generates warnings and prediction
              signals so you can reduce impact before crossing your budget.
            </p>
          </div>
        </section>

        {/* GOAL SETTINGS */}

        <section className="goal-settings-panel">
          <div className="goal-settings-intro">
            <p className="section-kicker">
              GOAL SETTINGS
            </p>

            <h2>
              Define your carbon budget.
            </h2>

            <p>
              These limits become the baseline for your goal meters,
              warning alerts, and sustainability predictions. You can adjust
              them anytime as your lifestyle changes.
            </p>
          </div>

          <div className="goal-settings">
            <div className="goal-settings__card">
              <div className="goal-settings__label">
                DAILY GOAL
              </div>

              <input
                type="number"
                min="1"
                value={goalData.dailyGoal}
                onChange={(e) =>
                  handleGoalChange("dailyGoal", e.target.value)
                }
              />

              <small>
                Recommended starter range: 10–13 kg/day
              </small>
            </div>

            <div className="goal-settings__card">
              <div className="goal-settings__label">
                WEEKLY GOAL
              </div>

              <input
                type="number"
                min="1"
                value={goalData.weeklyGoal}
                onChange={(e) =>
                  handleGoalChange("weeklyGoal", e.target.value)
                }
              />

              <small>
                Useful for controlling repeated weekly habits
              </small>
            </div>

            <div className="goal-settings__card">
              <div className="goal-settings__label">
                MONTHLY GOAL
              </div>

              <input
                type="number"
                min="1"
                value={goalData.monthlyGoal}
                onChange={(e) =>
                  handleGoalChange("monthlyGoal", e.target.value)
                }
              />

              <small>
                Best for long-term sustainability planning
              </small>
            </div>
          </div>

          <button
            className="save-goals-btn"
            onClick={saveGoals}
            disabled={saving}
          >
            {saving ? "SAVING GOALS..." : "SAVE GOALS"}
          </button>
        </section>

        {/* METERS */}

        <section className="meters-section">
          <div className="section-heading">
            <p className="section-kicker">
              GOAL PROGRESS
            </p>

            <h2>
              Live carbon budget tracking.
            </h2>
          </div>

          <div className="meters-grid">
            <div className={`meter-card ${dailyStatus.tone}`}>
              <div className="meter-chart">
                <CircularProgressbar
                  value={dailyPercent}
                  text={`${Math.round(dailyPercent)}%`}
                  styles={buildStyles({
                    pathColor:
                      dailyPercent >= 100
                        ? "#c0392b"
                        : dailyPercent >= 80
                        ? "#d87c5a"
                        : "#5c8c5a",
                    trailColor: "rgba(255,255,255,0.18)",
                    textColor: "currentColor",
                  })}
                />
              </div>

              <div className="meter-title">
                Daily Usage
              </div>

              <div className="meter-sub">
                {dailyEmission.toFixed(2)} / {goalData.dailyGoal} kg
              </div>

              <div className={`meter-status ${dailyStatus.tone}`}>
                {dailyStatus.label}
              </div>

              <p>{dailyStatus.message}</p>
            </div>

            <div className={`meter-card ${weeklyStatus.tone}`}>
              <div className="meter-chart">
                <CircularProgressbar
                  value={weeklyPercent}
                  text={`${Math.round(weeklyPercent)}%`}
                  styles={buildStyles({
                    pathColor:
                      weeklyPercent >= 100
                        ? "#c0392b"
                        : weeklyPercent >= 80
                        ? "#d87c5a"
                        : "#5c8c5a",
                    trailColor: "rgba(255,255,255,0.18)",
                    textColor: "currentColor",
                  })}
                />
              </div>

              <div className="meter-title">
                Weekly Usage
              </div>

              <div className="meter-sub">
                {weeklyEmission.toFixed(2)} / {goalData.weeklyGoal} kg
              </div>

              <div className={`meter-status ${weeklyStatus.tone}`}>
                {weeklyStatus.label}
              </div>

              <p>{weeklyStatus.message}</p>
            </div>

            <div className={`meter-card ${monthlyStatus.tone}`}>
              <div className="meter-chart">
                <CircularProgressbar
                  value={monthlyPercent}
                  text={`${Math.round(monthlyPercent)}%`}
                  styles={buildStyles({
                    pathColor:
                      monthlyPercent >= 100
                        ? "#c0392b"
                        : monthlyPercent >= 80
                        ? "#d87c5a"
                        : "#5c8c5a",
                    trailColor: "rgba(255,255,255,0.18)",
                    textColor: "currentColor",
                  })}
                />
              </div>

              <div className="meter-title">
                Monthly Usage
              </div>

              <div className="meter-sub">
                {monthlyEmission.toFixed(2)} / {goalData.monthlyGoal} kg
              </div>

              <div className={`meter-status ${monthlyStatus.tone}`}>
                {monthlyStatus.label}
              </div>

              <p>{monthlyStatus.message}</p>
            </div>
          </div>
        </section>

        {/* ALERTS + PREDICTION */}

        <section className="goal-insights-grid">
          <div className="alerts-section">
            <div className="section-title">
              Alerts & Warnings
            </div>

            <p className="section-copy">
              Alerts are generated from your real usage percentage. They
              help you react before your daily, weekly, or monthly target is
              exceeded.
            </p>

            {alerts.length === 0 ? (
              <div className="alert-card success">
                ✅ Your sustainability levels are currently under control.
              </div>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`alert-card ${alert.type}`}
                >
                  <strong>{alert.title}</strong>
                  <span>{alert.text}</span>
                </div>
              ))
            )}
          </div>

          <div className="prediction-section">
            <div className="section-title">
              Smart Prediction
            </div>

            <p className="section-copy">
              Projection is estimated from your recent weekly average. It
              helps predict whether your current habits will remain inside
              the monthly carbon budget.
            </p>

            {prediction && (
              <div className="prediction-grid">
                <div className="prediction-card">
                  <div className="prediction-label">
                    TOMORROW ESTIMATE
                  </div>

                  <div className="prediction-value">
                    {prediction.tomorrow} kg
                  </div>
                </div>

                <div className="prediction-card">
                  <div className="prediction-label">
                    MONTHLY PROJECTION
                  </div>

                  <div className="prediction-value">
                    {prediction.projectedMonth} kg
                  </div>
                </div>

                <div className="prediction-card">
                  <div className="prediction-label">
                    IDEAL DAILY LIMIT
                  </div>

                  <div className="prediction-value">
                    {prediction.requiredDailyLimit} kg
                  </div>
                </div>

                <div className="prediction-card">
                  <div className="prediction-label">
                    GAP TO MONTHLY GOAL
                  </div>

                  <div className="prediction-value">
                    {prediction.gapToMonthlyGoal} kg
                  </div>
                </div>

                <div className={`prediction-card risk ${getRiskTone(prediction.risk)}`}>
                  <div className="prediction-label">
                    RISK LEVEL
                  </div>

                  <div className="prediction-value">
                    {prediction.risk}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {loading && (
          <div className="goals-loading-note">
            Loading latest goal data...
          </div>
        )}
      </main>
    </div>
  )
}