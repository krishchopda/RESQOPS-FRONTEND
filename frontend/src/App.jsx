import { useState, useEffect } from "react"
import axios from "axios"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const API = "http://localhost:8000"

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const ambulanceIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const incidentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function App() {
  const [ambulances, setAmbulances] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [incidents, setIncidents] = useState([])

  useEffect(() => {
    axios.get(`${API}/ambulances/`).then(res => setAmbulances(res.data))
    axios.get(`${API}/hospitals/`).then(res => setHospitals(res.data))
    axios.get(`${API}/incidents/`).then(res => setIncidents(res.data))
  }, [])

  return (
    <div style={{ fontFamily: "sans-serif", background: "#0f1117", minHeight: "100vh", color: "white" }}>
      
      {/* Header */}
      <div style={{ padding: "1rem 2rem", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ color: "#00ff88", margin: 0 }}>ResQOps</h1>
        <span style={{ color: "#888" }}>AI Emergency Response Operating System</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "1rem" }}>
          <span style={{ color: "#00ff88" }}>🚑 {ambulances.filter(a => a.status === "available").length} available</span>
          <span style={{ color: "#4488ff" }}>🏥 {hospitals.length} hospitals</span>
          <span style={{ color: "#ff4444" }}>🚨 {incidents.length} incidents</span>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: "60vh", width: "100%" }}>
        <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />
          {ambulances.map(a => (
            <Marker key={a.id} position={[a.latitude, a.longitude]} icon={ambulanceIcon}>
              <Popup>
                <strong>{a.name}</strong><br />
                Status: {a.status}<br />
                Equipment: {a.equipment}
              </Popup>
            </Marker>
          ))}
          {hospitals.map(h => (
            <Marker key={h.id} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
              <Popup>
                <strong>{h.name}</strong><br />
                Beds available: {h.available_beds}/{h.total_beds}<br />
                Trauma Level: {h.trauma_level}
              </Popup>
            </Marker>
          ))}
          {incidents.map(i => (
            <Marker key={i.id} position={[i.latitude, i.longitude]} icon={incidentIcon}>
              <Popup>
                <strong>{i.type.toUpperCase()}</strong><br />
                Severity: {i.severity}<br />
                {i.description}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats row */}
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
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #222" }}>
              <span>{i.type}</span>
              <span style={{ color: i.severity === "critical" ? "#ff4444" : i.severity === "high" ? "#ff8800" : "#ffff00" }}>{i.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App