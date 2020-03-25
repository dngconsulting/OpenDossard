import {default as React, useContext, useEffect, useState} from 'react';
import {CompetitionEntity as Competition, LicenceEntity as Licence, RaceCreate, RaceRow} from '../../sdk/models';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import AutocompleteInput from '../../components/AutocompleteInput';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {createStyles, FormHelperText, Theme} from '@material-ui/core';
import {apiRaces} from '../../util/api';
import {NotificationContext} from '../../components/CadSnackbar';
import {filterLicences} from '../common/filters';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import {FEDERATIONS} from '../common/shared-entities';
import {store} from "../../store/Store";
import {setVar} from "../../actions/App.Actions";

const create = async (newRace: RaceCreate) => {
    await apiRaces.engage({raceCreate: newRace});
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

interface ICategory {
    label: string;
    value: string;
}

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
    {competition, race, onSuccess, rows, saisieResultat}:
        {
            competition: Competition,
            race: string,
            onSuccess: (race: IForm) => void,
            rows: RaceRow[]
            saisieResultat: boolean
        }
) => {

    const [form, setForm] = useState<IForm>(EMPTY_FORM);
    const [, setNotification] = useContext(NotificationContext);
    const [ranking, setRanking] = useState(0);

    useEffect(() => {
        setRanking(rows.length + 1)
    })
    const onError = (message: string) => setNotification({
        message: (!message) ? 'une erreur technique est survenue' : message,
        open: true,
        type: 'error'
    });
    const sleep = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const submit = async () => {
        if (!form.riderNumber || !form.catev || !form.licence) {
            setNotification({
                message: `Merci de saisir un coureur, un numéro de dossard et une catégorie `,
                open: true,
                type: 'error'
            });
            return;
        }
        try {
            const dto: RaceCreate = {
                licenceId: form.licence && form.licence.id,
                raceCode: race,
                ...(saisieResultat ? {riderNumber: ranking} : {riderNumber: parseInt(form.riderNumber)}),
                catev: form.catev,
                competitionId: competition.id,
                ...(saisieResultat ? {rankingScratch: ranking} : null)
            };
            store.dispatch(setVar({showLoading: true}))
            await create(dto);
            setRanking(ranking + 1)
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
        finally {
            store.dispatch(setVar({showLoading: false}))
        }
    };

    const onRiderChange = (licence: Licence) => {
        setForm({
            ...form,
            ...(saisieResultat ? {riderNumber: ranking.toString()} : {riderNumber: ''}),
            licence,
            catev: (competition && licence && (competition.fede.toUpperCase() === licence.fede.toUpperCase())) ? licence.catev : ''
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
            <AutocompleteInput style={{width: '550px'}} selection={form.licence}
                               onChangeSelection={onRiderChange}
                               placeholder="Nom Prénom Fede NuméroLicence"
                               feedDataAndRenderer={filterLicences}/>
        </Grid>
        <Grid item={true}>
            <TextField
                label="Dossard"
                value={saisieResultat ? ranking : form.riderNumber}
                disabled={saisieResultat}
                className={classes.field}
                style={{width: '100px'}}
                onChange={e => setForm({...form, riderNumber: e.target.value})}
                inputProps={{
                    onKeyPress: e => e.key === 'Enter' && submit(),
                    style: {textAlign: 'center'}
                }}
            />

        </Grid>


        <div>
            <FormHelperText>Catégorie</FormHelperText>
            <Select value={form.catev as string} style={{color: catecolor, minWidth: '100px'}}
                    onChange={e => {
                        setForm({...form, catev: e.target.value as string});
                    }}>
                {FEDERATIONS.FSGT.catev.map((value: ICategory, index: number) =>
                    <MenuItem key={index} value={value.value}>{value.label}</MenuItem>)}
            </Select>
            <Button
                variant="contained"
                color="primary"
                style={{marginLeft: 10}}
                onClick={submit}
            >
                Ajouter
            </Button>

        </div>

    </Grid>;
};
