import {default as React, useContext, useState} from 'react';
import {Competition, Licence, RaceCreate} from '../../sdk';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import AutocompleteInput from '../../components/AutocompleteInput';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {createStyles, Theme} from '@material-ui/core';
import {apiRaces} from '../../util/api';
import {NotificationContext} from '../../components/CadSnackbar';
import {filterLicences} from '../common/filters';

const create = async (newRace: RaceCreate) => {
    await apiRaces.create(newRace);
};

const formStyles = makeStyles((theme: Theme) =>
    createStyles({
        field: {
            marginLeft: 10,
            marginRight: 10
        },
        form: {
            backgroundColor: theme.palette.common.white,
            paddingBottom: 9,
            paddingLeft: 10
        }
    }),
);

interface IForm {
    licence: null | {
        id: number,
        name: string,
        firstName: string,
        catev: string
    },
    riderNumber: string
    catev: string
}

const EMPTY_FORM: IForm = {licence: null, riderNumber: '', catev: ''};

export const CreationForm = (
    {competition, race, onSuccess}:
        {
            competition: Competition,
            race: string,
            onSuccess: (race: IForm) => void,
        }
) => {

    const [form, setForm] = useState<IForm>(EMPTY_FORM);
    const [, setNotification] = useContext(NotificationContext);

    const onError = (message: string) => setNotification({
        message,
        open: true,
        type: 'error'
    });

    const submit = async () => {
        // TODO : Les catégories de valeur doivent etre référencées dans une table avec la fédé
        if (isNaN(parseInt(form.catev))) {
            setNotification({
                message: `La catégorie de valeur doit être un chiffre de 1 à 5 `,
                open: true,
                type: 'error'
            });
        return;
        }
        try {
            const dto: RaceCreate = {
                licenceId: form.licence && form.licence.id,
                raceCode: race,
                riderNumber: parseInt(form.riderNumber),
                catev: form.catev,
                competitionId: competition.id
            };
            await create(dto);
            setNotification({
                message: `Le coureur ${form.licence.name} ${form.licence.firstName} a bien été enregistré sous le dossard ${form.riderNumber}`,
                open: true,
                type: 'success'
            });
            onSuccess(form);
            setForm(EMPTY_FORM);
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

    const onRiderChange = (licence: Licence) => {
        setForm({
            ...form,
            licence,
            riderNumber: '',
            catev: (competition && licence && (competition.fede === licence.fede)) ? licence.catev : ''
        });
    };

    const classes = formStyles({});

    const catecolor = (form.licence && form.catev !== form.licence.catev) ? 'red' : '#000';
    return <Grid container={true} alignItems="flex-end" className={classes.form}>
        <Grid item={true}>
            <Typography variant="h5" style={{marginRight: 20}}>
                Nouveau Coureur :
            </Typography>
        </Grid>
        <Grid item={true} style={{zIndex: 20}}>
            <AutocompleteInput style={{width: '500px'}} selection={form.licence}
                               onChangeSelection={onRiderChange}
                               placeholder="Coureur (nom, numéro de licence...)"
                               feedDataAndRenderer={filterLicences}/>
        </Grid>
        <Grid item={true}>
            <TextField
                label="Numéro de dossard"
                value={form.riderNumber}
                className={classes.field}
                onChange={e => setForm({...form, riderNumber: e.target.value})}
                inputProps={{
                    onKeyPress: e => e.key === 'Enter' && submit(),
                    style: {textAlign: 'center'}
                }}
            />
        </Grid>

        <Grid item={true} xs={1}>
            <TextField
                label="Catégorie"
                value={form.catev}
                className={classes.field}
                onChange={e => {
                    setForm({...form, catev: e.target.value});
                }}
                inputProps={{
                    onKeyPress: e => e.key === 'Enter' && submit(),
                    style: {textAlign: 'center', color: catecolor}
                }}
            />
        </Grid>
        <Grid item={true}>
            <Button
                variant="contained"
                color="primary"
                onClick={submit}
            >
                Ajouter
            </Button>
        </Grid>
    </Grid>;
};
