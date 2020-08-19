import React, {useContext, useEffect, useRef, useState} from 'react';
import {createStyles, makeStyles, Theme, withStyles} from '@material-ui/core/styles';
import {Paper, Tooltip, TextField, FormGroup, FormControlLabel, Checkbox} from '@material-ui/core';
import {Autocomplete} from '@material-ui/lab';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';

import cadtheme from '../App';
import {NotificationContext} from "../components/CadSnackbar";
import {apiCompetitions, apiRaces} from '../util/api';
import {toMMDDYYYY} from '../util/date';
import {CompetitionEntity as Competition, CompetitionsPage, Filter, Search} from '../sdk';
import {departements} from "../util/departements";
import {styles} from "../navigation/styles";

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
    const preferenceKey = 'competitionChooserPreferences'
    const preferenceStr = localStorage.getItem(preferenceKey);
    const preference = preferenceStr ? JSON.parse(preferenceStr): null;

    const [, setNotification] = useContext(NotificationContext);
    const [pastOrFutureSelect, setPastOrFutureSelect] = useState(preference? preference.pastOrFutureSelect : {
        past: true,
        future: true
    });
    const [competitionTypeSelect, setCompetitionTypeSelect] = useState(preference? preference.competitionTypeSelect : {
        route: true,
        vtt: true,
        cx: true
    })
    const [departementSelect, setdepartementSelect] = useState(preference ? preference.departementSelect : [])

    const initialDatatableParams = {
        loading: false,
        showFilters: false,
        filters: {},
        sortField: '',
        sortOrder: 0,
        first: 0,
        rows: 10,
        page: 0
    }
    const [datatableParams, setDatatableParams] = React.useState(initialDatatableParams)

    const initialDatatableData:CompetitionsPage = {
        data: [],
        totalCount: 0
    }
    const [datatableData, setDatatableData] = useState<CompetitionsPage>(initialDatatableData);
    const [raceData, setRaceData] = useState(new Map())
    const filterOptions = {filter: datatableParams.showFilters, filterMatchMode: 'contains'};
    const classes = useStyles(cadtheme);

    useEffect(() => {
        const pref = {
            pastOrFutureSelect, competitionTypeSelect, departementSelect
        }
        localStorage.setItem(preferenceKey, JSON.stringify(pref));

    }, [pastOrFutureSelect, competitionTypeSelect, departementSelect])

    useEffect(() => {
        refreshTable();
    }, [pastOrFutureSelect, competitionTypeSelect, departementSelect, datatableParams])

    const buildSearch = ():Search => {
        let orders = {};
        if (datatableParams.sortField !== '' && datatableParams.sortOrder !== 0){
            orders = {
                orderDirection: datatableParams.sortOrder === 1? 'ASC': 'DESC',
                orderBy: datatableParams.sortField
            }
        }

        const filters: Filter[] = [
            {
                name: 'pastOrFuture',
                value: pastOrFutureSelect
            },
            {
                name: 'competitionType',
                value: competitionTypeSelect
            },
            {
                name: 'depts',
                value: departementSelect
            }
        ]

        return {
            currentPage: datatableParams.page,
            pageSize: datatableParams.rows,
            ...orders,
            filters
        }
    }

    const refreshTable = async () => {
        try {
            const search = buildSearch();
            console.log(search);
            const result = await apiCompetitions.getCompetitionByFilterAndPage({search})
            console.log(result);
            setDatatableData(result)

            const raceMap = new Map();
            for (const compet of result.data) {
                const races = await apiRaces.getCompetitionRaces({id: compet.id})
                const nbEngagements = races.length;
                const nbClassements = races.filter(r=> r.comment!=null || r.rankingScratch!=null).length;
                raceMap.set(compet.id, {nbEngagements, nbClassements});
            }
            setRaceData(raceMap);
        }
        catch (ex) {
            console.log(ex)
            setNotification({
                message: `Impossible de récupérer la liste des épreuves`,
                open: true,
                type: 'error'
            });
        }
    }

    const selectAllIfAllUnchecked = (obj:object) => {
        let allUnchecked = true;
        for (const field of Object.keys(obj)) {
            if(obj[field] === true) {
                allUnchecked = false
                break;
            }
        }
        if (allUnchecked) {
            for (const field of Object.keys(obj)) {
                obj[field] = true;
            }
        }
    }

    const handlePastOrFutureSelectChange = (evt:React.ChangeEvent<HTMLInputElement>) => {
        const nextState = {...pastOrFutureSelect, [evt.target.name]: evt.target.checked}
        selectAllIfAllUnchecked(nextState);
        setPastOrFutureSelect(nextState)
    }

    const handleCompetitionTypeSelectChange = (evt:React.ChangeEvent<HTMLInputElement>) => {
        const nextState = {...competitionTypeSelect, [evt.target.name]: evt.target.checked}
        selectAllIfAllUnchecked(nextState);
        setCompetitionTypeSelect(nextState)
    }

    const handleDepartementSelectChange = (evt:any, value:object[]) => {
        setdepartementSelect(value)
    }

    const handleShowFilterClick = () => {
        setDatatableParams({
            ...datatableParams,
            showFilters: !datatableParams.showFilters
        })
    }

    const handlePageChange =  (evt: any) => {
        setDatatableParams({
            ...datatableParams,
            first: evt.first,
            page: evt.page
        })
    }

    const handleFilterChange = (evt: any) => {
        setDatatableParams({
            ...datatableParams,
            filters: evt.filters
        })
    }

    const handleSortChange = (evt:any) => {
        setDatatableParams({
            ...datatableParams,
            sortField: evt.sortField,
            sortOrder: evt.sortOrder
        })
    }

    const setSelectedCompetition = (selectedCompetition: Competition) => {
        goToPage(selectedCompetition.id,'engagement');
    };

    const goToPage = (competitionid: number, resultsPage?: string) => {
        props.history.push({
            pathname: '/competition/' + competitionid + '/' + (resultsPage? resultsPage:'engagement'),
            state: { title: (resultsPage? 'Résultats' : 'Engagements') }
        })
    };

    const displayDate = (row: Competition) => {
        return toMMDDYYYY(row.eventDate);
    };

    const displayEngagement = (competition: Competition) => {
        const nbEngages = raceData.has(competition.id) ? raceData.get(competition.id).nbEngagements : 0;
        return (
            nbEngages>0?<Tooltip key='2' title='Editer les engagements'>
                <a href='#' onClick={(event: any) => goToPage(competition.id, 'engagement')}
                   color="primary" style={{marginRight: '0px'}}>
                    {nbEngages} Engagé(s)</a></Tooltip>:<span>Aucun engagé</span>
        );
    }

    const displayClassement = (competition: Competition) => {
        const nbClasses = raceData.has(competition.id) ? raceData.get(competition.id).nbClassements : 0;
        return (
            nbClasses>0?<Tooltip key='2' title='Editer/Visualiser les classements'>
                <a href='#' onClick={(event: any) => goToPage(competition.id, 'results/edit')}
                   color="primary" style={{marginRight: '0px'}}>
                    {nbClasses} Classé(s)</a></Tooltip>:<span>Aucun classé</span>
        );
    }

    const displayCategories = (competition: Competition) => {
        return competition.categories.join(' ')
    }

    return (
            <Paper className={classes.root}>
                <div className={classes.titre}>Épreuves passées / futures</div>
                <FormGroup row>
                    <FormControlLabel
                        control={<Checkbox checked={pastOrFutureSelect.past} name="past" onChange={handlePastOrFutureSelectChange}/>}
                        label='Épreuves passées'
                    />
                    <FormControlLabel
                        control={<Checkbox checked={pastOrFutureSelect.future} name="future" onChange={handlePastOrFutureSelectChange}/>}
                        label='Épreuves futures'
                    />
                </FormGroup>
                <div className={classes.titre}>Type d'épreuve</div>
                <FormGroup row>
                    <FormControlLabel
                        control={<Checkbox checked={competitionTypeSelect.route} name="route" onChange={handleCompetitionTypeSelectChange}/>}
                        label='Route'
                    />
                    <FormControlLabel
                        control={<Checkbox checked={competitionTypeSelect.vtt} name="vtt" onChange={handleCompetitionTypeSelectChange}/>}
                        label='VTT'
                    />
                    <FormControlLabel
                        control={<Checkbox checked={competitionTypeSelect.cx} name="cx" onChange={handleCompetitionTypeSelectChange}/>}
                        label='CX'
                    />
                </FormGroup>
                <div className={classes.titre}>Départements</div>
                <Autocomplete
                    multiple
                    options={departements}
                    value={departementSelect}
                    onChange={handleDepartementSelectChange}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    renderInput={(params) => <TextField {...params} placeholder="Départements"/>}
                />

                <div className={classes.titre}>Veuillez sélectionner une épreuve :</div>

                <DataTable
                    {...datatableParams}
                    value={datatableData.data} totalRecords={datatableData.totalCount}
                    lazy={true} onPage={handlePageChange} onFilter={handleFilterChange} onSort={handleSortChange}
                    paginator={true} removableSort={true}
                    responsive={true}
                    emptyMessage="Aucune donnée ne correspond à la recherche"
                    selectionMode="single"
                    onSelectionChange={e => setSelectedCompetition(e.value)}
                >
                    {/*<Column
                        header={
                            <IconButton style={{height:20,padding:0}} onClick={() => handleShowFilterClick()}>
                                <SearchIcon height={20} style={{padding:0}} htmlColor={'#333333'}/>
                            </IconButton>
                        }
                        style= {{
                            width: 50,
                            textAlign: 'center',
                            paddingLeft: 5,
                            paddingRight: 5,
                            cursor: 'pointer'
                        }}
                    />*/}
                    <Column field='engagement' header='Engagements' body={displayEngagement}
                            style={{width: '8%',textAlign:'center'}}
                    />
                    <Column field='classement' header='Classements' body={displayClassement}
                            style={{width: '8%', textAlign: 'center'}}
                    />
                    <Column field='eventDate' header='Date' body={displayDate}
                            style={{width: '8%'}}
                    />
                    <Column field='name' header="Nom de l'épreuve"
                            style={{width: '16%'}}
                    />
                    <Column field='zipCode' header='Lieu'
                            style={{width: '8%'}}
                    />
                    <Column field='club.longName' header='Club'
                            style={{width: '16%'}}
                    />
                    <Column field='categories' header='Catégories' body={displayCategories}/>
                    <Column field='fede' header='Fédération'
                            style={{width: '8%'}}
                    />
                </DataTable>
            </Paper>)
            ;

};

export default withStyles(styles as any, {withTheme: true})(CompetitionChooser as any);
