import React, {useContext, useRef, useState} from 'react';

import {Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from '@material-ui/core';
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
import {ContextMenu} from 'primereact/contextmenu';
import {Reorganizer} from "./engagement/ReorganizeRaces";
import Box from "@material-ui/core/Box";
import {RaceRow} from "../sdk";
import {Delete} from "@material-ui/icons";


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
                    <Button onClick={props.handleClose} color="primary">
                        Annuler
                    </Button>
                    <Button onClick={props.handleOk} color="primary" autoFocus={true}>
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

const FILTERABLE = {filter: true, sortable: true, filterMatchMode: 'contains'}
const SHORT = {style: {width: 120, textAlign: 'center'}}

const EngagementPage = ({match}: { match: any }) => {
    const competitionId = match.params.id;
    const dg = useRef(null);
    const [, setNotification] = useContext(NotificationContext);
    const contextMenu = useRef(null);
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
    return <CompetitionLayout competitionId={competitionId}>
        {
            ({competition,currentRace, rows, fetchRows, fetchCompetition}) => {

                const deleteAction = (row: RaceRow) => <Delete onClick={() => {
                    selectRow(row)
                    openDialog(true)
                }}/>

                const columns: ColumnProps[] = [
                    {field: 'riderNumber', header: 'Dossard', ...FILTERABLE, ...SHORT},
                    {field: 'name', header: 'Coureur', ...FILTERABLE},
                    {field: 'gender', header: 'H/F', ...FILTERABLE, ...SHORT},
                    {field: 'club', header: 'Club', ...FILTERABLE},
                    {field: 'catev', header: 'Catégorie', ...FILTERABLE, ...SHORT},
                    {
                        style: {width: 40, textAlign: 'center', paddingLeft: 0, paddingRight: 0, cursor: 'pointer'},
                        body: deleteAction
                    },
                ]

                return (
                    <Box position="relative">
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
                        <ContextMenu style={{width: '220px'}} model={[
                            {
                                label: 'Détail du coureur',
                                icon: 'pi pi-fw pi-search',
                                command: (event) => {
                                    setNotification({
                                        message: `TODO Aller sur le détail du coureur `,
                                        type: 'info',
                                        open: true
                                    });
                                }
                            },
                            {
                                label: 'Désengager ce coureur',
                                icon: 'pi pi-fw pi-times',
                                command: async (event) => {
                                    openDialog(true);
                                }
                            }
                        ]} ref={contextMenu}/>
                        <DataTable ref={dg} value={filterByRace(rows, currentRace)}
                                   emptyMessage="Aucun enregistrement dans la table">
                            {columns.map((column, i) => <Column key={i} {...column}/>)}
                        </DataTable>
                    </Box>
                );
            }
        }
    </CompetitionLayout>;

};

export default EngagementPage;
