import React, {Fragment, useContext, useRef, useState} from 'react';

import {
    createStyles,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Theme
} from '@material-ui/core';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {apiRaces} from '../util/api';
import {RaceCreate} from '../sdk';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import makeStyles from '@material-ui/core/styles/makeStyles';
import AutocompleteInput from '../components/AutocompleteInput';
import Paper from '@material-ui/core/Paper';
import {CompetitionLayout} from './CompetitionLayout';
import {NotificationContext} from '../components/CadSnackbar';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {ContextMenu} from 'primereact/contextmenu';

const create = async (newRace: RaceCreate) => {
    await apiRaces.create(newRace);
};
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
                        <ConfirmDialog name={selectedRow?selectedRow.name:null} open={open} handleClose={closeDialog}
                                       handleOk={() => handleOk(fetchRows)}/>
                        <CreationForm competitionId={competitionId}
                                      race={currentRace}
                                      onSuccess={(form) => {
                                          fetchRows();
                                          setNotification({
                                              message: `Le coureur ${form.licence.name} ${form.licence.firstName} a bien été enregistré sous le dossard ${form.riderNumber}`,
                                              open: true,
                                              type: 'success'
                                          });
                                      }}
                                      onError={(message) => {
                                          setNotification({
                                              message,
                                              open: true,
                                              type: 'error'
                                          });
                                      }}
                        />
                    </Grid>
                    <ContextMenu model={[
                        {
                            label: 'View', icon: 'pi pi-fw pi-search', command: (event) => {
                                setNotification({
                                    message: `TODO Aller sur le détail du coureur `,
                                    type: 'info',
                                    open: true
                                });
                            }
                        },
                        {
                            label: 'Delete', icon: 'pi pi-fw pi-times', command: async (event) => {
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

const formStyles = makeStyles((theme: Theme) =>
    createStyles({
        field: {
            marginLeft: 10,
            marginRight: 10
        },
    }),
);

interface IForm {
    licence: null | {
        id: number,
        name: string,
        firstName: string
    },
    riderNumber: string
}

const CreationForm = (
    {competitionId, race, onSuccess, onError}:
        {
            competitionId: number,
            race: string,
            onSuccess: (race: IForm) => void,
            onError: (message: string) => void
        }
) => {

    const [form, setValues] = useState<IForm>({licence: null, riderNumber: ''});

    const submit = async () => {
        try {
            const dto: RaceCreate = {
                licenceId: form.licence && form.licence.id,
                raceCode: race,
                riderNumber: parseInt(form.riderNumber),
                competitionId
            };
            await create(dto);
            onSuccess(form);
            setValues({licence: null, riderNumber: ''});
        } catch (e) {
            if (e.json) {
                const {message} = (await e.json());
                onError(message);
            } else {
                console.log(e);
                onError('Une erreur est survenue');
            }
        }
    };

    const classes = formStyles({});

    return <Paper style={{paddingLeft: 20, paddingBottom: 20, width: '100%'}} square={true}>
        <Grid container={true} spacing={3} alignItems={'baseline'}>
            <Typography variant="h5" gutterBottom={true} style={{marginRight: 20}}>
                Nouveau Coureur :
            </Typography>
            <AutocompleteInput style={{width: '450px', zIndex: 20}} selection={form.licence}
                               onChangeSelection={(e: any) => setValues({...form, licence: e})}/>
            <TextField
                label="Numéro de dossard"
                value={form.riderNumber}
                className={classes.field}
                onChange={e => setValues({...form, riderNumber: e.target.value})}
                margin="normal"
                inputProps={{
                    onKeyPress: e => e.key === 'Enter' && submit(),
                    style: {textAlign: 'center'}
                }}
            />
            <Button
                variant="contained"
                color="primary"
                onClick={submit}
            >
                Ajouter
            </Button>
        </Grid>
    </Paper>;
};


export default EngagementPage;
