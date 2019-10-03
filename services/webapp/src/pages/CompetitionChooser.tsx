import React, {useEffect, useState} from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import cadtheme from '../App';
import {apiCompetitions} from '../util/api';
import {Competition} from '../sdk';
import {toMMDDYYYY} from '../util/date';
import {withRouter} from 'react-router-dom';

interface ICompetitionChooserProps {
    classes?: any;
    history: {
        push(url: string): void;
        location: any
    };
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            overflowX: 'auto',
        },
        table: {
            minWidth: 650,
        },
        titre: {
            padding: '10px',
            fontWeight: 'bold'
        }
    }),
);
const CompetitionChooser = (props: ICompetitionChooserProps) => {
    const [data, setData] = useState<Competition[]>([]);
    const classes = useStyles(cadtheme);
    const fetchCompetitions = async () => {
        setData(await apiCompetitions.getAllCompetitions());
    };
    useEffect(() => {
        fetchCompetitions();
    }, []);

    const handleClick = (event: any, competitionid: number) => {
        console.log('History ' + JSON.stringify(props.history));
        if (props.history.location.state && props.history.location.state.goto) {
            props.history.push('/competition/' + competitionid + '/' + props.history.location.state.goto);
        }
    };
    return (
        <Paper className={classes.root}>
            <div className={classes.titre}>Veuillez sélectionner une épreuve :</div>
            <Table className={classes.table}>
                <TableHead>
                    <TableRow>
                        <TableCell>Nom l'épreuve</TableCell>
                        <TableCell align="right">Date</TableCell>
                        <TableCell align="right">Lieu</TableCell>
                        <TableCell align="right">Catégories</TableCell>
                        <TableCell align="right">Fédération</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map(row => (
                        <TableRow hover={true} key={row.name}
                                  onClick={(event: any) => handleClick(event, row.id)}>
                            <TableCell component="th" scope="row">
                                {row.name}
                            </TableCell>
                            <TableCell
                                align="right">{toMMDDYYYY(row.eventDate)}</TableCell>
                            <TableCell align="right">{row.zipCode}</TableCell>
                            <TableCell align="right">{row.categories}</TableCell>
                            <TableCell align="right">{row.fede}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    )
        ;
};


export default withRouter(CompetitionChooser);
