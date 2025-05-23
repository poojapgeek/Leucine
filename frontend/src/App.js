"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import CreateSoftware from "./pages/CreateSoftware"
import RequestAccess from "./pages/RequestAccess"
import PendingRequests from "./pages/PendingRequests"
import Navbar from "./components/Navbar"
import "./App.css"

// Protected route component
const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-software"
                element={
                  <ProtectedRoute roles={["Admin"]}>
                    <CreateSoftware />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/request-access"
                element={
                  <ProtectedRoute roles={["Employee"]}>
                    <RequestAccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pending-requests"
                element={
                  <ProtectedRoute roles={["Manager", "Admin"]}>
                    <PendingRequests />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
