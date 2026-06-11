// Dashboard.jsx — Carbon Tracker Premium Landing Dashboard

import { useState, useEffect } from "react"
import "./Dashboard.css"
import axios from "axios"
import Navbar from "./Navbar"

axios.defaults.withCredentials = true

const DAILY_BUDGET = 13
const WEEK_BUDGET = DAILY_BUDGET * 7

const capabilityItems = [
  {
    step: "FEATURE 1",
    title: "AI Recommendations",
    className: "feature-ai",
    description:
      "Carbon Tracker uses your real activity history to generate practical sustainability recommendations. Instead of giving random generic eco tips, the assistant studies your transport choices, food habits, home energy usage, shopping behavior, and repeated high-emission activities.",
    extra:
      "This makes the AI coach more useful for daily life. It can guide you toward smaller but realistic actions such as reducing short car trips, controlling electricity-heavy habits, improving meal choices, and focusing first on the category that affects your footprint the most.",
    bullets: [
      "Personalized advice from your own carbon logs",
      "Detects repeated high-emission behavior",
      "Turns complex sustainability data into simple daily actions",
    ],
    miniInsight:
      "Adaptive sustainability guidance based on real user behavior.",
  },
  {
    step: "FEATURE 2",
    title: "Smart Analytics",
    className: "feature-analytics",
    description:
      "The Analytics system transforms your saved activities into visual insights. Daily trends, weekly direction, category breakdowns, radar profiles, and emission composition charts help you understand how your carbon footprint changes over time.",
    extra:
      "This is important because raw activity logs alone are hard to understand. Analytics helps you identify your highest-impact category, spot sudden emission spikes, compare lifestyle patterns, and understand whether your sustainability habits are improving, stable, or getting worse.",
    bullets: [
      "Daily and weekly carbon trend tracking",
      "Category-level emission comparison",
      "Visual charts for better decision-making",
    ],
    miniInsight:
      "Clear charts convert activity data into meaningful decisions.",
  },
  {
    step: "FEATURE 3",
    title: "Goal Monitoring",
    className: "feature-goals",
    description:
      "Goal Monitoring lets you set daily, weekly, and monthly carbon budgets. Your actual logged emissions are continuously compared against these targets so you can see whether your lifestyle is staying within your sustainability limits.",
    extra:
      "This turns carbon tracking from a passive record system into an active improvement tool. By showing remaining limits, warning levels, and progress meters, the app helps you avoid crossing your budget and encourages steady long-term carbon discipline.",
    bullets: [
      "Daily, weekly, and monthly carbon targets",
      "Live progress against emission budgets",
      "Warnings when usage approaches limits",
    ],
    miniInsight:
      "Track targets and stay within your sustainable carbon budget.",
  },
  {
    step: "FEATURE 4",
    title: "Carbon Score & Badge",
    className: "feature-score",
    description:
      "Your Carbon Score summarizes your sustainability performance into a simple number out of 100. It considers your emissions, budget usage, category impact, and consistency of tracking to give you an easy snapshot of your current carbon behavior.",
    extra:
      "The badge system makes this more motivating. Instead of only showing numbers, Carbon Tracker gives the user a visual identity such as Carbon Guardian, Eco Builder, Improver, or High Impact. This makes progress easier to understand and encourages better habits over time.",
    bullets: [
      "Simple sustainability score out of 100",
      "Motivational user badge system",
      "Encourages consistency and lower emissions",
    ],
    miniInsight:
      "Turn sustainability performance into a score and identity.",
  },
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

export default function Dashboard({
  user,
  onLogout,
  onNavChange,
}) {
  const [logs, setLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [aiText, setAiText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  /* ─────────────────────────────
     DATE HELPERS
  ───────────────────────────── */

  const today = new Date()

  function formatLocalDate(dateValue) {
    if (!dateValue) return ""

    const d = new Date(dateValue)

    if (Number.isNaN(d.getTime())) {
      return ""
    }

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  function getDashboardDate(log) {
    return log.createdAt || log.date
  }

  function getActivityDate(log) {
    return log.date || log.createdAt
  }

  function getLogDate(logDate) {
    return formatLocalDate(logDate)
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(todayStart.getDate() + 1)

  const weekAgo = new Date(todayStart)
  weekAgo.setDate(todayStart.getDate() - 6)

  const monthAgo = new Date(todayStart)
  monthAgo.setDate(todayStart.getDate() - 29)

  const dateStr = today
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()

  /* ─────────────────────────────
     FETCH LOGS
  ───────────────────────────── */

  useEffect(() => {
    if (!user?.email) return

    async function fetchLogs() {
      try {
        setLoadingLogs(true)

        const response = await axios.get(
          `http://localhost:3000/api/logs/${encodeURIComponent(
            user.email
          )}`,
          {
            withCredentials: true,
          }
        )

        if (
          response.data &&
          Array.isArray(response.data.logs)
        ) {
          setLogs(response.data.logs)

          console.log(
            "Dashboard logs:",
            response.data.logs.map((log) => ({
              activity: log.activity,
              kgCO2: log.kgCO2,
              date: log.date,
              createdAt: log.createdAt,
            }))
          )
        } else {
          setLogs([])
        }
      } catch (err) {
        console.log("Fetch logs failed:", err)
        setLogs([])
      } finally {
        setLoadingLogs(false)
      }
    }

    fetchLogs()
  }, [user?.email])

  /* ─────────────────────────────
     DASHBOARD CALCULATIONS
  ───────────────────────────── */

  const todayLogs = logs.filter((log) => {
    const d = new Date(getDashboardDate(log))

    if (Number.isNaN(d.getTime())) return false

    return d >= todayStart && d < tomorrowStart
  })

  const todayKg = todayLogs.reduce(
    (sum, log) => sum + Number(log.kgCO2 || 0),
    0
  )

  const weekKg = logs
    .filter((log) => {
      const d = new Date(getDashboardDate(log))

      if (Number.isNaN(d.getTime())) return false

      return d >= weekAgo && d < tomorrowStart
    })
    .reduce(
      (sum, log) => sum + Number(log.kgCO2 || 0),
      0
    )

  const monthKg = logs
    .filter((log) => {
      const d = new Date(getDashboardDate(log))

      if (Number.isNaN(d.getTime())) return false

      return d >= monthAgo && d < tomorrowStart
    })
    .reduce(
      (sum, log) => sum + Number(log.kgCO2 || 0),
      0
    )

  const weekPct = (weekKg / WEEK_BUDGET) * 100

  const overDaily = todayKg > DAILY_BUDGET

  const recentLogs = [...todayLogs].reverse().slice(0, 6)

  const userName =
    user?.name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "User"

  /* ─────────────────────────────
     CATEGORY ANALYSIS
  ───────────────────────────── */

  const transportKg = logs
    .filter((log) =>
      log.category?.toUpperCase().includes("TRANSPORT")
    )
    .reduce(
      (sum, log) => sum + Number(log.kgCO2 || 0),
      0
    )

  const foodKg = logs
    .filter((log) =>
      log.category?.toUpperCase().includes("FOOD")
    )
    .reduce(
      (sum, log) => sum + Number(log.kgCO2 || 0),
      0
    )

  const energyKg = logs
    .filter((log) =>
      log.category?.toUpperCase().includes("ENERGY")
    )
    .reduce(
      (sum, log) => sum + Number(log.kgCO2 || 0),
      0
    )

  const categoryTotals = {}

  logs.forEach((log) => {
    const category = log.category || "OTHER"

    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      Number(log.kgCO2 || 0)
  })

  const topCategoryEntry = Object.entries(
    categoryTotals
  ).sort((a, b) => b[1] - a[1])[0]

  const topCategory =
    topCategoryEntry?.[0] || "No data yet"

  const topCategoryKg =
    topCategoryEntry?.[1] || 0

  /* ─────────────────────────────
     CARBON SCORE
  ───────────────────────────── */

  const avgDaily30 = monthKg / 30

  let carbonScore = 100

  carbonScore -= Math.max(0, todayKg - DAILY_BUDGET) * 3
  carbonScore -= Math.max(0, weekPct - 100) * 0.4
  carbonScore -= avgDaily30 * 2

  if (transportKg > 40) carbonScore -= 8
  if (foodKg > 30) carbonScore -= 6
  if (energyKg > 25) carbonScore -= 6
  if (logs.length >= 10) carbonScore += 5

  if (todayKg <= DAILY_BUDGET && logs.length > 0) {
    carbonScore += 5
  }

  carbonScore = Math.max(
    0,
    Math.min(100, Math.round(carbonScore))
  )

  const scoreLabel =
    carbonScore >= 85
      ? "Excellent"
      : carbonScore >= 70
      ? "Good"
      : carbonScore >= 50
      ? "Moderate"
      : "Needs Work"

  const primaryBadge =
    carbonScore >= 85
      ? {
          icon: "🌍",
          title: "Carbon Guardian",
          text:
            "You are maintaining a strong sustainability profile.",
        }
      : carbonScore >= 70
      ? {
          icon: "🌱",
          title: "Eco Builder",
          text:
            "Your habits are improving with room for optimization.",
        }
      : carbonScore >= 50
      ? {
          icon: "🍃",
          title: "Improver",
          text:
            "Your tracking is active, but emissions need reduction.",
        }
      : {
          icon: "⚠️",
          title: "High Impact",
          text:
            "Your footprint needs attention and better goal control.",
        }

  /* ─────────────────────────────
     AI COACH
  ───────────────────────────── */

  useEffect(() => {
    if (logs.length > 0) {
      fetchAI()
    }
  }, [logs])

  async function fetchAI() {
    try {
      setAiLoading(true)
      setAiText("")

      setTimeout(() => {
        setAiText(
          `• Focus on reducing repeated high-emission activities in your daily routine.

• Try keeping your daily carbon output below ${DAILY_BUDGET} kg CO₂e to maintain a strong sustainability score.

• Use Analytics and Goals together to identify patterns and improve your weekly footprint step by step.`
        )

        setAiLoading(false)
      }, 1000)
    } catch (err) {
      console.log(err)

      setAiText("Could not load AI recommendation.")
      setAiLoading(false)
    }
  }

  /* ─────────────────────────────
     UI
  ───────────────────────────── */

  return (
    <div className="db-page">
      <video
        className="db-page-video db-page-video-light"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/forest.mp4" type="video/mp4" />
      </video>

      <video
        className="db-page-video db-page-video-dark"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/pollution.mp4" type="video/mp4" />
      </video>

      <div className="db-page-overlay"></div>

      <Navbar
        user={user}
        currentPage="DASHBOARD"
        onLogout={onLogout}
        onNavChange={onNavChange}
        badge={primaryBadge}
      />

      <main className="db-shell">
        <section className="db-landing-hero">
          <div className="db-hero-bg-panel"></div>

          <div className="db-landing-hero-content">
            <div className="db-landing-copy">
              <div className="db-latest-strip">
                <strong>TODAY</strong>
                <span>{dateStr}</span>
              </div>

              <h1>
                Smarter carbon tracking for everyday decisions.
              </h1>

              <p>
                Hello, {userName}. Carbon Tracker helps you understand
                how transport, food, energy, and shopping choices affect
                your footprint — then turns that data into goals, insights,
                scores, badges, and AI recommendations.
              </p>

              <div className="db-hero-actions">
                <button
                  className="db-primary-btn"
                  onClick={() => onNavChange("LOG")}
                >
                  LOG ACTIVITY
                </button>

                <button
                  className="db-secondary-btn"
                  onClick={() => onNavChange("ANALYTICS")}
                >
                  VIEW ANALYTICS
                </button>
              </div>

              <div className="db-hero-mini-stats">
                <div>
                  <strong>{todayKg.toFixed(2)}</strong>
                  <span>kg today</span>
                </div>

                <div>
                  <strong>{weekKg.toFixed(2)}</strong>
                  <span>kg this week</span>
                </div>

                <div>
                  <strong>{logs.length}</strong>
                  <span>logs recorded</span>
                </div>
              </div>
            </div>

            <aside className="db-score-showcase">
              <div className="db-score-label">
                CARBON SCORE
              </div>

              <div className="db-score-main">
                <div>
                  <h2>
                    {carbonScore}
                    <span>/100</span>
                  </h2>

                  <p>{scoreLabel}</p>
                </div>

                <div className="db-score-ring">
                  <div
                    className="db-score-ring-fill"
                    style={{
                      background: `conic-gradient(#5c8c5a ${
                        carbonScore * 3.6
                      }deg, rgba(255,255,255,0.24) 0deg)`,
                    }}
                  >
                    <div className="db-score-ring-inner">
                      {primaryBadge.icon}
                    </div>
                  </div>
                </div>
              </div>

              <div className="db-badge-card">
                <span>{primaryBadge.icon}</span>

                <div>
                  <strong>{primaryBadge.title}</strong>
                  <small>{primaryBadge.text}</small>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {overDaily && (
          <div className="db-alert-banner">
            <span className="db-alert-icon">⚠️</span>

            <div>
              <div className="db-alert-title">
                Daily Threshold Reached
              </div>

              <div className="db-alert-text">
                You emitted {todayKg.toFixed(2)} kg CO₂e today. Reduce
                avoidable high-emission activities to protect your score.
              </div>
            </div>
          </div>
        )}

        <section className="db-insight-strip">
          <div>
            <span>LATEST INSIGHT</span>

            <strong>
              {logs.length === 0
                ? "Start by logging one activity today."
                : `${topCategory} is your largest emission source.`}
            </strong>
          </div>

          <p>
            {logs.length === 0
              ? "Your dashboard becomes smarter after the first activity log."
              : `${topCategory} contributes ${topCategoryKg.toFixed(
                  2
                )} kg CO₂e. Use Analytics and Goals to reduce this area first.`}
          </p>
        </section>

        <section className="db-metric-grid">
          <div className="db-metric-card blue">
            <div>
              <p>TODAY</p>
              <h3>{todayKg.toFixed(2)}</h3>
              <span>kg CO₂e logged today</span>
            </div>

            <div className="db-metric-icon">↯</div>
          </div>

          <div className="db-metric-card green">
            <div>
              <p>THIS WEEK</p>
              <h3>{weekKg.toFixed(2)}</h3>
              <span>of {WEEK_BUDGET} kg weekly budget</span>
            </div>

            <div className="db-metric-icon">◎</div>
          </div>

          <div className="db-metric-card orange">
            <div>
              <p>LAST 30 DAYS</p>
              <h3>{monthKg.toFixed(2)}</h3>
              <span>{logs.length} activities logged</span>
            </div>

            <div className="db-metric-icon">▣</div>
          </div>

          <div className="db-metric-card yellow">
            <div>
              <p>WEEKLY BUDGET</p>
              <h3>{Math.min(weekPct, 100).toFixed(0)}%</h3>
              <span>utilized this week</span>
            </div>

            <div className="db-metric-icon">↗</div>
          </div>
        </section>

        <section className="db-how-section">
          <div className="db-section-heading centered">
            <p>HOW IT WORKS</p>

            <h2>
              From daily habits to measurable climate awareness.
            </h2>
          </div>

          <div className="db-step-grid">
            <article className="db-step-card">
              <div className="db-step-number">STEP 1</div>

              <h3>Log your activity</h3>

              <p>
                Add activities from transport, meals, home energy, or
                shopping. Each log is converted into estimated kg CO₂e.
              </p>
            </article>

            <article className="db-step-card accent">
              <div className="db-step-number">STEP 2</div>

              <h3>Analyze your footprint</h3>

              <p>
                Charts and summaries reveal your daily pattern, strongest
                emission categories, and long-term sustainability direction.
              </p>
            </article>

            <article className="db-step-card">
              <div className="db-step-number">STEP 3</div>

              <h3>Improve with AI goals</h3>

              <p>
                Carbon score, badges, goal meters, alerts, and AI coaching
                help you reduce repeated high-emission behavior.
              </p>
            </article>
          </div>
        </section>

        <section className="db-story-section">
          <div className="db-story-visual">
            <div className="db-floating-card one">
              <span>CO₂</span>
              <strong>{todayKg.toFixed(2)} kg</strong>
              <small>today</small>
            </div>

            <div className="db-floating-card two">
              <span>AI</span>
              <strong>Coach</strong>
              <small>smart tips</small>
            </div>

            <div className="db-floating-card three">
              <span>Goal</span>
              <strong>
                {Math.min(weekPct, 100).toFixed(0)}%
              </strong>
              <small>weekly use</small>
            </div>
          </div>

          <div className="db-story-copy">
            <p className="db-section-kicker">
              WHY CARBON TRACKING MATTERS
            </p>

            <h2>
              Small daily decisions create long-term environmental impact.
            </h2>

            <p>
              Carbon emissions contribute to climate change, extreme heat,
              air pollution, ecological imbalance, and rising sea levels.
              Most people know emissions matter, but they rarely see how
              daily lifestyle choices add up.
            </p>

            <p>
              Carbon Tracker solves this by turning ordinary activities into
              measurable data. That data becomes practical guidance: where
              your footprint comes from, what to reduce first, and how your
              sustainability habits improve over time.
            </p>
          </div>
        </section>

        <section className="db-feature-showcase-section">
          <div className="db-section-head">
            <p className="db-section-kicker">
              PLATFORM CAPABILITIES
            </p>

            <h2 className="db-section-title">
              Explore what Carbon Tracker can do for you.
            </h2>

            <p className="db-section-subtitle">
              Each capability is designed to help users move from simple
              activity logging to meaningful carbon awareness. The platform
              connects tracking, analytics, goals, scoring, and AI guidance
              into one personal sustainability system.
            </p>
          </div>

          <div className="db-feature-showcase-list">
            {capabilityItems.map((item, index) => (
              <section
                key={item.title}
                className={`db-feature-showcase ${
                  index % 2 !== 0 ? "reverse" : ""
                }`}
              >
                <div className={`db-feature-visual ${item.className}`}>
                  <div className="db-feature-visual-overlay"></div>

                  <div className="db-feature-mini-card db-feature-mini-card--top">
                    <span className="db-feature-mini-label">
                      {item.step}
                    </span>

                    <strong>{item.title}</strong>
                  </div>

                  <div className="db-feature-mini-card db-feature-mini-card--bottom">
                    <span className="db-feature-mini-stat">
                      INSIGHT
                    </span>

                    <p>{item.miniInsight}</p>
                  </div>
                </div>

                <div className="db-feature-content">
                  <p className="db-feature-step">
                    {item.step}
                  </p>

                  <h3 className="db-feature-title">
                    {item.title}
                  </h3>

                  <p className="db-feature-text">
                    {item.description}
                  </p>

                  <p className="db-feature-text">
                    {item.extra}
                  </p>

                  <ul className="db-feature-points">
                    {item.bullets.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="db-coach-section">
          <div className="db-coach-panel">
            <p className="db-section-kicker">
              AI CARBON COACH
            </p>

            <h2>
              Personalized advice from your own carbon data.
            </h2>

            <p>
              The coach reads your activity logs and turns them into simple
              improvement actions. It is designed to make sustainability
              practical instead of overwhelming.
            </p>

            <button
              className="db-refresh-btn"
              onClick={fetchAI}
              disabled={
                aiLoading || loadingLogs || logs.length === 0
              }
            >
              {aiLoading ? "ANALYSING..." : "REFRESH ADVICE"}
            </button>
          </div>

          <div className="db-ai-card elevated">
            {loadingLogs ? (
              <p className="db-ai-empty">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="db-ai-empty">
                Log activities to receive AI suggestions.
              </p>
            ) : aiLoading ? (
              <div className="db-ai-loading">
                ⟳ Analysing habits...
              </div>
            ) : (
              <>
                <div className="db-ai-badge">
                  ✦ AI RECOMMENDATION
                </div>

                <div className="db-ai-text better-visible">
                  {aiText.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="db-recent-section">
          <div className="db-section-heading">
            <p>RECENT ACTIVITIES</p>

            <h2>Today’s logged footprint.</h2>
          </div>

          <div className="db-recent-card">
            {loadingLogs ? (
              <p className="db-ai-empty">Loading activities...</p>
            ) : recentLogs.length === 0 ? (
              <div className="db-recent-empty">
                No activities logged today. Start by adding your first
                activity.
              </div>
            ) : (
              recentLogs.map((log) => {
                const catClass = getCategoryClass(log.category)

                return (
                  <div
                    key={log._id}
                    className={`db-recent-row ${catClass}`}
                  >
                    <div className="db-recent-left">
                      <div className={`db-recent-dot ${catClass}`}>
                        {getCategoryIcon(log.category)}
                      </div>

                      <div>
                        <div className="db-log-title">
                          {log.activity}
                        </div>

                        <div className="db-log-sub">
                          {log.category} •{" "}
                          {getLogDate(getActivityDate(log))}
                        </div>
                      </div>
                    </div>

                    <div className="db-recent-kg">
                      {Number(log.kgCO2 || 0).toFixed(2)} kg
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>
    </div>
  )
}