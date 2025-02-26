import { useRef, useEffect } from 'react';
// Import the ArcGIS core modules
import {Box} from "@mui/material"
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Layer from "@arcgis/core/layers/Layer"
import "@arcgis/core/assets/esri/css/main.css"
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer"


const EsriMap = () => {     
  // Create a ref to hold the DOM element for the map view
  const mapRef = useRef(null);


  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapRef.current)
        return
    // Create a new Map instance
    const map = new Map({
      basemap: 'topo-vector', // You can change this basemap
    });

    // Create a new MapView instance and set it to the ref's current value (the div)
    const view = new MapView({
      container: mapRef.current, // Reference to the DOM node that will hold the map
      map: map,                  // The map instance created above
      center: [-90.1994, 38.6270], // Longitude, latitude of the initial view (optional)
      zoom: 9                   // Initial zoom level (optional)
    });

  // Add the GeoJSONLayer
  const geojsonLayer = new GeoJSONLayer({
    url: "/services/api/distribution-center/geojson",
    popupTemplate: {
      title: "{center_name}", // Use center_name as the title
      content: `
        <div>
          <strong>Address:</strong> {address}<br>
          <strong>Point of Contact:</strong> {poc_email}<br>
          <strong>Phone:</strong> {poc_phone_number}<br>
          <strong>Type:</strong> {distribution_type}<br>
        </div>
      `
    },
    labelingInfo: [
      {
        symbol: {
          type: "text",
          color: "black",
          haloSize: 1,
          font: {  // autocast as new Font()
            family: "Noto Sans",
            size: 12
          }
        },
        labelPlacement: "above-center",
        labelExpressionInfo: {
          expression: "$feature.center_name"
        },
      }
    ]
  });


    map.add(geojsonLayer as Layer)
    // Clean up the MapView instance when the component is unmounted
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [ mapRef ]);

  return (
    <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        overflow: 'hidden',
        height: '100%',
        width:'100%'
        
    }}>
      <div ref={mapRef} style={{ height: "100%" }}/>
    </Box>
  ); 
};

export default EsriMap;
