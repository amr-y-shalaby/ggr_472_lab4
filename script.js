// Define Mapbox access token (replace with your own)
mapboxgl.accessToken = 'pk.eyJ1Ijoic3RhdHNtYW4wMDciLCJhIjoiY2xzZDdwc2ZnMDk1cTJwcTZ6Z2xjZmIwZSJ9.BfeF_5NRJs-0UYg-zgMSdA'; // Replace this with your Mapbox Access Token

// Define variable to hold collision data
let collisionsData;

// Fetch Collision Data (GeoJSON) from GitHub Repository
fetch('data/pedcyc_collision_06-21.geojson') // Replace this with your GeoJSON data URL
  .then(response => response.json())
  .then(data => {
    collisionsData = data; // Store the collision data
    createMap(); // Create map after data is loaded
  });

// Create Map
function createMap() {
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11', // Replace with your desired Mapbox style
    zoom: 11,
    center: [-79.3832, 43.6532] // Coordinates for Toronto
  });

  map.on('load', () => {
    // Create Bounding Box
    let bbox = turf.envelope(collisionsData);
    let bboxgeojson = {
      "type": "FeatureCollection",
      "features": [bbox]
    };

    // Scale up Bounding Box by 10%
    let bboxscaled = turf.transformScale(bbox, 1.10);

    // Extract Bounding Box Coordinates
    let bboxcoords = [
      bboxscaled.geometry.coordinates[0][0][0],
      bboxscaled.geometry.coordinates[0][0][1],
      bboxscaled.geometry.coordinates[0][2][0],
      bboxscaled.geometry.coordinates[0][2][1]
    ];

    // Create Hexgrid
    let hexgeojson = turf.hexGrid(bboxcoords, 0.5, { units: 'kilometers' });

    // Define function for calculating point counts within each hexagon
    function calculatePointCount(hexgrid) {
      let collishex = turf.collect(hexgrid, collisionsData, '_id', 'values');

      collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length;
      });

      return collishex;
    }

    // Calculate point counts within each hexagon
    let collishex = calculatePointCount(hexgeojson);

    // Add Hexgrid Layer to Map with Styling
    map.addSource('collis-hex', {
      type: 'geojson',
      data: collishex
    });

    map.addLayer({
      'id': 'collis-hex-fill',
      'type': 'fill',
      'source': 'collis-hex',
      'paint': {
        'fill-color': [
          'step',
          ['get', 'COUNT'],
          '#ffffbf',
          10,
          '#fee08b',
          25,
          '#fc4e2a',
          50,
          '#e31a1c'
        ],
        'fill-opacity': 0.7,
        'fill-outline-color': 'white'
      }
    });
  });
}