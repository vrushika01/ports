// pop window
// Initialize the map and set the view to Gujarat
const map = L.map("map").setView([22.2587, 71.1924], 7);

// Add a tile layer (map appearance)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Variable to keep track of the currently highlighted markers
let highlightedMarkers = [];

// Function to clear highlighted markers
function clearHighlightedMarkers() {
  highlightedMarkers.forEach((marker) => map.removeLayer(marker));
  highlightedMarkers = [];
}

// Function to show popup with port details
function showPopup(portName, portInfo, detailsPage) {
  const popup = document.getElementById("popup");
  const popupContent = document.getElementById("popupContent");

  popupContent.innerHTML = `
    <p><strong>Port Name:</strong> ${portName}</p>
    <p><strong>Details:</strong> ${portInfo}</p>
    <iframe src="${detailsPage}" style="width:100%; height:400px; border:none; margin-top:10px;"></iframe>
    
  `;      
  popup.style.display = "block";
}

// Function to close popup
function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
}

// Function to add individual port markers with a different color
function addIndividualPortMarkers(ports) {
    ports.forEach((port) => {
      const marker = L.marker([port.coordinates[1], port.coordinates[0]], {
        icon: L.icon({
          iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Marker icon
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          // Custom color for individual port markers
          className: "individual-port-marker", // Added custom class for styling
        }),
      }).addTo(map);
      highlightedMarkers.push(marker);
  
      // Add tooltip to individual port markers
      marker.bindTooltip(port.name, {
        permanent: false,
        direction: "top",
        offset: [0, -40],
      })
       // Add click event to show popup when an individual port is clicked
       marker.on("click", function () {
        showPopup(port.name, port.info, port.detailsPage);
    });
});
}

// Add ports data to the map
L.geoJSON(portsData, {
  onEachFeature: function (feature, layer) {
    const { name, info,detailsPage } = feature.properties;

    layer.on("click", function () {
      const coordinates = feature.geometry.coordinates;

      // Fly to the clicked port's location
      if (coordinates) {
        map.flyTo([coordinates[1], coordinates[0]], 10, { duration: 1.5 });
      }

//If the feature is a group, display individual ports
if (feature.ports && Array.isArray(feature.ports)) {
    clearHighlightedMarkers(); // Clear any previous highlights
    addIndividualPortMarkers(feature.ports); // Add individual port markers
  }

      // Show the popup with port details
      showPopup(name, info, detailsPage);
    });

    // Show label on hover
    layer.bindTooltip(name, {
      permanent: false, // Tooltip appears only on hover
      direction: "top", // Position the label above the marker
      offset: [0, -40], // Move label slightly above the marker
      opacity: 1.0, // Slight transparency for better visibility
    });
  },

  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Marker icon
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    });
  },
}).addTo(map);

// Add a search control for ports
const searchControl = L.control({ position: "topright" });

searchControl.onAdd = function () {
  const div = L.DomUtil.create("div", "search-container");
  div.innerHTML = `
    <input type="text" id="searchBox" placeholder="Search Ports or Groups..." style="width: 200px; padding: 5px; border: 1px solid #ccc; border-radius: 5px;">
    <ul id="searchResults" style="list-style-type: none; margin: 5px 0 0; padding: 0; border: 1px solid #ccc; border-radius: 5px; 
        max-height: 150px; overflow-y: auto; background: white; display: none;">
    </ul>
  `;
  return div;
};

searchControl.addTo(map);

// Debounce function to optimize search
let debounceTimer;
function debounce(callback, delay) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(callback, delay);
}

// Add search functionality
document.getElementById("searchBox").addEventListener("input", function (e) {
  debounce(() => {
    const searchTerm = e.target.value.toLowerCase();
    const resultsList = document.getElementById("searchResults");
    resultsList.innerHTML = "";
    resultsList.style.display = searchTerm ? "block" : "none";

    clearHighlightedMarkers();

    const matchingResults = [];
    portsData.features.forEach((feature) => {
      const { name, info, detailsPage } = feature.properties;

      if (name.toLowerCase().includes(searchTerm)) {
        matchingResults.push({
          name,
          coordinates: feature.geometry.coordinates,
          info,
          detailsPage,
          isGroup: true,
          group: feature,
        });
      }

      if (feature.ports && Array.isArray(feature.ports)) {
        feature.ports.forEach((port) => {
          if (port.name.toLowerCase().includes(searchTerm)) {
            matchingResults.push({
              name: port.name,
              coordinates: port.coordinates,
              info: port.info,
              detailsPage: port.detailsPage,
              isGroup: false,
            });
          }
        });
      }
    });

    if (matchingResults.length > 0) {
      matchingResults.forEach((result) => {
        const listItem = document.createElement("li");
        listItem.style.padding = "5px";
        listItem.style.cursor = "pointer";
        listItem.style.borderBottom = "1px solid #ccc";
        listItem.textContent = result.name;

        listItem.addEventListener("click", function () {
          map.flyTo([result.coordinates[1], result.coordinates[0]], result.isGroup ? 10 : 12, { duration: 1.5 });

          if (result.isGroup) {
            const groupMarker = L.marker([result.coordinates[1], result.coordinates[0]], {
              icon: L.divIcon({
                className: "highlighted-group",
                html: `<div style="background-color: blue; width: 14px; height: 14px; border-radius: 50%;"> </div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              }),
            }).addTo(map);
            highlightedMarkers.push(groupMarker);

            result.group.ports.forEach((port) => {
              const portMarker = L.marker([port.coordinates[1], port.coordinates[0]], {
                icon: L.icon({
                  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  className: "individual-port-marker",
                }),
              }).addTo(map);
              highlightedMarkers.push(portMarker);
            });
          } else {
            const portMarker = L.marker([result.coordinates[1], result.coordinates[0]], {
              icon: L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                className: "individual-port-marker",
              }),
            }).addTo(map);
            highlightedMarkers.push(portMarker);
          }

          // Show popup for the selected port (same as when clicking a port)
          showPopup(result.name, result.info, result.detailsPage);

          resultsList.style.display = "none";
        });

        resultsList.appendChild(listItem);
      });
    } else {
      const noResultsItem = document.createElement("li");
      noResultsItem.style.padding = "5px";
      noResultsItem.style.color = "#999";
      noResultsItem.textContent = "No matching ports found.";
      resultsList.appendChild(noResultsItem);
    }
  }, 100);
});
// Function to close popup and reset map view
function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
  clearHighlightedMarkers();
  
  // Reset map view to default coordinates
  map.setView([22.2587, 71.1924], 7);
}
