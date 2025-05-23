"use client"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">User Access Management</Link>
      </div>

      {isAuthenticated ? (
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-item">
            Dashboard
          </Link>

          {user?.role === "Employee" && (
            <Link to="/request-access" className="navbar-item">
              Request Access
            </Link>
          )}

          {user?.role === "Admin" && (
            <Link to="/create-software" className="navbar-item">
              Create Software
            </Link>
          )}

          {(user?.role === "Manager" || user?.role === "Admin") && (
            <Link to="/pending-requests" className="navbar-item">
              Pending Requests
            </Link>
          )}

          <div className="navbar-right">
            <span className="user-info">
              {user?.username} ({user?.role})
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="navbar-menu">
          <Link to="/login" className="navbar-item">
            Login
          </Link>
          <Link to="/signup" className="navbar-item">
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
