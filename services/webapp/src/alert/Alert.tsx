// eslint-disable-next-line
import * as React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import {Alert} from '../state/Alert';

interface IAlertProps {
    data?: Alert;
    handleClose: () => void;
    children?: any;
}
export class AlertDialog extends React.Component<IAlertProps, {}> {

    public handleClose = () => {
        this.props.handleClose();
    };

    public render() {
        return (
// eslint-disable-next-line
            <Dialog
                open={this.props.data !== null}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{this.props.data.title}</DialogTitle>
                <DialogContent>
                    { this.props.data.message && <DialogContentText id="alert-dialog-description">
                        { this.props.data.message }
                    </DialogContentText>}
                    {this.props.children}
                </DialogContent>
                <DialogActions>
                    {this.props.data.buttons && this.props.data.buttons.map((item,index) =>
                        <Button key={index} onClick={item.handler} variant={"contained"} color={index===0?"primary":"secondary"}>
                            {item.label}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        );
    }
}
