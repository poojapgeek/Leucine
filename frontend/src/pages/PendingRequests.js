"use client"

import { useState, useEffect } from "react"
import api from "../services/api"

const PendingRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get("/requests/pending")
      setRequests(response.data.requests)
    } catch (err) {
      setError("Failed to fetch pending requests")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/requests/${id}`, { status })
      // Update the local state
      setRequests(requests.filter((request) => request.id !== id))
    } catch (err) {
      setError("Failed to update request status")
      console.error(err)
    }
  }

  return (
    <div className="pending-requests-container">
      <h2>Pending Access Requests</h2>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No pending requests found.</p>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>{request.software.name}</h3>
                <span className="access-type">{request.accessType} Access</span>
              </div>
              <div className="request-details">
                <p>
                  <strong>Requested by:</strong> {request.user.username} ({request.user.email})
                </p>
                <p>
                  <strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Reason:</strong> {request.reason}
                </p>
              </div>
              <div className="request-actions">
                <button className="approve-button" onClick={() => handleUpdateStatus(request.id, "Approved")}>
                  Approve
                </button>
                <button className="reject-button" onClick={() => handleUpdateStatus(request.id, "Rejected")}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingRequests
