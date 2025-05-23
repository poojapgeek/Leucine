"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

const RequestAccess = () => {
  const [software, setSoftware] = useState([])
  const [selectedSoftware, setSelectedSoftware] = useState("")
  const [accessType, setAccessType] = useState("")
  const [reason, setReason] = useState("")
  const [availableAccessLevels, setAvailableAccessLevels] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        const response = await api.get("/software")
        setSoftware(response.data.software)
      } catch (err) {
        setError("Failed to fetch software")
        console.error(err)
      } finally {
        setFetchLoading(false)
      }
    }

    fetchSoftware()
  }, [])

  useEffect(() => {
    if (selectedSoftware) {
      const selected = software.find((s) => s.id === Number(selectedSoftware))
      setAvailableAccessLevels(selected?.accessLevels || [])
      setAccessType("")
    } else {
      setAvailableAccessLevels([])
    }
  }, [selectedSoftware, software])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedSoftware || !accessType || !reason) {
      setError("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      setError("")

      await api.post("/requests", {
        softwareId: selectedSoftware,
        accessType,
        reason,
      })

      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2>Request Software Access</h2>
      {error && <div className="error-message">{error}</div>}
      {fetchLoading ? (
        <p>Loading software...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="software">Software</label>
            <select
              id="software"
              value={selectedSoftware}
              onChange={(e) => setSelectedSoftware(Number(e.target.value) || "")}
              required
            >
              <option value="">Select Software</option>
              {software.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="accessType">Access Type</label>
            <select
              id="accessType"
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              required
              disabled={!selectedSoftware}
            >
              <option value="">Select Access Type</option>
              {availableAccessLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason for Access</label>
            <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      )}
    </div>
  )
}

export default RequestAccess
