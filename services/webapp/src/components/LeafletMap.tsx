import React from "react";
import { LayersControl, Map, TileLayer, withLeaflet } from "react-leaflet";
import { ReactLeafletSearch } from "react-leaflet-search";
import { LatLng } from "leaflet";
import AddMarker from "./AddMarker";

interface ILeafletProps {
  commune: string;
  lat: number;
  lng: number;
  updateCoordinates: (gpsCoordinates: LatLng) => void;
}
export const DEFAULT_LAT = 43.604652;
export const DEFAULT_LNG = 1.444209;
const LeafletMap = (props: ILeafletProps) => {
  const zoom = 14;

  const ReactLeafletSearchComponent = withLeaflet(ReactLeafletSearch);

  function setGPSCoordinates(gpsCoordinates: LatLng): void {
    props.updateCoordinates(gpsCoordinates);
  }

  return (
    <Map id="mapId" center={{ lat: props.lat, lng: props.lng }} zoom={zoom}>
      <ReactLeafletSearchComponent
        className="searchBar"
        position="topright"
        providerOptions={{ region: "fr" }}
        inputPlaceholder={
          "Saisir " +
          (props.commune ? "'" + props.commune + "'" : "code postal") +
          " ou commune"
        }
        showMarker={false}
        zoom={zoom}
        showPopup={true}
        closeResultsOnClick={true}
        openSearchOnLoad={true}
      />

      <LayersControl position="topleft">
        <LayersControl.BaseLayer checked name="Vue cartographique">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Vue satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Sattelite"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <AddMarker
        updateCoordinates={setGPSCoordinates}
        coordinates={{ lat: props.lat, lng: props.lng }}
      />
    </Map>
  );
};
export default LeafletMap;
