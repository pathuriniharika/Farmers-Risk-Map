// Initialize the map centered on Iowa with a default zoom level
var map = L.map('map').setView([41.5868, -93.6091], 6);

// Add a light-themed base layer (default)
var lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add a dark-themed base layer (used for Dark Mode)
var darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors & CARTO'
});

// Add state outlines using GeoJSON
fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: "#ffffff", // White outline for states
                weight: 1,       // Thin lines
                opacity: 0.8     // Slightly transparent
            }
        }).addTo(map);
    });

// Create groups for earthquake and weather alert data
var earthquakeLayer = L.markerClusterGroup(); // For clustering earthquake markers
var weatherLayer = L.layerGroup(); // For weather alerts

// Fetch and display earthquake data
fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng); // Display each earthquake as a marker
            },
            onEachFeature: function (feature, layer) {
                // Show earthquake details in a popup
                layer.bindPopup(`
                    <b>Magnitude:</b> ${feature.properties.mag || "N/A"}<br>
                    <b>Location:</b> ${feature.properties.place || "Unknown"}
                `);
            }
        }).addTo(earthquakeLayer); // Add earthquakes to the group
    });

// Fetch and display weather alerts
fetch("https://api.weather.gov/alerts/active")
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                // Style alerts based on severity
                var severity = feature.properties.severity || "Minor";
                var color = severity === "Severe" ? "red" : severity === "Moderate" ? "orange" : "yellow";
                return { color: color, weight: 2 };
            },
            onEachFeature: function (feature, layer) {
                // Show weather alert details in a popup
                layer.bindPopup(`
                    <b>Alert:</b> ${feature.properties.headline || "No headline"}<br>
                    <b>Severity:</b> ${feature.properties.severity || "Unknown"}
                `);
            }
        }).addTo(weatherLayer);
    });

// Add both layers to the map
earthquakeLayer.addTo(map);
weatherLayer.addTo(map);

// Add controls to toggle between layers
L.control.layers({ "Earthquakes": earthquakeLayer, "Weather Alerts (US Only)": weatherLayer }).addTo(map);

// Add a legend
var legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
        <b>Legend</b><br>
        <i style="background: red; width: 12px; height: 12px; display: inline-block; margin-right: 6px;"></i> Severe Alerts<br>
        <i style="background: orange; width: 12px; height: 12px; display: inline-block; margin-right: 6px;"></i> Moderate Alerts<br>
        <i style="background: yellow; width: 12px; height: 12px; display: inline-block; margin-right: 6px;"></i> Weather Alerts (US Only)
    `;
    return div;
};
legend.addTo(map);

// Add a theme toggle button
let isDarkMode = false;
document.getElementById("theme-toggle").addEventListener("click", function () {
    if (isDarkMode) {
        // Switch to Light Mode
        map.removeLayer(darkTileLayer);
        map.addLayer(lightTileLayer);
        document.body.classList.remove("dark-mode");
        this.textContent = "Switch to Dark Mode";
    } else {
        // Switch to Dark Mode
        map.removeLayer(lightTileLayer);
        map.addLayer(darkTileLayer);
        document.body.classList.add("dark-mode");
        this.textContent = "Switch to Light Mode";
    }
    isDarkMode = !isDarkMode;
});

// Add both layers to the map
earthquakeLayer.addTo(map);
weatherLayer.addTo(map);

// Check if there are no alerts in the default view
if (earthquakeLayer.getLayers().length === 0 && weatherLayer.getLayers().length === 0) {
    L.popup()
        .setLatLng(map.getCenter())
        .setContent(`
            <b>No active earthquake or weather alerts in the default view.</b><br>
            Please zoom out or pan the map to explore other areas.
        `)
        .openOn(map);
}

// Add a welcome popup
L.popup()
    .setLatLng(map.getCenter())
    .setContent(`
        <b>Welcome to Farmers Risk Map!</b><br>
        Explore real-time earthquake and weather alerts.<br>
        - Click on icons for details.<br>
        - Zoom out or pan to discover more alerts.
    `)
    .openOn(map);