import * as React from 'react';
import {useEffect} from 'react';

import {withStyles} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
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
import ClubSelect, {IOptionType} from './ClubSelect';
import {LicenceEntity as Licence, LicenceEntityFedeEnum} from '../../sdk';
import {apiLicences} from '../../util/api';
import {CATEA, FEDERATIONS} from '../common/shared-entities';

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
    match: any;
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

const LicencesPage = (props: ILicencesProps) => {

    const [newLicence, setValues] = React.useState<Licence>({
        id:null,
        name:'',
        firstName: '',
        licenceNumber: '',
        gender:'H',
        fede: LicenceEntityFedeEnum.NonLicenci,
        birthYear: '',
        dept: '',
        club: '',
        catea: '',
        catev: '',
    });

    useEffect(()=>{
        const id = props.match.params.id;
        if(!isNaN(parseInt(id))){
            apiLicences.get(id).then((res:Licence) =>{
                setValues({...newLicence,
                    id:res.id,
                    name:res.name,
                    firstName:res.firstName,
                    licenceNumber: res.licenceNumber,
                    gender: res.gender,
                    birthYear: res.birthYear,
                    fede: res.fede,
                    dept: res.dept,
                    club: res.club,
                    catea: res.catea.indexOf('F')>-1?res.catea.replace('F','').toLowerCase():res.catea.toLowerCase(),
                    catev: res.catev
                });
                setDisableCateV(res.fede === undefined);
                setDisableCateA(res.fede === LicenceEntityFedeEnum.UFOLEP);
        })
        }
    },[]);
    const [disableCateV, setDisableCateV] = React.useState(true);
    const [disableCateA, setDisableCateA] = React.useState(true);

    const [validation, setValidation] = React.useState({
        name:false,
        firstName:false
    });

    const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        if(event.target.name ==='fede' && !event.target.value){
            setValues(oldValues => ({
                ...oldValues,
                [event.target.name as string]: event.target.value,
                catev: ''
            }))
        }else if(event.target.name ==='fede' && event.target.value === 'ufolep'){
            setValues(oldValues => ({
                ...oldValues,
                [event.target.name as string]: event.target.value,
                catea: ''
            }))

        }else{
            setValues(oldValues => ({
                ...oldValues,
                [event.target.name as string]: event.target.value,
            }))
        }
    };

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValues(oldValues => ({
            ...oldValues,
            gender: (event.target as HTMLInputElement).value
        }))
    };

    const onSelectClub = (value:string)=>{
        setValues({...newLicence, club: value});
    };

    const createLicence = (id: number) => {
        newLicence.name && newLicence.firstName ?
            (id ? apiLicences.update({licenceEntity:newLicence}).then(() => props.history.goBack()) :
                    apiLicences.create({licenceEntity:newLicence}).then(() => props.history.goBack())
            ) :
            setValidation({
                name: !newLicence.name,
                firstName: !newLicence.firstName
            });
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
                        value={newLicence.licenceNumber}
                        onChange={e => setValues({...newLicence, licenceNumber: e.target.value})}
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl}>
                        <InputLabel htmlFor="fede">Fédération</InputLabel>
                        <Select
                            value={newLicence.fede}
                            onChange={e=> {
                                handleChange(e);
                                setDisableCateV(e.target.value==='');
                                setDisableCateA(e.target.value==='ufolep')
                                }
                            }
                            inputProps={{
                                name: 'fede',
                                id: 'fede',
                            }}
                        >
                            {Object.keys(FEDERATIONS).map((key, index) => <MenuItem key={index}
                                                                                    value={FEDERATIONS[key].name.value}>{FEDERATIONS[key].name.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl} error={validation.name}>
                        <TextField
                            required={true}
                            id="name"
                            label="Nom"
                            margin="normal"
                            error={validation.name}
                            value={newLicence.name}
                            onChange={e => setValues({...newLicence, name: e.target.value})}
                        />
                        <FormHelperText id="component-error-text" hidden={!validation.name}>Veuillez compléter le nom</FormHelperText>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl} error={validation.firstName}>
                    <TextField
                        required={true}
                        id="firstName"
                        label="Prénom"
                        margin="normal"
                        error={validation.firstName}
                        value={newLicence.firstName}
                        onChange={e => setValues({...newLicence, firstName: e.target.value})}
                    />
                        <FormHelperText id="component-error-text" hidden={!validation.firstName}>Veuillez compléter le prénom</FormHelperText>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={12} style={{display: 'flex'}}>
                    <div><span style={{position: 'relative', top: '11px'}}>Genre</span></div>
                    <RadioGroup aria-label="position" name="position" value={newLicence.gender}
                                onChange={handleRadioChange} row={true}>
                        <FormControlLabel
                            value="H"
                            control={<Radio color="primary"/>}
                            label="H"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="F"
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
                        value={newLicence.birthYear}
                        onChange={e => setValues({...newLicence, birthYear: e.target.value})}
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        id="department"
                        label="Département"
                        margin="normal"
                        value={newLicence.dept}
                        onChange={e => setValues({...newLicence, dept: e.target.value})}
                    />
                </Grid>
                <Grid item={true} xs={12}>
                    <Grid item={true} xs={10}>
                        <ClubSelect onSelect={onSelectClub} chosenClub={{value:null,label:newLicence.club} as IOptionType}/>
                    </Grid>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl} disabled={disableCateA}>
                        <InputLabel htmlFor="catea">Catégorie Age</InputLabel>
                        <Select
                            value={newLicence.catea}
                            onChange={handleChange}
                            inputProps={{
                                name: 'catea',
                                id: 'catea',
                            }}
                        >{
                            CATEA.map((value: ICategory, index: number) => <MenuItem key={index}
                                                                                     value={value.value}>{ newLicence.gender === 'F' ?
                                value.label + ' (F' + value.value.toUpperCase() + ')' : value.label + ' (' + value.value.toUpperCase() + ')'}</MenuItem>)
                        }
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl} disabled={disableCateV}>
                        <InputLabel htmlFor="catev">Catégorie Valeur</InputLabel>
                        <Select
                            value={newLicence.catev}
                            onChange={handleChange}
                            inputProps={{
                                name: 'catev',
                                id: 'catev',
                            }}
                        > {

                            newLicence.fede &&
                            FEDERATIONS[newLicence.fede].catev.map((value: ICategory, index: number) =>
                                <MenuItem key={index} value={value.value}>{value.label}</MenuItem>)

                        }
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <Button variant="contained" color="secondary" className={classes.button}
                            onClick={() => {
                                props.history.goBack();
                            }}>
                        Retour
                    </Button>
                </Grid>
                <Grid item={true} xs={6}>
                    <Button variant="contained" color="primary" className={classes.button} onClick={()=>
                        createLicence(newLicence.id)}>
                        Sauvegarder
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
};

const styles = (theme: Theme) => ({});

export default withStyles(styles as any)(LicencesPage as any) as any;
