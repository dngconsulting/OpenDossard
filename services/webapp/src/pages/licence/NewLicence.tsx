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


const NewCoureursPage = () => {

    const [values, setValues] = React.useState({
        federation: '',
        age: '',
        cateA: '',
        cateV: ''
    });

    const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        setValues(oldValues => ({
            ...oldValues,
            [event.target.name as string]: event.target.value,
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
                        required={true}
                        id="licenceNumber"
                        label="Numéro Licence"
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl}>
                        <InputLabel htmlFor="federation">Fédération</InputLabel>
                        <Select
                            value={values.federation}
                            onChange={handleChange}
                            inputProps={{
                                name: 'federation',
                                id: 'federation',
                            }}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            <MenuItem value={'fsgt'}>FSGT</MenuItem>
                            <MenuItem value={'ufolep'}>UFOLEP</MenuItem>
                            <MenuItem value={'ffc'}>FFC</MenuItem>
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
                        id="age"
                        label="Age"
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
                        >
                            <MenuItem value={'jeune'}>Jeune</MenuItem>
                            <MenuItem value={'senior'}>Senior</MenuItem>
                            <MenuItem value={'veteran'}>Vétéran</MenuItem>
                            <MenuItem value={'super_veteran'}>Super Vétéran</MenuItem>
                            <MenuItem value={'ancien'}>Ancien</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl}>
                        <InputLabel htmlFor="cateA">Catégorie Valeur</InputLabel>
                        <Select
                            value={values.cateV}
                            onChange={handleChange}
                            inputProps={{
                                name: 'cateV',
                                id: 'cateV',
                            }}
                        >
                            <MenuItem value={'1'}>1</MenuItem>
                            <MenuItem value={'2'}>2</MenuItem>
                            <MenuItem value={'3'}>3</MenuItem>
                            <MenuItem value={'cadet'}>Cadet</MenuItem>
                            <MenuItem value={'feminin'}>Féminin</MenuItem>
                            <MenuItem value={'minimes'}>Minimes</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <Button variant="contained" color="primary" className={classes.button}>
                        Sauvegarder
                    </Button>
                </Grid>
                <Grid item={true} xs={6}>
                    <Button variant="contained" color="secondary" className={classes.button}>
                        Retour
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
};

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(NewCoureursPage as any) as any;
