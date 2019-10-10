import {Dialog, DialogActions, DialogContent, DialogTitle} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import React, {useContext, useEffect, useState} from "react";
import TextField from "@material-ui/core/TextField";
import {Competition, RaceRow} from "../../sdk";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import {Add, Delete, ThreeSixty} from "@material-ui/icons";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Badge from "@material-ui/core/Badge/Badge";
import {apiCompetitions} from "../../util/api";
import {NotificationContext} from "../../components/CadSnackbar";

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
    },
    races: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 200,
        justifyContent: 'center',
        paddingLeft: 10
    },
    categories: {
        display: 'flex',
        alignSelf: 'center',
        flex: 1,
        flexDirection: 'column',
        color: theme.palette.grey[600],
        '& table': {
            borderCollapse: 'collapse',
            justifySelf: 'center',
            alignSelf: 'center'
        },
        '& th': {
            textAlign: 'left',
            paddingRight: 10
        },
        '& td': {
            border: '1px solid grey',
            textAlign: 'center',
            padding: '0 10px 0 10px'
        },
        '& span': {
            justifySelf: 'center',
            alignSelf: 'center',
        }
    },
    badges: {
        '& span': {
            top: 14,
            right: 22
        }
    }
}))

const compute = (rows: RaceRow[], categories: string[]) : number => {
    return rows.filter( row => categories.indexOf(''+row.catev) >= 0 ).length
}

export const Reorganizer = ({competition, rows, onSuccess} : {competition: Competition, rows: RaceRow[], onSuccess: () => void}) => {

    const [races, setRaces] = useState([]);
    const [open, setOpen] = useState(false);
    const [, setNotification] = useContext(NotificationContext);

    const classes = styles({});

    useEffect( () => {
        setRaces(competition ? competition.races  : ['1/2'])
    }, [open])

    const save = async () => {
        try {
            await apiCompetitions.reorganize({
                competitionId: competition.id,
                races
            })
            setNotification({
                message: `La compétition a été réorganisée avec succès`,
                type: 'info',
                open: true
            });
            setOpen(false)
            onSuccess()
        } catch(e) {
            setNotification({
                message: `Une erreur s'est produite`,
                type: 'error',
                open: true
            });
        }
    }


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
                <Box display="flex">
                    <Races races={races} setRaces={setRaces} rows={rows}/>
                    <Categories rows={rows}/>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)} color="primary">
                    Annuler
                </Button>
                <Button onClick={() => save()} color="primary">
                    Réorganiser
                </Button>
            </DialogActions>
        </Dialog>
    </div>
}

const Races = ({races, setRaces, rows} : {races: string[], setRaces: (races:string[]) => void, rows: RaceRow[]}) => {

    const classes = styles({});

    return <Box className={classes.races}>{
        races.map((raceCode, i) => (
            <Box key={i} justifySelf="center" alignSelf="center">
                <Badge badgeContent={compute(rows, raceCode.split('/'))}
                       max={999}
                       className={classes.badges}
                       color="secondary">
                    <TextField data-cp="field" value={raceCode} onChange={e => {
                        const newOne = [...races]
                        newOne[i] = e.target.value
                        setRaces(newOne)
                    }}/>
                </Badge>
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
            </Box>))
    }</Box>
}

const Categories = ({rows} : {rows: RaceRow[]}) => {

    const classes = styles({});

    const computed = rows.reduce( (acc: {[catev:string]: number}, row) => {
        return {
            ...acc,
            [row.catev]: acc[row.catev] ? acc[row.catev] + 1 : 1
        }
    }, {});
    const byCatev = Object.keys(computed).map( catev => ({
        catev,
        participants: computed[catev]
    }) );

    return <Box className={classes.categories}>
        <table>
            <tr>
                <th>Catégories : </th>
                { byCatev.map( stat => <td key={stat.catev}>{stat.catev}</td>) }
            </tr>
            <tr>
                <th>Inscrits : </th>
                { byCatev.map( stat => <td key={stat.catev}>{stat.participants}</td>) }
            </tr>
        </table>
        <span>Répartition des coureurs par catégories</span>
    </Box>
}

