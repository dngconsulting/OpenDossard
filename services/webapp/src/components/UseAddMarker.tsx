import { useCallback, useEffect, useRef, useState } from 'react';
import { useLeaflet, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import React from 'react';
import Button from '@material-ui/core/Button';

const UseAddMarker = (props: any): any => {

    // The hook 'useLeaflet' is provided by the react-leaflet library. 

    const { map } = useLeaflet();

    const submitMarker = useRef(null);

    const [position, setPosition]: any = useState([0, 0])

    const markerEvent = useCallback(
        (e: LeafletMouseEvent) => {
            // if you want to use any event, 
            // be sure that the default is disabled.
            e.originalEvent.preventDefault();
            setPosition(e.latlng);
            e.originalEvent.stopPropagation();
        }, [setPosition]);


    // activate the EventHandler with the useEffect handler
    useEffect(
        () => {
            map?.doubleClickZoom.disable()
            map?.on('dblclick', markerEvent);
        }, [map, markerEvent]
    )
    console.log(position)
    return (
        <div>
            <Marker position={position}></Marker>
            <Button id="buttonLeaflet" ref={submitMarker} value={[position?.lat, position?.lng]} onClick={() => { props.coord(submitMarker.current.value) }} variant={'contained'} color={'primary'}>ENREGISTRER</Button>
        </div>
    )
}

export default UseAddMarker;