import { useEffect, useState } from "react"
import axios from "axios"
import "./Notifications.css"

axios.defaults.withCredentials = true

export default function Notifications({ user }) {

  const [notifications, setNotifications] = useState([])

  const [open, setOpen] = useState(false)

  /* ───────────────── FETCH ───────────────── */

  async function fetchNotifications() {

    try {

      const response = await axios.get(
        `http://localhost:3000/api/notifications/${user.email}`
      )

      if (response.data.success) {

        setNotifications(
          response.data.notifications || []
        )
      }

    } catch (err) {

      console.log(err)
    }
  }

  useEffect(() => {

    if (user?.email) {

      fetchNotifications()
    }

  }, [user])

  /* ───────────────── UNREAD ───────────────── */

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length

  /* ───────────────── MARK READ ───────────────── */

  async function markAsRead(id) {

    try {

      await axios.put(
        `http://localhost:3000/api/notifications/read/${id}`
      )

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, read: true }
            : n
        )
      )

    } catch (err) {

      console.log(err)
    }
  }

  /* ───────────────── UI ───────────────── */

  return (

    <div className="notify">

      {/* BELL */}

      <button
        className="notify-bell"
        onClick={() => setOpen(!open)}
      >
        🔔

        {unreadCount > 0 && (

          <span className="notify-count">
            {unreadCount}
          </span>

        )}

      </button>

      {/* DROPDOWN */}

      {open && (

        <div className="notify-dropdown">

          <div className="notify-header">
            Notifications
          </div>

          {notifications.length === 0 ? (

            <div className="notify-empty">
              No notifications
            </div>

          ) : (

            notifications.map((n) => (

              <div
                key={n._id}
                className={`notify-item ${
                  n.read
                    ? "notify-read"
                    : ""
                }`}
                onClick={() =>
                  markAsRead(n._id)
                }
              >

                <div className="notify-title">
                  {n.title}
                </div>

                <div className="notify-message">
                  {n.message}
                </div>

                <div className="notify-time">
                  {new Date(
                    n.createdAt
                  ).toLocaleString()}
                </div>

              </div>

            ))

          )}

        </div>

      )}

    </div>
  )
}