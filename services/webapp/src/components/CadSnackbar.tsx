import * as React from 'react';
import {SyntheticEvent} from "react";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";

interface INotification {
    message: string;
    type: "info"|"error";
    open: boolean;
}

export const EMPTY_NOTIF: INotification = {message: '', type: 'info', open: false}

export const CadSnackBar = ({notification, onClose}: {notification : INotification, onClose: () => void}) => {

    const handleClose = (event?: SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        onClose();
    };

    return <Snackbar open={notification.open} anchorOrigin={{vertical: "top", horizontal: "right"}}
    autoHideDuration={6000} onClose={handleClose}>
    <SnackbarContent message={
        <span id="client-snackbar">
        {notification.message}
        </span>
}/>
    </Snackbar>
}



