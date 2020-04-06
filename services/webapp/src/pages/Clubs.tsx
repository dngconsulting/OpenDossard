// eslint-disable-next-line
import * as React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {Input, TextareaAutosize} from "@material-ui/core";

interface ClubsProps {
    handleClose: () => void;
    children?: any;
    open:boolean;
}
export class Clubs extends React.Component<ClubsProps, {}> {
    public handleClose = () => {
        this.props.handleClose();
    };

    public render() {
        return (
// eslint-disable-next-line
            <Dialog
                open={this.props.open}
                onClose={this.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Saisie club</DialogTitle>
                <DialogContent>
                    <div>Nom du club : </div><Input/>
                </DialogContent>
                <DialogActions>
                        <Button onClick={()=>{}} variant={"contained"} color={"primary"}>
                            Valider
                        </Button>
                </DialogActions>
            </Dialog>
        );
    }
}
