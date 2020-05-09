import * as React from 'react';
import {ReactNode, SyntheticEvent, useState} from 'react';
import Snackbar from "@material-ui/core/Snackbar";
import ThumbUp from "@material-ui/icons/ThumbUp";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import {makeStyles} from "@material-ui/core/styles";
import {amber, green} from '@material-ui/core/colors';
import CloseIcon from '@material-ui/icons/Close';
import clsx from "clsx";
import {IconButton} from "@material-ui/core";

const variantIcon = {
    success: ThumbUp,
    error: ErrorIcon,
    info: InfoIcon,
    warning:InfoIcon,
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
    close: {
        padding: theme.spacing(0.5),
    },
}));

interface INotification {
    message: string;
    type: "success"|"error"|"info"|"warning";
    open: boolean;
}

const EMPTY_NOTIF: INotification = {message: '', type: 'info', open: false}

export const NotificationContext = React.createContext([]);

export const CadSnackBar = ({children} : {children: ReactNode}) => {
    const [snackPack, setSnackPack] = React.useState([]);
    const [notification, setNotification] = useState(EMPTY_NOTIF);
    const [open, setOpen] = React.useState(false);
    const classes = useStyles1({});
    const Icon = variantIcon[notification.type];

    const handleClose = (event?: SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification(EMPTY_NOTIF);
    };

    return <NotificationContext.Provider value={[notification, setNotification]}>
        <Snackbar open={notification.open}
                  anchorOrigin={{vertical: "top", horizontal: "right"}}
                  autoHideDuration={10000}
                  onClose={handleClose}>
            <SnackbarContent
                className={clsx(classes[notification.type], notification.type)}
                message={
                    <React.Fragment>
                        <Icon className={clsx(classes.icon, classes.iconVariant)}/> {notification.message}
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            className={classes.close}
                            onClick={handleClose}
                        >
                            <CloseIcon />
                        </IconButton>
                    </React.Fragment>
                }/>
        </Snackbar>
        {children}
    </NotificationContext.Provider>
}



