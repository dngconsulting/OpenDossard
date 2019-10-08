import {default as React, useContext, useState} from "react";
import {RaceCreate} from "../../sdk";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import AutocompleteInput from "../../components/AutocompleteInput";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {createStyles, Theme} from "@material-ui/core";
import {apiRaces} from "../../util/api";
import {NotificationContext} from "../../components/CadSnackbar";

const create = async (newRace: RaceCreate) => {
    await apiRaces.create(newRace);
}

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

export const CreationForm = (
    {competitionId, race, onSuccess}:
        {
            competitionId: number,
            race: string,
            onSuccess: (race: IForm) => void,
        }
) => {

    const [form, setValues] = useState<IForm>({licence: null, riderNumber: ''});
    const [ ,setNotification] = useContext(NotificationContext);

    const onError = (message:string) => setNotification({
        message,
        open: true,
        type: 'error'
    })

    const submit = async () => {
        try {
            const dto: RaceCreate = {
                licenceId: form.licence && form.licence.id,
                raceCode: race,
                riderNumber: parseInt(form.riderNumber),
                competitionId
            }
            await create(dto);
            setNotification({
                message: `Le coureur ${form.licence.name} ${form.licence.firstName} a bien été enregistré sous le dossard ${form.riderNumber}`,
                open: true,
                type: 'success'
            })
            onSuccess(form)
            setValues({licence: null, riderNumber: ''});
        } catch (e) {
            if ( e.json ) {
                const {message} = (await e.json());
                onError(message)
            } else {
                console.log(e)
                onError('Une erreur est survenue');
            }
        }
    };

    const classes = formStyles({});

    return <Paper style={{paddingLeft: 20, paddingBottom: 20, width: '100%'}} square={true}>
        <Grid container={true} spacing={3} alignItems={"baseline"}>
            <Typography variant="h5" gutterBottom={true} style={{marginRight: 20}}>
                Nouveau Coureur :
            </Typography>
            <AutocompleteInput style={{width: '450px', zIndex: 20}} selection={form.licence} onChangeSelection={(e: any) => setValues({...form, licence: e})}/>
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
    </Paper>
}
