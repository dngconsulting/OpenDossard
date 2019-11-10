import React, {useEffect, useState} from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import cadtheme from '../App';
import {apiCompetitions} from '../util/api';
import {Competition} from '../sdk';
import {withRouter} from 'react-router-dom';
import {Radio, Tooltip} from '@material-ui/core';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {toMMDDYYYY} from '../util/date';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import VisibilityIcon from '@material-ui/icons/Visibility';
import moment from 'moment';

interface ICompetitionChooserProps {
    classes?: any;
    match: any;
    history: {
        push(url: any): void;
        location: any
    };
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            height: '100%',
            padding: '5px'

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
    const gotoPage = props.match.params.goto;
    const [data, setData] = useState<Competition[]>([]);
    const [filteredData, setFilteredData] = useState<Competition[]>([]);
    const [selectPastOrFuture, setSelectPastOrFuture] = useState('all');
    const [loading, setLoading] = useState(false);
    const classes = useStyles(cadtheme);
    const fetchCompetitions = async () => {
        const results = await apiCompetitions.getAllCompetitions();
        setData(results);
        setFilteredData(results);
    };
    useEffect(() => {
        const initData = async () => {
            if (data.length === 0) {
                try {
                    setLoading(true);
                    await fetchCompetitions();
                } finally {
                    setLoading(false);
                }

            }
        }
        initData();
    }, []);

    const isResultLink = (): boolean => {
        return gotoPage === 'results';
    };

    const goToPage = (competitionid: number, resultsPage?: string) => {
        props.history.push({
            pathname: '/competition/' + competitionid + '/' + (resultsPage? resultsPage:'engagements'),
            state: { title: (resultsPage? 'Résultats' : 'Engagements') }
        })
    };

    const displayDate = (row: Competition) => {
        return toMMDDYYYY(row.eventDate);
    };

    const resultsAction = (row: Competition) =>
        [<Tooltip key='1' title='Editer les résultats'><FormatListNumberedIcon
            onClick={(event: any) => goToPage(row.id, 'results/edit')}
            color="primary" style={{marginRight:'10px'}}/></Tooltip>,
            <Tooltip key='2' title='Visualiser les résultats'><VisibilityIcon
                onClick={(event: any) => goToPage(row.id, 'results/view')}
                color="primary" /></Tooltip>];

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectPastOrFuture(event.target.value);
        if (event.target.value === 'all') {
            setFilteredData(data) ;
        } else {
            setFilteredData(data.filter((comp: Competition) => event.target.value === 'past' ? moment(comp.eventDate).isBefore(moment()) : moment(comp.eventDate).isAfter(moment())))
        }
    };

    const setSelectedCompetition = (selectedCompetition: Competition) => {
        if (!isResultLink()) {
            goToPage(selectedCompetition.id);
        }
    };

        return (
            <Paper className={classes.root}>
                <Radio
                    checked={selectPastOrFuture === 'past'}
                    onChange={handleChange}
                    value="past"
                    name="radio-button-demo"
                />Epreuves passées
                <Radio
                    checked={selectPastOrFuture === 'future'}
                    onChange={handleChange}
                    value="future"
                    name="radio-button-demo"
                />Epreuves à venir
                <Radio
                    checked={selectPastOrFuture === 'all'}
                    onChange={handleChange}
                    value="all"
                    name="radio-button-demo"
                />Toutes les épreuves
                <div className={classes.titre}>Veuillez sélectionner une épreuve :</div>

                <DataTable responsive={true}
                           loading={loading}
                           autoLayout={true}
                           value={filteredData}
                           emptyMessage="Aucune donnée ne correspond à la recherche"
                           selectionMode="single"
                           onSelectionChange={e => setSelectedCompetition(e.value)}
                >
                    {isResultLink() && <Column header='Résultats' body={resultsAction}
                                               style={{minWidth: '5%', textAlign: 'center'}}/>}
                    <Column field='eventDate' header='Date' body={displayDate}
                            style={{minWidth: '2%'}}/>
                    <Column field='name' header="Nom de l'épreuve"
                            style={{minWidth: '2%'}}/>
                    <Column field='zipCode' header='Lieu'
                            style={{minWidth: '2%'}}/>
                    <Column field='club.longName' header='Club'
                            style={{minWidth: '5%'}}/>
                    <Column field='categories' header='Catégories'/>
                    <Column field='fede' header='Fédération'
                            style={{minWidth: '5%'}}/>
                </DataTable>
            </Paper>)
            ;

};


export default withRouter(CompetitionChooser);
