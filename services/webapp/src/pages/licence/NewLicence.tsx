import * as React from 'react';

import {withStyles} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import 'date-fns';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';

import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import ClubSelect from './ClubSelect';

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
}

interface ICategory {
    label: string;
    value: string;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        formControl: {
            minWidth: 167,
        },
        button: {
            margin: theme.spacing(1),
        }
    }),
);

const cateV = [
    {label: 'Cadet', value: 'cadet'},
    {label: 'Féminin', value: 'f'},
    {label: 'Minimes', value: 'm'},
    {label: '1', value: '1'},
    {label: '2', value: '2'},
    {label: '3', value: '3'}];

const cateA = [
    {label: 'Jeune', value: 'j'},
    {label: 'Senior', value: 's'},
    {label: 'Vétéran', value: 'v'},
    {label: 'Super Vétéran', value: 'sv'},
    {label: 'Ancien', value: 'a'}];

const federations = {
    fsgt: {
        name: {label: 'FSGT', value: 'fsgt'},
        cateV: [...cateV, {label: '4', value: '4'}, {label: '5', value: '5'}]
    },
    ufolep: {
        name: {label: 'UFOLEP', value: 'ufolep'},
        cateV: [...cateV, {label: 'GS', value: 'gs'}]
    },
    ffc: {
        name: {label: 'FFC', value: 'ffc'},
        cateV
    },
};


const NewLicencesPage = (props: ILicencesProps) => {

    const [values, setValues] = React.useState({
        federation: '',
        birthYear: '',
        cateA: '',
        cateV: '',
        disableCateV: false
    });

    const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        setValues(oldValues => ({
            ...oldValues,
            [event.target.name as string]: event.target.value,
        }));
    };

    const handleFederationChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        setValues(oldValues => ({
            ...oldValues,
            [event.target.name as string]: event.target.value,
            disableCateV: !event.target.value
        }));
    };


    const [genre, setGenre] = React.useState('m');

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGenre((event.target as HTMLInputElement).value);
    };

    // @ts-ignore
    const classes = useStyles();

    return (
        <Container maxWidth="sm">
            <Grid container={true} spacing={3}>
                <Grid item={true} xs={12}>
                    <h1>Ajouter une nouvelle Licence</h1>
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        id="licenceNumber"
                        label="Numéro Licence"
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl}>
                        <InputLabel htmlFor="federation">Fédération</InputLabel>
                        <Select
                            value={values.federation}
                            onChange={handleFederationChange}
                            inputProps={{
                                name: 'federation',
                                id: 'federation',
                            }}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {Object.keys(federations).map((key, index) => <MenuItem key={index}
                                                                                    value={federations[key].name.value}>{federations[key].name.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        required={true}
                        id="surname"
                        label="Nom"
                        margin="normal"
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        required={true}
                        id="firstname"
                        label="Prénom"
                        margin="normal"
                    />
                </Grid>
                <Grid item={true} xs={12} style={{display: 'flex'}}>
                    <div><span style={{position: 'relative', top: '11px'}}>Genre</span></div>
                    <RadioGroup aria-label="position" name="position" value={genre}
                                onChange={handleRadioChange} row={true}>
                        <FormControlLabel
                            value="m"
                            control={<Radio color="primary"/>}
                            label="M"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="f"
                            control={<Radio color="primary"/>}
                            label="F"
                            labelPlacement="start"
                        />
                    </RadioGroup>
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        id="birthYear"
                        label="Année de la naissance"
                        margin="normal"
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        id="departement"
                        label="Departement"
                        margin="normal"
                    />
                </Grid>
                <Grid item={true} xs={12}>
                    <Grid item={true} xs={10}>
                        <ClubSelect/>
                    </Grid>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl}>
                        <InputLabel htmlFor="cateA">Catégorie Age</InputLabel>
                        <Select
                            value={values.cateA}
                            onChange={handleChange}
                            inputProps={{
                                name: 'cateA',
                                id: 'cateA',
                            }}
                        >{
                            cateA.map((value: ICategory, index: number) => <MenuItem key={index}
                                                                                     value={value.value}>{value.label}</MenuItem>)
                        }
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl} disabled={values.disableCateV}>
                        <InputLabel htmlFor="cateA">Catégorie Valeur</InputLabel>
                        <Select
                            value={values.cateV}
                            onChange={handleChange}
                            inputProps={{
                                name: 'cateV',
                                id: 'cateV',
                            }}
                        > {

                            values.federation &&
                            federations[values.federation].cateV.map((value: ICategory, index: number) =>
                                <MenuItem key={index} value={value.value}>{value.label}</MenuItem>)

                        }
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <Button variant="contained" color="primary" className={classes.button}>
                        Sauvegarder
                    </Button>
                </Grid>
                <Grid item={true} xs={6}>
                    <Button variant="contained" color="secondary" className={classes.button}
                            onClick={() => {
                                props.history.goBack();
                            }}>
                        Retour
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
};

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(NewLicencesPage as any) as any;
