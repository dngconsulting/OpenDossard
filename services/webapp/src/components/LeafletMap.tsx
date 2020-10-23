import React from 'react';
import { Map, TileLayer, withLeaflet } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import { ReactLeafletSearch } from "react-leaflet-search";
import AddMarker from './AddMarker'


//coord Toulouse
const defaultLatLng: LatLngTuple = [43.60402833617685, 1.443417711065598];

//zoom initial
const zoom: number = 8;

interface IleafletProps {
  coord: any; position: any;
}

const LeafletMap: any = (props: IleafletProps) => {

  function getPosition(value: any) {
    props.position(value)
  }

  const ReactLeafletSearchComponent = withLeaflet(ReactLeafletSearch);

  return (
    <div>

      <Map id="mapId"
        center={defaultLatLng}
        zoom={zoom}
        showMarker={props.coord.position}>
        <ReactLeafletSearchComponent
          className="searchBar" //searchBar
          position="topright"
          inputPlaceholder="Custom placeholder"
          showMarker={false}
          zoom={16}
          showPopup={false}
          closeResultsOnClick={true}
          openSearchOnLoad={true}
        />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors">
        </TileLayer>
        <AddMarker coord={getPosition} position={props.coord}
        />
      </Map>
    </div>
  )
}
export default LeafletMap;