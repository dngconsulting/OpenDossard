import React, { useCallback, useEffect } from 'react';
import { useLeaflet, Marker } from 'react-leaflet';
import {LatLng, LatLngExpression, LeafletMouseEvent} from 'leaflet';

interface IMarkerProps {
    coordinates: LatLngExpression,
    updateCoordinates: (gpsCoordinates: LatLng) => void,
}

function AddMarker(props: IMarkerProps): any {
    const { map } = useLeaflet();

    const markerEvent = useCallback(
        (e: LeafletMouseEvent) => {
            e.originalEvent.preventDefault();
            props.updateCoordinates(e.latlng);
            e.originalEvent.stopPropagation();
        }, [props.updateCoordinates]
    );

    useEffect(() => {
            map?.doubleClickZoom.disable()
            map?.on('click', markerEvent)
        }, [map, markerEvent])

    return (
        <Marker position={props.coordinates} />
    )
}
export default AddMarker;