import {Dialog, DialogActions, DialogContent, DialogTitle} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import React, {useEffect, useState} from "react";
import TextField from "@material-ui/core/TextField";
import {Competition} from "../../sdk";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import {Add, Delete, ThreeSixty} from "@material-ui/icons";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";

const styles = makeStyles(theme => ({
    button: {
        textTransform: 'none',
        textDecoration: 'underline'
    },
    dialogContent: {
        display: 'flex',
        flexDirection: 'column',
        '& [data-cp=field] input': {
            textAlign: 'center'
        },
        '& [data-cp=icon]': {
            zoom: '57%',
            marginTop: 10,
            marginLeft: 10,
        }
    }
}))

export const Reorganizer = ({competition} : { competition: Competition}) => {

    const [races, setRaces] = useState([]);
    const [open, setOpen] = useState(true);

    const classes = styles({});

    useEffect( () => {
        setRaces(competition ? competition.races  : ['1/2'])
    }, [open])

    return <div>
        <Button className={classes.button}
                onClick={() => setOpen(true)}><ThreeSixty /> Réorganiser les courses</Button>
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">Réorganiser les courses</DialogTitle>
            <DialogContent className={classes.dialogContent}>
                <Typography variant="body2">
                    Ici, vous pouvez revoir les catégories de chaque courses, ajouter ou supprimer des courses...
                </Typography>
                {
                    races.map((raceCode, i) => (
                            <Box justifySelf="center" alignSelf="center">
                                <TextField key={i} data-cp="field" value={raceCode} onChange={e => {
                                const newOne = [...races]
                                newOne[i] = e.target.value
                                setRaces(newOne)
                                }}/>
                                {   races.length > 1 &&
                                    <Fab color="primary" data-cp="icon" onClick={() => setRaces(races.filter((item,j) => i !== j))}>
                                        <Delete />
                                    </Fab>
                                }
                                <Fab style={{visibility: i === (races.length-1) ? 'visible' : 'hidden'}}
                                     color="primary"
                                     data-cp="icon"
                                     onClick={() => setRaces([...races, ''])}>
                                  <Add />
                                </Fab>
                            </Box>
                        )
                    )
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)} color="primary">
                    Annuler
                </Button>
                <Button onClick={() => setOpen(false)} color="primary">
                    Réorganiser
                </Button>
            </DialogActions>
        </Dialog>
    </div>
}

