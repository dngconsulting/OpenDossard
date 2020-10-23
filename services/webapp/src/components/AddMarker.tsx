import { useCallback, useEffect, useRef, useState } from 'react';
import { useLeaflet, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import React from 'react';

interface MarkerProps {
    coord: any;
    position: any;

}
const AddMarker = (props: MarkerProps): any => {


    const { map } = useLeaflet();
    const [position, setPosition]: any = useState(props.position);
   // const getPosition = (value: any) => { props.coord([value.lat, value.lng]); }
    const markerEvent = useCallback(
        (e: LeafletMouseEvent) => {
            e.originalEvent.preventDefault();
            setPosition(e.latlng);
            props.coord(e.latlng)
            //getPosition(e.latlng)
            e.originalEvent.stopPropagation();
        }, [props.position]);
      
    useEffect(
        () => {

            map?.doubleClickZoom.disable()
            map?.on('click', markerEvent)
        }, [map, markerEvent]
    )
    return (
        <div>
            <Marker position={position}></Marker>
        </div>
    )
}

export default AddMarker;