"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

const CreateSoftware = () => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [accessLevels, setAccessLevels] = useState(["Read"])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleAccessLevelChange = (level) => {
    if (accessLevels.includes(level)) {
      setAccessLevels(accessLevels.filter((l) => l !== level))
    } else {
      setAccessLevels([...accessLevels, level])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !description || accessLevels.length === 0) {
      setError("Please fill in all fields and select at least one access level")
      return
    }

    try {
      setLoading(true)
      setError("")

      await api.post("/software", { name, description, accessLevels })
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create software")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2>Create New Software</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Software Name</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Access Levels</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={accessLevels.includes("Read")}
                onChange={() => handleAccessLevelChange("Read")}
              />
              Read
            </label>
            <label>
              <input
                type="checkbox"
                checked={accessLevels.includes("Write")}
                onChange={() => handleAccessLevelChange("Write")}
              />
              Write
            </label>
            <label>
              <input
                type="checkbox"
                checked={accessLevels.includes("Admin")}
                onChange={() => handleAccessLevelChange("Admin")}
              />
              Admin
            </label>
          </div>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Software"}
        </button>
      </form>
    </div>
  )
}

export default CreateSoftware
