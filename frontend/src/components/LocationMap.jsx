import React from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { MapPin } from "lucide-react";

export default function LocationMap({ latitude, longitude }) {
  const available = Number.isFinite(latitude) && Number.isFinite(longitude);
  const position = available ? [latitude, longitude] : [17.385, 78.4867];
  return (
    <section className="panel location-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">LIVE GPS</span><h2>Bag location</h2></div>
        <span className={`location-chip ${available ? "available" : ""}`}><MapPin size={14} />{available ? "GPS FIX" : "NO GPS"}</span>
      </div>
      {available ? (
        <>
          <div className="map-wrap">
            <MapContainer center={position} zoom={15} scrollWheelZoom={false} key={`${latitude}-${longitude}`}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker center={position} radius={9} pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.85 }}>
                <Tooltip>Smart Bag location</Tooltip>
              </CircleMarker>
            </MapContainer>
          </div>
          <div className="coordinates"><span>LATITUDE <strong>{latitude.toFixed(5)}</strong></span><span>LONGITUDE <strong>{longitude.toFixed(5)}</strong></span></div>
        </>
      ) : (
        <div className="map-unavailable"><MapPin size={27} /><strong>Location unavailable</strong><span>GPS coordinates will appear when the bag sends a location.</span></div>
      )}
    </section>
  );
}
