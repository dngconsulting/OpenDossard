import * as React from 'react';
import {SyntheticEvent} from 'react';
import Snackbar from "@material-ui/core/Snackbar";
import ThumbUp from "@material-ui/icons/ThumbUp";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import {makeStyles} from "@material-ui/core/styles";
import {amber, green} from '@material-ui/core/colors';
import clsx from "clsx";
import {setNotification} from "../actions/App.Actions";
import {connect} from "react-redux";
import {ReduxState} from "../state/ReduxState";
import {Dispatch} from "redux";

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

export interface INotification {
    message: string;
    type: "success"|"error"|"info";
    open: boolean;
}

const EMPTY_NOTIF: INotification = {message: '', type: 'info', open: false}

interface IProps {
    notification?: INotification,
    onClose?: () => void
}

const CadSnackBar = ({notification, onClose} : IProps) => {

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

const mapStateToProps = (state: ReduxState): IProps => {
    return {
        notification: state.app.notification || EMPTY_NOTIF
    }
}

const mapDispatchToProps = (dispatch: Dispatch): IProps => {
    return {
        onClose: () => {
            dispatch(setNotification(EMPTY_NOTIF))
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CadSnackBar)




