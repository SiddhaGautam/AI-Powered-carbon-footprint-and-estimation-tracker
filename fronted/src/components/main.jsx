// Main.jsx

import { useState } from "react"
import axios from "axios"

function Main() {

    const [view, setview] = useState("signup")
    const [issignup, setissignup] = useState(false)

    async function handleSignupSubmit(e, data) {

        e.preventDefault()

        try {

            const response = await axios.post(
                "http://localhost:3000/signup",
                data
            )

            console.log(response.data)

            alert("Signup successful")

            setissignup(true)

            setview("login")

        } catch (err) {

            console.log(err)

            alert("Signup failed")
        }
    }

    function handleLoginSubmit(e, data) {

        e.preventDefault()

        if (!issignup) {

            alert("You must sign up first!")

            setview("signup")

            return
        }

        console.log("Login Data:", data)

        alert("Logged in successfully")
    }

    return (

        <div>

            {
                view === "signup" ? (

                    <div>

                        <h2>Create an Account</h2>

                        <Signup onSubmit={handleSignupSubmit} />

                        <p>

                            Already have an account?

                            <button onClick={() => setview("login")}>
                                Login
                            </button>

                        </p>

                    </div>

                ) : (

                    <div>

                        <h2>Login Page</h2>

                        <Login onSubmit={handleLoginSubmit} />

                        <p>

                            No Account? Signup then

                            <button onClick={() => setview("signup")}>
                                Signup
                            </button>

                        </p>

                    </div>
                )
            }

        </div>
    )
}

function Signup({ onSubmit }) {

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: ""
    })

    function handleChange(e) {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (

        <form onSubmit={(e) => onSubmit(e, formData)}>

            <div>

                <label htmlFor="first_name">
                    First Name
                </label>

                <input
                    type="text"
                    placeholder="Enter your first name"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                />

            </div>

            <div>

                <label htmlFor="last_name">
                    Last Name
                </label>

                <input
                    type="text"
                    placeholder="Enter your last name"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                />

            </div>

            <div>

                <label htmlFor="email">
                    Email ID
                </label>

                <input
                    type="email"
                    placeholder="Enter email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

            </div>

            <div>

                <label htmlFor="password">
                    Password
                </label>

                <input
                    type="password"
                    placeholder="Enter password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

            </div>

            <button type="submit">
                Signup
            </button>

        </form>
    )
}

function Login({ onSubmit }) {

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    function handleChange(e) {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (

        <form onSubmit={(e) => onSubmit(e, formData)}>

            <div>

                <label htmlFor="email">
                    Email ID
                </label>

                <input
                    type="email"
                    placeholder="Enter email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

            </div>

            <div>

                <label htmlFor="password">
                    Password
                </label>

                <input
                    type="password"
                    placeholder="Enter password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

            </div>

            <button type="submit">
                Login
            </button>

        </form>
    )
}

export default Main