import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:5000/api",
})

// Add token to requests if available
const token = localStorage.getItem("token")
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`
}

export default api
