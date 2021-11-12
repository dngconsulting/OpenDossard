import React, { useCallback, useEffect } from "react";
import { useLeaflet, Marker } from "react-leaflet";
import { LatLng, LatLngExpression, LeafletMouseEvent } from "leaflet";

interface IMarkerProps {
  coordinates: LatLngExpression;
  updateCoordinates: (gpsCoordinates: LatLng) => void;
}

function AddMarker(props: IMarkerProps): any {
  const { map } = useLeaflet();

  const markerEvent = useCallback(
    (e: LeafletMouseEvent) => {
      props.updateCoordinates(e.latlng);
    },
    [props.updateCoordinates]
  );

  useEffect(() => {
    map?.on("contextmenu", markerEvent);
  }, []);

  return <Marker position={props.coordinates} />;
}
export default AddMarker;
