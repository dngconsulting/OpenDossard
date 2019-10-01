import * as React from 'react';
import {SyntheticEvent} from "react";
import Snackbar from "@material-ui/core/Snackbar";
import ThumbUp from "@material-ui/icons/ThumbUp";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import {makeStyles} from "@material-ui/core/styles";
import { amber, green } from '@material-ui/core/colors';
import clsx from "clsx";

const variantIcon = {
    success: ThumbUp,
    error: ErrorIcon,
    info: InfoIcon,
};

const useStyles1 = makeStyles((theme) => ({
    success: {
        backgroundColor: green[600],
    },
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    info: {
        backgroundColor: theme.palette.primary.main,
    },
    warning: {
        backgroundColor: amber[700],
    },
    icon: {
        fontSize: 20,
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing(1),
    },
    message: {
        display: 'flex',
        alignItems: 'center',
    },
}));

interface INotification {
    message: string;
    type: "success"|"error"|"info";
    open: boolean;
}

export const EMPTY_NOTIF: INotification = {message: '', type: 'info', open: false}

export const CadSnackBar = ({notification, onClose}: {notification : INotification, onClose: () => void}) => {

    const classes = useStyles1({});
    const Icon = variantIcon[notification.type];

    const handleClose = (event?: SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        onClose();
    };

    return <Snackbar open={notification.open} anchorOrigin={{vertical: "top", horizontal: "right"}}
    autoHideDuration={6000} onClose={handleClose}>
    <SnackbarContent
        className={clsx(classes[notification.type], notification.type)}
        message={
        <span id="client-snackbar" className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)} />
            {notification.message}
        </span>
}/>
    </Snackbar>
}



