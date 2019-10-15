import React, {useEffect, useState} from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
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
        push(url: any): void;
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
        },
        nocomp: {
            padding: '20px',
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
        if (data.length === 0) {
            fetchCompetitions();
        }
    }, []);

    const isResultLink = (): boolean => {
        return props.history.location.state && props.history.location.state.goto === 'results';
    };

    const goToPage = (event: any, competitionid: number, resultsPage?: string) => {
        if (props.history.location.state && props.history.location.state.goto) {
            props.history.push({
                pathname: ('/competition/' + competitionid + '/' + (resultsPage ? resultsPage : props.history.location.state.goto)),
                state : props.history.location.state
            });
        }
    };

    if (data && data.length === 0) {
        return (<Paper>
            <div className={classes.nocomp}>Aucune épreuve renseignée en base de données correspond
                aux critères recherchés
            </div>
        </Paper>);
    } else {
        return (
            <Paper className={classes.root}>
                <div className={classes.titre}>Veuillez sélectionner une épreuve :</div>
                <Table className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{fontSize: 15}} variant="head">Nom
                                l'épreuve</TableCell>
                            <TableCell variant="head" align="right">Date</TableCell>
                            <TableCell variant="head" align="right">Lieu</TableCell>
                            <TableCell variant="head" align="right">Catégories</TableCell>
                            <TableCell variant="head" align="right">Fédération</TableCell>
                            {isResultLink() && <TableCell/>}
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        {data.map(row => (
                            <TableRow hover={true} key={row.name}
                                      onClick={(event: any) => goToPage(event, row.id, isResultLink() ? 'results/view' : null)}>
                                <TableCell component="th" scope="row">
                                    {row.name}
                                </TableCell>
                                <TableCell
                                    align="right">{toMMDDYYYY(row.eventDate)}</TableCell>
                                <TableCell align="right">{row.zipCode}</TableCell>
                                <TableCell align="right">{row.categories}</TableCell>
                                <TableCell align="right">{row.fede}</TableCell>

                                {isResultLink() && <TableCell align="right">
                                  <Button variant={'contained'}
                                          onClick={(event: any) => goToPage(event, row.id, 'results/create')}
                                          color="secondary"
                                          style={{marginRight: '10px'}}
                                  >
                                    Saisir Résultats
                                  </Button>
                                  <Button variant={'contained'}
                                          onClick={(event: any) => goToPage(event, row.id, 'results/view')}
                                          color="primary"
                                  >
                                    Visualiser Résultats
                                  </Button>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>)

            ;
    }
};


export default withRouter(CompetitionChooser);
