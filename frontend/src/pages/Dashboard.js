"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

const Dashboard = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get("/requests/user")
        setRequests(response.data.requests)
      } catch (err) {
        setError("Failed to fetch requests")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      <div className="welcome-message">
        <h3>Welcome, {user?.username}!</h3>
        <p>Role: {user?.role}</p>
      </div>

      <div className="actions">
        {user?.role === "Employee" && (
          <Link to="/request-access" className="action-button">
            Request Software Access
          </Link>
        )}

        {user?.role === "Admin" && (
          <Link to="/create-software" className="action-button">
            Create New Software
          </Link>
        )}

        {(user?.role === "Manager" || user?.role === "Admin") && (
          <Link to="/pending-requests" className="action-button">
            View Pending Requests
          </Link>
        )}
      </div>

      <div className="my-requests">
        <h3>My Access Requests</h3>
        {loading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : requests.length === 0 ? (
          <p>No requests found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Software</th>
                <th>Access Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.software.name}</td>
                  <td>{request.accessType}</td>
                  <td>
                    <span className={`status-${request.status.toLowerCase()}`}>{request.status}</span>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard
