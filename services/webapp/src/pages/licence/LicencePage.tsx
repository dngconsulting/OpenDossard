import * as React from 'react';
import {useContext, useEffect, useState} from 'react';

import {withStyles} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
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
import {LicenceEntity, LicenceEntity as Licence, LicenceEntityFedeEnum} from '../../sdk';
import {apiLicences} from '../../util/api';
import {FEDERATIONS} from '../common/shared-entities';
import {NotificationContext} from "../../components/CadSnackbar";
import {store} from "../../store/Store";
import {setVar} from "../../actions/App.Actions";

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

interface IAgeCategory {
    label: string;
    value: string;
    gender:string;
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
    const [, setNotification] = useContext(NotificationContext);
    const [editMode,setEditMode] = useState<boolean>(false);
    const [deptError,setDeptError] = useState<boolean>(false);
    const [birthError,setBirthError] = useState<boolean>(false);
    const [newLicence, setNewLicence] = React.useState<Licence>({
        id:null,
        name:'',
        firstName: '',
        licenceNumber: '',
        gender:'H',
        fede: LicenceEntityFedeEnum.NL,
        birthYear: '',
        dept: '',
        club: '',
        catea: '',
        catev: '',
    });

    useEffect(()=>{
        const id = props.match.params.id;
        if(!isNaN(parseInt(id))){
            setEditMode(true)
            apiLicences.get({id}).then((res:Licence) =>{

                const toUpdateLicence = {...newLicence,
                    id:res.id,
                    name:res.name,
                    firstName:res.firstName,
                    licenceNumber: res.licenceNumber,
                    gender: res.gender,
                    birthYear: res.birthYear?res.birthYear:'',
                    fede: res.fede,
                    dept: res.dept,
                    club: res.club,
                    catea: res.catea.toUpperCase(),
                    catev: res.catev.toUpperCase()
                }
                setNewLicence(toUpdateLicence);
        })
        } else { setEditMode(false)}
        return () => setEditMode(false)
    },[]);

    const [validation, setValidation] = React.useState({
        name:false,
        firstName:false,
        catea:false,
        catev:false,
        dept:false,
        birthYear:false
    });

    const handleFEDEChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        if(event.target.name ==='fede' && event.target.value){
            const newLicenceToUpdage = {...newLicence,
                [event.target.name as string]: event.target.value,
                catev:  '',
                catea:  ''
            }
            setNewLicence(newLicenceToUpdage)
        }
    };

    const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
        setNewLicence(oldValues => ({
            ...oldValues,
            [event.target.name as string]: event.target.value,
        }))
    }

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        setNewLicence(oldValues => ({
            ...oldValues,
            catea:'',
            catev:'',
            gender: (event.target as HTMLInputElement).value
        }))
    };

    const onSelectClub = (value:string)=>{
        setNewLicence({...newLicence, club: value});
    };

    const createLicence = async (id: number) => {
        if ((newLicence.catea==='') || (newLicence.catev==='') || (newLicence.name==='' || newLicence.firstName==='' || newLicence.dept==='')) {
            setValidation({
                name: !newLicence.name,
                firstName: !newLicence.firstName,
                catea: !newLicence.catea,
                catev: !newLicence.catev,
                dept: !newLicence.dept,
                birthYear: !newLicence.birthYear
            });
            setNotification({
                message: `Une de ces informations est manquante (caté valeur, caté age, nom et prénom)`,
                open: true,
                type: 'error'
            });
            return;
        }
        store.dispatch(setVar({showLoading: true}))
        let returnedLicence : LicenceEntity = newLicence ;
        try {
            if (id) {
                await apiLicences.update({licenceEntity: newLicence})
            } else {
                returnedLicence = await apiLicences.create({licenceEntity: newLicence});
            }
            if (props.history.location.hash && props.history.location.hash.length>0) {
                props.history.goBack();
                setNotification({
                    message: `Important : Vous venez de modifier les données du coureur ${newLicence.firstName} ${newLicence.name}. Vous devez le désengager `+
                     `et le réengager afin que les données soient actualisées sur l'épreuve`,
                    type: 'warning',
                    open: true
                });
            }
            else {
                props.history.push({
                    pathname: '/licences/',
                    search: 'id=' + returnedLicence.id
                })
            }
        }
        catch (err) {
            setNotification({
                message: `Le coureur ${newLicence.firstName} ${newLicence.name} n'a pu être créé ou modifié`,
                type: 'error',
                open: true
            });
        }
        finally {
            store.dispatch(setVar({showLoading: false}))
        }
    };

    // @ts-ignore
    const classes = useStyles();
    return (
        <Container maxWidth="sm">
            <Grid container={true} spacing={3}>
                <Grid item={true} xs={12}>
                    <h1>{editMode?'Modifier':'Ajouter'} une nouvelle Licence</h1>
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        id="licenceNumber"
                        label="Numéro Licence"
                        value={newLicence.licenceNumber}
                        onChange={e => setNewLicence({...newLicence, licenceNumber: e.target.value})}
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl}>
                        <InputLabel htmlFor="fede">Fédération</InputLabel>
                        <Select
                            value={newLicence.fede}
                            onChange={e=> {
                                handleFEDEChange(e);
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
                            onChange={e => setNewLicence({...newLicence, name: e.target.value})}
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
                        onChange={e => setNewLicence({...newLicence, firstName: e.target.value})}
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
                        error={birthError}
                        id="birthYear"
                        type="number"
                        label="Année de la naissance"
                        margin="normal"
                        value={newLicence.birthYear}
                        onBlur={e=>{
                            if (parseInt(e.target.value) <1930 || parseInt(e.target.value) > 2020) {
                                setNewLicence({...newLicence, birthYear: ''})
                                setBirthError(true)
                                return;
                            }
                            setBirthError(false)
                        }}
                        onChange={e => {
                            setNewLicence({...newLicence, birthYear: e.target.value})}}
                    />
                </Grid>
                <Grid item={true} xs={6}>
                    <TextField
                        error={deptError}
                        style={{width:100}}
                        id="department"
                        label="Département"
                        type="number"
                        margin="normal"
                        value={newLicence.dept}
                        onBlur={e=>{
                            if (parseInt(e.target.value) <1 || parseInt(e.target.value) > 99) {
                                setNewLicence({...newLicence, dept: ''})
                                setDeptError(true)
                                return;
                            }
                            setDeptError(false)
                        }}
                        onChange={e => {
                            setNewLicence({...newLicence, dept: e.target.value})
                        }}
                    />
                </Grid>
                <Grid item={true} xs={12}>
                    <Grid item={true} xs={10}>
                        <ClubSelect onSelect={onSelectClub} chosenClub={{value:null,label:newLicence.club} as IOptionType}/>
                    </Grid>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl} error={validation.catea}>
                        <InputLabel htmlFor="catea">Catégorie Age</InputLabel>
                        <Select
                            value={newLicence.catea.toUpperCase()}
                            onChange={handleChange}
                            inputProps={{
                                name: 'catea',
                                id: 'catea',
                            }}
                        >{
                            FEDERATIONS[newLicence.fede.toString()].catea.map((item: IAgeCategory, index: number) => {
                                if (item.gender===newLicence.gender) return (<MenuItem key={index} value={item && item.value.toUpperCase()}>{(item && item.label) + ' (' + (item && item.value && item.value.toUpperCase()) + ')'}</MenuItem>)
                                return null;
                            })
                        }
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item={true} xs={6}>
                    <FormControl className={classes.formControl} error={validation.catev}>
                        <InputLabel htmlFor="catev">Catégorie Valeur</InputLabel>
                        <Select
                            value={newLicence.catev.toUpperCase()}
                            onChange={handleChange}
                            inputProps={{
                                name: 'catev',
                                id: 'catev',
                            }}
                        > {
                            newLicence.fede &&
                            FEDERATIONS[newLicence.fede.toString()].catev.map((item: ICategory, index: number) => {
                                return (item && item.value) &&
                                (<MenuItem key={index} value={item && item.value && item.value.toUpperCase()}>{item && item.label}</MenuItem>)
                            })
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
