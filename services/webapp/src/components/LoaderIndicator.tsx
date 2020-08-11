import {CircularProgress} from "@material-ui/core";
import * as React from "react";

export const LoaderIndicator = (props:{visible?:boolean}) =>
    <div style={{
        visibility:props.visible?'visible':'hidden',
        position: 'fixed',
        display: 'block',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        cursor: 'pointer'
    }}>
        <div style={{position: 'absolute', top: '40%', left: '40%'}}>
            <CircularProgress color="primary"/>
        </div>
    </div>
