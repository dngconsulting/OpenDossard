import React, {useContext, useRef, useState} from 'react';

import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    makeStyles
} from '@material-ui/core';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {apiRaces} from '../util/api';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import {CompetitionLayout} from './CompetitionLayout';
import {NotificationContext} from '../components/CadSnackbar';
import {DataTable} from 'primereact/datatable';
import {Column, ColumnProps} from 'primereact/column';
import {CreationForm} from './engagement/EngagementCreation';
import {Reorganizer} from './engagement/ReorganizeRaces';
import Box from '@material-ui/core/Box';
import {RaceRow} from '../sdk';
import {ArrowUpward, Delete} from '@material-ui/icons';

const style = makeStyles( theme => ({
    surclassed: {
        zoom: '79%',
            display: 'inline-block',
            position: 'absolute',
            marginLeft: 10
    }
}))

const ConfirmDialog = (props: any) => {
    return (
        <div>
            <Dialog
                open={props.open}
                onClose={props.handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{'Désengager un coureur'}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Êtes-vous sûr de vouloir désengager le coureur {props.name} ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.handleClose} variant={'contained'} color="primary">
                        Annuler
                    </Button>
                    <Button onClick={props.handleOk} variant={'contained'} color="primary" autoFocus={true}>
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

const filterByRace = (rows : RaceRow[] , race : string) : RaceRow[] => {
    return rows.filter((coureur) => coureur.raceCode === race)
}

const surclassed = ({catev, raceCode}: RaceRow) => {
    return raceCode.split('/').indexOf(catev) >= 0 ? false : true
}

const FILTERABLE = {filter: true, sortable: true, filterMatchMode: 'contains'}
const SHORT = {style: {width:70, textAlign: 'center', padding : 5}, bodyClassName:'nopadding'}
const EngagementPage = (props:any) => {
    const competitionId = props.match.params.id;
    const dg = useRef(null);
    const [, setNotification] = useContext(NotificationContext);
    const [selectedRow, selectRow] = useState();
    const [open, openDialog] = React.useState(false);
    const closeDialog = () => {
        openDialog(false);
    };


    const handleOk = async (fetchRows: any) => {
        await apiRaces._delete(selectedRow.id);
        fetchRows();
        setNotification({
            message: `Le coureur ${selectedRow.id} a été supprimé de la compétition`,
            type: 'info',
            open: true
        });
        closeDialog();
    };
    const classes = style({});
    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition,currentRace, rows, fetchRows, fetchCompetition}) => {

                const deleteAction = (row: RaceRow) => <Delete fontSize={'small'} onClick={() => {
                    selectRow(row)
                    openDialog(true)
                }}/>

                const columns: ColumnProps[] = [
                    {
                        style: {width: 40, textAlign: 'center', paddingLeft: 5, paddingRight: 5, cursor: 'pointer'},
                        bodyClassName:'nopadding',
                        body: deleteAction
                    },
                    {field: 'riderNumber', header: 'Dossard', ...FILTERABLE, ...SHORT},
                    {field: 'name', header: 'Coureur', ...FILTERABLE, bodyClassName:'nopadding'},
                    {field: 'club', header: 'Club', ...FILTERABLE, bodyClassName:'nopadding'},
                    {
                        field: 'catev', header: 'Caté. V.', ...FILTERABLE, ...SHORT,
                        body: (row: RaceRow) => <span>
                            {row.catev}
                            {surclassed(row) && <span title="surclassé" className={classes.surclassed}><ArrowUpward /></span>}
                        </span>
                    },
                    {field: 'gender', header: 'H/F', ...FILTERABLE, ...SHORT},
                    {field: 'catea', header: 'Caté A.', ...FILTERABLE, ...SHORT},
                    {field: 'birthYear', header: 'Année', ...FILTERABLE, ...SHORT},
                    {field: 'fede', header: 'Fédé.', ...FILTERABLE, ...SHORT},
                ]

                return (
                    <Box position="relative" padding={0}>
                        <Box top={-38} right={10} position="absolute">
                            <Reorganizer competition={competition} rows={rows} onSuccess={() => {
                                fetchRows()
                                fetchCompetition()
                            }}/>
                        </Box>
                        <Grid container={true}>
                            <ConfirmDialog name={selectedRow ? selectedRow.name : null} open={open}
                                           handleClose={closeDialog}
                                           handleOk={() => handleOk(fetchRows)}/>
                            <CreationForm competition={competition}
                                          race={currentRace}
                                          onSuccess={fetchRows}
                            />
                        </Grid>

                        <DataTable ref={dg} value={filterByRace(rows, currentRace)}
                                   emptyMessage="Aucun coureur encore engagé sur cette épreuve ou aucun coureur ne correspond à votre filtre de recherche" responsive={true} >
                            {columns.map((column, i) => <Column key={i} {...column}/>)}

                        </DataTable>
                    </Box>
                );
            }
        }

    </CompetitionLayout>;

};

export default EngagementPage;
