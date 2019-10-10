import {Dialog, DialogActions, DialogContent, DialogTitle} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import React, {useEffect, useState} from "react";
import TextField from "@material-ui/core/TextField";
import {Competition, RaceRow} from "../../sdk";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import {Add, Delete, ThreeSixty} from "@material-ui/icons";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Badge from "@material-ui/core/Badge/Badge";

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
    categories: {
        display: 'flex',
        flexDirection: 'column',
        margin: '20px 0 0 0',
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
    }
}))

const compute = (rows: RaceRow[], categories: string[]) : number => {
    return rows.filter( row => categories.indexOf(''+row.catev) >= 0 ).length
}

export const Reorganizer = ({competition, rows} : {competition: Competition, rows: RaceRow[]}) => {

    const [races, setRaces] = useState([]);
    const [open, setOpen] = useState(false);

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
                            <Box key={i} justifySelf="center" alignSelf="center">
                                <Badge badgeContent={compute(rows, raceCode.split('/'))}
                                       max={999}
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
                            </Box>
                        )
                    )
                }
                <Categories rows={rows}/>
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

