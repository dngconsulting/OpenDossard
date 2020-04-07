import {default as React, useContext, useEffect, useState} from "react";
import {NotificationContext} from "../../components/CadSnackbar";
import {Grid, TextareaAutosize, withStyles} from "@material-ui/core";
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import {CompetitionEntity} from "../../sdk/models";
import {apiCompetitions} from "../../util/api";

interface InfoGenProps {
    classes: any;
    history: any;
    match: any;
    open: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
        },
        formControl: {
            minWidth: 167,
        },
        button: {
            margin: theme.spacing(1),
        }
    }),
);
const InfoGen = (props: InfoGenProps) => {
    const [, setNotification] = useContext(NotificationContext);
    const [openDialog,setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [currentCompetition,setCurrentCompetition] = useState<CompetitionEntity>(null);

    useEffect(() => {
        setOpenDialog(props.open)
        const fetchComp = async () => {
            setCurrentCompetition(await apiCompetitions.getCompetition({id: '5'}))
        }
        fetchComp();
        }, []);

    const classes = useStyles();
    return (

        <Dialog
            open={openDialog}
            onClose={() => { setOpenDialog(false)
            }}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle style={{backgroundColor:'#2d4889',color:'white'}} id="alert-dialog-title">Informations épreuve</DialogTitle>
            <DialogContent style={{width: 400, height: 450}}>
                <div className={classes.root}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl className={classes.formControl}>
                                <TextField
                                    required={true}
                                    value={currentCompetition?.speaker}
                                    id="speaker"
                                    label="Speaker"
                                    margin="normal"
                                />
                            </FormControl>
                            <FormControl className={classes.formControl}>
                                <div style={{paddingTop:20}}>Commissaires :</div>
                                <TextareaAutosize
                                    value={currentCompetition?.commissaires}
                                    style={{width:355}}
                                    rowsMin={5}
                                    placeholder="Commissaire 1  Commissaire 2  Commissaire 3"
                                />
                            </FormControl>
                            <FormControl className={classes.formControl}>
                                <TextField
                                    value={currentCompetition?.aboyeur}
                                    required={true}
                                    id="aboyeur"
                                    label="Aboyeur CX"
                                    margin="normal"
                                />
                            </FormControl>
                            <FormControl className={classes.formControl}>
                                <div style={{paddingTop:20}}>Notes diverses :</div>
                                <TextareaAutosize
                                    style={{width:355}}
                                    value={currentCompetition?.feedback}
                                    rowsMin={5}
                                    placeholder="Incidents de courses/Notes"
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                }} variant={"contained"} color={"secondary"}>
                    Annuler
                </Button>
                <Button onClick={() => {
                }} variant={"contained"} color={"primary"}>
                    Valider
                </Button>
            </DialogActions>
        </Dialog>
    )
}

const styles = (theme: Theme) => ({});
export default withStyles(styles as any)(InfoGen as any) as any;
