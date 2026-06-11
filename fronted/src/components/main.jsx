import { useState } from "react"
import axios from "axios"
import "./Main.css"

axios.defaults.withCredentials = true

function Main({ onLogin }) {
  const [view, setView] = useState("login")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  /* ─────────────────────────────
     SIGNUP
  ───────────────────────────── */

  async function handleSignupSubmit(e, data) {
    e.preventDefault()

    setLoading(true)
    setMessage(null)

    try {
      const response = await axios.post(
        "http://localhost:3000/signup",
        data
      )

      console.log("Signup:", response.data)

      setMessage({
        type: "success",
        text: "Account created successfully. Please login.",
      })

      setView("login")
    } catch (err) {
      console.log(err)

      setMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Signup failed. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  /* ─────────────────────────────
     LOGIN
  ───────────────────────────── */

  async function handleLoginSubmit(e, data) {
    e.preventDefault()

    setLoading(true)
    setMessage(null)

    try {
      const response = await axios.post(
        "http://localhost:3000/login",
        data
      )

      console.log("Login:", response.data)

      setMessage({
        type: "success",
        text: "Logged in successfully.",
      })

      onLogin(response.data.user)
    } catch (err) {
      console.log(err)

      setMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Invalid email or password.",
      })
    } finally {
      setLoading(false)
    }
  }

  function switchView(nextView) {
    setMessage(null)
    setView(nextView)
  }

  return (
    <div className="auth-page">
      {/* BACKGROUND */}

      <div className="auth-bg"></div>
      <div className="auth-bg-overlay"></div>
      <div className="auth-vignette"></div>

      {/* AUTH CARD */}

      <main
        className={`auth-card ${
          view === "signup" ? "auth-card--signup" : ""
        }`}
      >
        <AuthBrand />

        {view === "login" ? (
          <>
            <section className="auth-heading-block">
              <h1 className="auth-title">
                WELCOME BACK
              </h1>

              <p className="auth-subtitle">
                Login to track your carbon journey
              </p>
            </section>

            {message && (
              <div className={`auth-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <LoginForm
              onSubmit={handleLoginSubmit}
              loading={loading}
            />

            <p className="auth-switch">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => switchView("signup")}
              >
                Register here
              </button>
            </p>
          </>
        ) : (
          <>
            <section className="auth-heading-block">
              <h1 className="auth-title">
                CREATE ACCOUNT
              </h1>

              <p className="auth-subtitle">
                Sign up to start tracking your carbon journey
              </p>
            </section>

            {message && (
              <div className={`auth-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <SignupForm
              onSubmit={handleSignupSubmit}
              loading={loading}
            />

            <p className="auth-switch">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => switchView("login")}
              >
                Login here
              </button>
            </p>
          </>
        )}
      </main>
    </div>
  )
}

/* ─────────────────────────────
   BRAND
───────────────────────────── */

function AuthBrand() {
  return (
    <div className="auth-brand">
      <div className="auth-energy-logo">
        <svg
          viewBox="0 0 64 64"
          className="auth-energy-svg"
          aria-hidden="true"
        >
          <path
            d="M34 4L13 35h17l-4 25 25-35H34l5-21z"
            className="auth-bolt"
          />

          <path
            d="M39 43c8-10 17-9 20-8-1 8-6 17-17 17-5 0-8-3-9-4 2 0 4-1 6-5z"
            className="auth-leaf"
          />
        </svg>
      </div>

      <span className="auth-brand-text">
        CARBONTRACKER
      </span>
    </div>
  )
}

/* ─────────────────────────────
   SIGNUP FORM
───────────────────────────── */

function SignupForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  })

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <form
      className="auth-form"
      onSubmit={(e) => onSubmit(e, formData)}
    >
      <div className="auth-field">
        <label className="auth-label">
          FIRST NAME
        </label>

        <input
          className="auth-input"
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          autoComplete="given-name"
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label">
          LAST NAME
        </label>

        <input
          className="auth-input"
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          autoComplete="family-name"
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label">
          EMAIL
        </label>

        <input
          className="auth-input"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label">
          PASSWORD
        </label>

        <input
          className="auth-input"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />
      </div>

      <button
        className="auth-submit-btn"
        type="submit"
        disabled={loading}
      >
        {loading ? "CREATING..." : "SIGN UP"}
      </button>
    </form>
  )
}

/* ─────────────────────────────
   LOGIN FORM
───────────────────────────── */

function LoginForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <form
      className="auth-form"
      onSubmit={(e) => onSubmit(e, formData)}
    >
      <div className="auth-field">
        <label className="auth-label">
          EMAIL
        </label>

        <input
          className="auth-input"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label">
          PASSWORD
        </label>

        <input
          className="auth-input"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />
      </div>

      <button
        className="auth-submit-btn"
        type="submit"
        disabled={loading}
      >
        {loading ? "SIGNING IN..." : "LOGIN"}
      </button>
    </form>
  )
}

export default Main