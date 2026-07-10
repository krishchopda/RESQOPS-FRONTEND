import { useState, useEffect } from "react"
import axios from "axios"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const API = "http://localhost:8000"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const ambulanceIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
})

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
})

const incidentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41],
})

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng) }
  })
  return null
}

function App() {
  const [ambulances, setAmbulances] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [incidents, setIncidents] = useState([])
  const [predictions, setPredictions] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [recommendation, setRecommendation] = useState(null)
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({
    type: "accident", severity: "high",
    latitude: "", longitude: "", description: ""
  })

  const fetchData = () => {
    axios.get(`${API}/ambulances/`).then(res => setAmbulances(res.data))
    axios.get(`${API}/hospitals/`).then(res => setHospitals(res.data))
    axios.get(`${API}/incidents/`).then(res => setIncidents(res.data))
    axios.get(`${API}/predictions/`).then(res => setPredictions(res.data))
  }

  useEffect(() => { fetchData() }, [])

  const handleMapClick = (latlng) => {
    setForm(f => ({ ...f, latitude: latlng.lat.toFixed(4), longitude: latlng.lng.toFixed(4) }))
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.latitude || !form.longitude) return
    await axios.post(`${API}/incidents/`, {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude)
    })
    setShowForm(false)
    setForm({ type: "accident", severity: "high", latitude: "", longitude: "", description: "" })
    fetchData()
  }

  const handleDispatch = async (incidentId) => {
    const res = await axios.get(`${API}/dispatch/recommend/${incidentId}`)
    setRecommendation(res.data)
  }

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return
    setAiLoading(true)
    const res = await axios.post(`${API}/ai/ask`, { question: aiQuestion })
    setAiAnswer(res.data.answer)
    setAiLoading(false)
  }

  return (
    <div style={{ fontFamily: "sans-serif", background: "#0f1117", minHeight: "100vh", color: "white" }}>

      {/* Header */}
      <div style={{ padding: "1rem 2rem", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ color: "#00ff88", margin: 0 }}>ResQOps</h1>
        <span style={{ color: "#888" }}>AI Emergency Response Operating System</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ color: "#00ff88" }}>🚑 {ambulances.filter(a => a.status === "available").length} available</span>
          <span style={{ color: "#4488ff" }}>🏥 {hospitals.length} hospitals</span>
          <span style={{ color: "#ff4444" }}>🚨 {incidents.length} incidents</span>
          {predictions && predictions.summary.critical > 0 && (
            <span style={{ background: "#ff4444", color: "white", padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
              ⚠ {predictions.summary.critical} critical alerts
            </span>
          )}
          <button onClick={() => setShowForm(!showForm)}
            style={{ background: "#ff4444", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            + New Incident
          </button>
        </div>
      </div>

      {/* Alerts Panel */}
      {predictions && predictions.summary.total_alerts > 0 && (
        <div style={{ margin: "0.75rem 2rem" }}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {predictions.hospital_alerts.map((alert, i) => (
              <div key={i} style={{
                background: alert.type === "critical" ? "#2a0a0a" : "#2a1f0a",
                border: `1px solid ${alert.type === "critical" ? "#ff4444" : "#ff8800"}`,
                borderRadius: "8px", padding: "0.75rem 1rem", flex: "1", minWidth: "200px"
              }}>
                <div style={{ fontSize: "11px", color: alert.type === "critical" ? "#ff4444" : "#ff8800", marginBottom: "4px" }}>
                  {alert.type === "critical" ? "🔴 CRITICAL" : "🟡 WARNING"} — HOSPITAL
                </div>
                <div style={{ fontSize: "13px", color: "#ccc" }}>{alert.message}</div>
              </div>
            ))}
            {predictions.hotspots.map((spot, i) => (
              <div key={i} style={{
                background: "#2a0a0a",
                border: "1px solid #ff4444",
                borderRadius: "8px", padding: "0.75rem 1rem", flex: "1", minWidth: "200px"
              }}>
                <div style={{ fontSize: "11px", color: "#ff4444", marginBottom: "4px" }}>
                  🔴 CRITICAL — HOTSPOT
                </div>
                <div style={{ fontSize: "13px", color: "#ccc" }}>{spot.message}</div>
              </div>
            ))}
            {predictions.ambulance_alerts.map((alert, i) => (
              <div key={i} style={{
                background: "#2a0a0a",
                border: "1px solid #ff4444",
                borderRadius: "8px", padding: "0.75rem 1rem", flex: "1", minWidth: "200px"
              }}>
                <div style={{ fontSize: "11px", color: "#ff4444", marginBottom: "4px" }}>
                  🔴 CRITICAL — RESOURCES
                </div>
                <div style={{ fontSize: "13px", color: "#ccc" }}>{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Panel */}
      {recommendation && (
        <div style={{ background: "#0a2a1a", border: "1px solid #00ff88", borderRadius: "8px", padding: "1.5rem", margin: "0.75rem 2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "#00ff88", margin: 0 }}>⚡ Dispatch Recommendation</h3>
            <button onClick={() => setRecommendation(null)}
              style={{ background: "transparent", color: "#888", border: "1px solid #333", padding: "4px 12px", borderRadius: "4px", cursor: "pointer" }}>
              Dismiss
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ background: "#1a1a2e", borderRadius: "6px", padding: "1rem" }}>
              <div style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>INCIDENT</div>
              <div style={{ color: "white", fontWeight: "bold" }}>{recommendation.incident?.type?.toUpperCase()}</div>
              <div style={{ color: "#ff4444" }}>{recommendation.incident?.severity}</div>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: "6px", padding: "1rem" }}>
              <div style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>AMBULANCE</div>
              <div style={{ color: "#00ff88", fontWeight: "bold" }}>{recommendation.ambulance?.name}</div>
              <div style={{ color: "#888", fontSize: "12px" }}>
                {recommendation.ambulance?.equipment} • {recommendation.ambulance?.distance_km}km • {recommendation.ambulance?.travel_time_min} min
              </div>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: "6px", padding: "1rem" }}>
              <div style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>HOSPITAL</div>
              <div style={{ color: "#4488ff", fontWeight: "bold" }}>{recommendation.hospital?.name}</div>
              <div style={{ color: "#888", fontSize: "12px" }}>
                Level {recommendation.hospital?.trauma_level} • {recommendation.hospital?.available_beds} beds • {recommendation.hospital?.travel_time_min} min
              </div>
            </div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "6px", padding: "1rem", marginBottom: "0.5rem" }}>
            <div style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>REASONING</div>
            <div style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.6" }}>{recommendation.explanation}</div>
          </div>
          <div style={{ color: "#888", fontSize: "12px" }}>
            Confidence: <span style={{ color: "#00ff88" }}>{recommendation.confidence}%</span> •
            Candidates evaluated: <span style={{ color: "#00ff88" }}>{recommendation.candidates_evaluated}</span>
          </div>
        </div>
      )}

      {/* Incident Form */}
      {showForm && (
        <div style={{ background: "#1a1a2e", border: "1px solid #ff4444", borderRadius: "8px", padding: "1.5rem", margin: "0.75rem 2rem" }}>
          <h3 style={{ color: "#ff4444", marginTop: 0 }}>🚨 Create New Incident</h3>
          <p style={{ color: "#888", fontSize: "13px" }}>Click on the map to set location, or enter coordinates manually.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ color: "#888", fontSize: "12px" }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: "100%", background: "#0f1117", color: "white", border: "1px solid #333", padding: "0.5rem", borderRadius: "4px", marginTop: "4px" }}>
                <option value="accident">Accident</option>
                <option value="cardiac">Cardiac</option>
                <option value="fire">Fire</option>
                <option value="trauma">Trauma</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#888", fontSize: "12px" }}>Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                style={{ width: "100%", background: "#0f1117", color: "white", border: "1px solid #333", padding: "0.5rem", borderRadius: "4px", marginTop: "4px" }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#888", fontSize: "12px" }}>Latitude</label>
              <input value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                placeholder="Click map"
                style={{ width: "100%", background: "#0f1117", color: "white", border: "1px solid #333", padding: "0.5rem", borderRadius: "4px", marginTop: "4px" }} />
            </div>
            <div>
              <label style={{ color: "#888", fontSize: "12px" }}>Longitude</label>
              <input value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                placeholder="Click map"
                style={{ width: "100%", background: "#0f1117", color: "white", border: "1px solid #333", padding: "0.5rem", borderRadius: "4px", marginTop: "4px" }} />
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ color: "#888", fontSize: "12px" }}>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the incident"
              style={{ width: "100%", background: "#0f1117", color: "white", border: "1px solid #333", padding: "0.5rem", borderRadius: "4px", marginTop: "4px" }} />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={handleSubmit}
              style={{ background: "#ff4444", color: "white", border: "none", padding: "0.5rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              Create Incident
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: "transparent", color: "#888", border: "1px solid #333", padding: "0.5rem 1.5rem", borderRadius: "6px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ height: "55vh", width: "100%", marginTop: "0.5rem" }}>
        <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          <MapClickHandler onMapClick={handleMapClick} />
          {ambulances.map(a => (
            <Marker key={a.id} position={[a.latitude, a.longitude]} icon={ambulanceIcon}>
              <Popup><strong>{a.name}</strong><br />Status: {a.status}<br />Equipment: {a.equipment}</Popup>
            </Marker>
          ))}
          {hospitals.map(h => (
            <Marker key={h.id} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
              <Popup><strong>{h.name}</strong><br />Beds: {h.available_beds}/{h.total_beds}<br />Trauma Level: {h.trauma_level}</Popup>
            </Marker>
          ))}
          {incidents.map(i => (
            <Marker key={i.id} position={[i.latitude, i.longitude]} icon={incidentIcon}>
              <Popup><strong>{i.type.toUpperCase()}</strong><br />Severity: {i.severity}<br />{i.description}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", padding: "1rem 2rem" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "8px", padding: "1rem" }}>
          <h3 style={{ color: "#00ff88", marginTop: 0 }}>🚑 Ambulances</h3>
          {ambulances.map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #222" }}>
              <span>{a.name}</span>
              <span style={{ color: a.status === "available" ? "#00ff88" : "#ff4444" }}>{a.status}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "8px", padding: "1rem" }}>
          <h3 style={{ color: "#4488ff", marginTop: 0 }}>🏥 Hospitals</h3>
          {hospitals.map(h => (
            <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #222" }}>
              <span>{h.name}</span>
              <span style={{ color: h.available_beds < 30 ? "#ff4444" : "#00ff88" }}>{h.available_beds} beds</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "8px", padding: "1rem" }}>
          <h3 style={{ color: "#ff4444", marginTop: 0 }}>🚨 Incidents</h3>
          {incidents.map(i => (
            <div key={i.id} style={{ padding: "8px 0", borderBottom: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{i.type}</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ color: i.severity === "critical" ? "#ff4444" : i.severity === "high" ? "#ff8800" : "#ffff00" }}>
                    {i.severity}
                  </span>
                  <button onClick={() => handleDispatch(i.id)}
                    style={{ background: "#00ff88", color: "#000", border: "none", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>
                    Dispatch
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant */}
      <div style={{ padding: "1rem 2rem 2rem" }}>
        <div style={{ background: "#1a1a2e", borderRadius: "8px", padding: "1.5rem" }}>
          <h3 style={{ color: "#00ff88", marginTop: 0 }}>🤖 AI Operations Assistant</h3>
          <p style={{ color: "#888", fontSize: "13px", margin: "0 0 1rem" }}>
            Ask anything about your current operations.
          </p>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <input
              value={aiQuestion}
              onChange={e => setAiQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAskAI()}
              placeholder="e.g. Which hospital should we avoid? Why was AMB-02 chosen?"
              style={{ flex: 1, background: "#0f1117", color: "white", border: "1px solid #333", padding: "0.75rem", borderRadius: "6px", fontSize: "13px" }}
            />
            <button
              onClick={handleAskAI}
              disabled={aiLoading}
              style={{ background: "#00ff88", color: "#000", border: "none", padding: "0.75rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
            >
              {aiLoading ? "Thinking..." : "Ask AI"}
            </button>
          </div>
          {aiAnswer && (
            <div style={{ background: "#0f1117", borderRadius: "6px", padding: "1rem", border: "1px solid #333" }}>
              <div style={{ color: "#888", fontSize: "11px", marginBottom: "8px" }}>AI RESPONSE</div>
              <div style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{aiAnswer}</div>
            </div>
          )}
          <div style={{ marginTop: "1rem", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["Which hospital should we avoid?", "What is our biggest risk right now?", "Which ambulances are available?", "Summarize current operations"].map(q => (
              <button key={q} onClick={() => setAiQuestion(q)}
                style={{ background: "transparent", color: "#888", border: "1px solid #333", padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "12px" }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

export default App