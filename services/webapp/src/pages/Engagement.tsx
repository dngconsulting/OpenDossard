import React, {Fragment, useContext, useRef, useState} from 'react';

import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
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
import {Column} from 'primereact/column';
import {CreationForm} from './engagement/EngagementCreation';
import {ContextMenu} from 'primereact/contextmenu';


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
                    <Button onClick={props.handleOk} color="primary" autoFocus>
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

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
            ({currentRace, rows, fetchRows}) => (
                <Fragment>
                    <Grid container={true}>
                        <ConfirmDialog name={selectedRow ? selectedRow.name : null} open={open}
                                       handleClose={closeDialog}
                                       handleOk={() => handleOk(fetchRows)}/>
                        <CreationForm competitionId={competitionId}
                                      race={currentRace}
                                      onSuccess={fetchRows}
                        />
                    </Grid>
                    <ContextMenu style={{width:'250px'}} model={[
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
                    <DataTable ref={dg} value={rows} selectionMode="single"
                               emptyMessage="Aucun enregistrement dans la table"
                               onContextMenu={e => contextMenu.current.show(e.originalEvent)}
                               contextMenuSelection={selectedRow}
                               onContextMenuSelectionChange={e => selectRow(e.value)}
                    >
                        <Column field="riderNumber" header="Dossard" filter={true} sortable={true}/>
                        <Column field="name" header="Coureur" filter={true} sortable={true}/>
                        <Column field="gender" header="H/F" filter={true} sortable={true}/>
                        <Column field="club" header="Club" filter={true} sortable={true}/>
                        <Column field="catev" header="Catégorie" filter={true} sortable={true}/>
                    </DataTable>
                </Fragment>
            )
        }
    </CompetitionLayout>;

};

export default EngagementPage;
