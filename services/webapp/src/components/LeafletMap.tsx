import React from 'react';
import { Map, TileLayer, withLeaflet } from 'react-leaflet';
import { ReactLeafletSearch } from "react-leaflet-search";
import {LatLng, LatLngExpression} from 'leaflet';
import AddMarker from './AddMarker';

interface ILeafletProps {
  lat: number;
  lng: number;
  updateCoordinates: (gpsCoordinates: LatLng)=>void,
}

const LeafletMap = (props: ILeafletProps) => {
    const zoom = 12;
    const coordinates: LatLngExpression = [props.lat, props.lng];
    const ReactLeafletSearchComponent = withLeaflet(ReactLeafletSearch);

    function setGPSCoordinates(gpsCoordinates: LatLng):void {
        props.updateCoordinates(gpsCoordinates);
    }

    return (
        <Map id="mapId"
             center={coordinates}
             zoom={zoom}>
            <ReactLeafletSearchComponent className="searchBar"
                                         position="topright"
                                         inputPlaceholder="Custom placeholder"
                                         showMarker={false}
                                         zoom={16}
                                         showPopup={false}
                                         closeResultsOnClick={true}
                                         openSearchOnLoad={true} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                       attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors" />
            <AddMarker updateCoordinates={setGPSCoordinates} coordinates={coordinates}/>
        </Map>
    )
}
export default LeafletMap;