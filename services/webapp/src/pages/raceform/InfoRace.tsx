import React, {useContext, useState} from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, createStyles, makeStyles, Theme, FormHelperText, } from '@material-ui/core';
import Editor from 'components/Editor';
import ClubSelectRace from './ClubSelectRace';
import moment from 'moment';
import { IOptionType } from 'pages/licence/ClubSelect';
import {
    CompetitionCreate,
    CompetitionCreateCompetitionTypeEnum,
    CompetitionEntityCompetitionTypeEnum,
    CompetitionInfo
} from 'sdk';
import { FedeEnum } from 'sdk/models/FedeEnum';
import {IErrorInfo, IErrorPrice} from "../competition/CompetitionForm";
import {NotificationContext} from "../../components/CadSnackbar";

interface IInfoRaceProps {
    mainInfos: CompetitionCreate;
    updateMainInfos: (competition: CompetitionCreate, errors: boolean) => void;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        formControl: {
            margin: 8,
            width: '200px',
            marginRight: '50px',
            marginTop: '50px'
        },
        container: {
            margin: 8,
            width: '230px',
            marginRight: '50px',
            marginTop: '50px'
        },
    }),
);

const InfoRace = (props: IInfoRaceProps) => {
    const date: string = moment(props.mainInfos.eventDate).format("YYYY-MM-DDTHH:mm");
    const classes = useStyles();
    const [, setNotification] = useContext(NotificationContext);
    const [error, setError]   = useState<IErrorInfo>({
        fede: false,
        name: false,
        competitionType: false,
        eventDate: false,
        zipCode: false,
        club: false,
        contactPhone: false,
        contactEmail: false,
        facebook: false,
        website: false,
    });

    const showEmptyFields = (): boolean => {
        return error.fede || error.name || error.competitionType || error.eventDate || error.zipCode ||
            error.club || error.contactPhone || error.contactEmail || error.facebook || error.website;
    }

    const handleChangeBox = (event: React.ChangeEvent<HTMLInputElement>) => {
        const mainInfoError = showEmptyFields();
        props.updateMainInfos({
            ...props.mainInfos,
            [event.target.name]: event.target.checked
        }, mainInfoError);
    }

    const handleObservations = (data: string): void => {
        const mainInfoError = showEmptyFields();
        props.updateMainInfos({...props.mainInfos, observations: data}, mainInfoError)
    }
    
    const handleFormDate = (event: any): void => {
        const label = event.currentTarget.name;
        const value = event.currentTarget.value;
        if(label === 'eventDate') {
            setError({
                ...error,
                eventDate: !value,
            });
        }
        const mainInfoError = showEmptyFields();
        props.updateMainInfos({
            ...props.mainInfos,
            [label]: moment(value, "YYYY-MM-DD HH:mm:ssZZ")
        }, mainInfoError);
    }

    const handleForm = (event: any): void => {
        const label = event.target.name;
        const value = event.target.value;
        if(label === 'name' || label === 'zipCode') {
            setError({
                ...error,
                [label]: !value,
            });
        }
        controlTextfield(label, value);
        const mainInfoError = showEmptyFields();
        props.updateMainInfos({
            ...props.mainInfos,
            [label]: value
        }, mainInfoError);
    }

    const handleSelect = (event: any) => {
        const label = event.target.name;
        const value = event.currentTarget.dataset.value;
        if(label === 'competitionType') {
            setError({
                ...error,
                [label]: !value,
            });
        }
        const mainInfoError = showEmptyFields();
        props.updateMainInfos({
            ...props.mainInfos,
            [label]: value
        }, mainInfoError);
    }

    const handleSelectFede = (event: any) => {
        const label = event.target.name;
        const value = event.currentTarget.dataset.value;
        setError({
            ...error,
            'fede': !value,
        });
        const mainInfoError = showEmptyFields();
        if(value === FedeEnum.FSGT){
            props.updateMainInfos({
                ...props.mainInfos,
                [label]: value, races : ['2,3,4,5']
            }, mainInfoError);
         }
         else{
            props.updateMainInfos({
                ...props.mainInfos,
                [label]: value, races : ['Toutes']
            }, mainInfoError);
         }
    }

    const onSelectClub = (value: number) => {
        const mainInfoError = showEmptyFields();
        props.updateMainInfos({ ...props.mainInfos, club: value }, mainInfoError);
    }

    // controles format
    const controlTextfield = (label: string, value: string): void => {
        let mainInfoError = error.fede && error.name && error.competitionType && error.eventDate && error.zipCode &&
            error.club && error.contactPhone && error.contactEmail && error.facebook && error.website;
        if(label === 'contactPhone') {
            if (value.length <= 9 && value !== "") {
                setError({
                    ...error,
                    contactPhone: true,
                });
                mainInfoError = mainInfoError && error.contactPhone;
                props.updateMainInfos({...props.mainInfos, resultsValidated: false}, mainInfoError);
            }
            else {
                setError({
                    ...error,
                    contactPhone: false,
                });
            }
        }
        else if(label === 'contactEmail') {
            if (value.includes('@', null) === false && value !== "") {
                setError({
                    ...error,
                    contactEmail: true,
                });
                mainInfoError = mainInfoError && error.contactPhone;
                props.updateMainInfos({...props.mainInfos, resultsValidated: false}, mainInfoError);
            }
            else {
                setError({
                    ...error,
                    contactEmail: false,
                });
            }
        }
        else if(label === 'zipCode') {
            if (value.length < 5) {
                setError({
                    ...error,
                    zipCode: true,
                });
                mainInfoError = mainInfoError && error.contactPhone;
                props.updateMainInfos({...props.mainInfos, resultsValidated: false}, mainInfoError);
            }
            else {
                setError({
                    ...error,
                    zipCode: false,
                });
            }
        }
        else if(label === 'facebook') {
            if (value.includes('http', 0) === false && value !== "") {
                setError({
                    ...error,
                    facebook: true,
                });
                mainInfoError = mainInfoError && error.contactPhone;
                props.updateMainInfos({...props.mainInfos, resultsValidated: false}, mainInfoError);
            }
            else {
                setError({
                    ...error,
                    facebook: false,
                });
            }
        }
        else if(label === 'website') {
            if (value.includes('http', 0) === false && value !== "") {
                setError({
                    ...error,
                    website: true,
                });
                mainInfoError = mainInfoError && error.contactPhone;
                props.updateMainInfos({...props.mainInfos, resultsValidated: false}, mainInfoError);
            }
            else {
                setError({
                    ...error,
                    website: false,
                });
            }
        }
    }

    return (
        <div >
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField required={true}
                           label="Nom de l'épreuve"
                           value={props.mainInfos.name}
                           error={error.name}
                           helperText={error.name && "Le nom de l'épreuve doit être renseigné"}
                           type="text"
                           name="name"
                           onSelect={handleForm}
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField required={true}
                           label="Date et heure de l'épreuve"
                           value={date}
                           error={error.eventDate}
                           type="datetime-local"
                           id="datetime-local"
                           name="eventDate"
                           onSelect={handleFormDate}
                           onChange={handleFormDate}
                           helperText={error.eventDate && "la date de l'épreuve doit être renseignée"}
                           className={classes.container}
                           InputLabelProps={{shrink: true,}} />

                <FormControl required={true} className={classes.formControl} error={error.competitionType}>
                    <InputLabel id="type-epreuve">TYPE</InputLabel>
                    <Select value={props.mainInfos.competitionType || ''}
                            onSelect={handleSelect}
                            onChange={handleSelect}
                            id="type-select"
                            name="competitionType"
                            inputProps={{ name: 'competitionType' }}
                            labelId="type-select-label" >
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.CX}>CX</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.ROUTE}>ROUTE</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.VTT}>VTT</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.AUTRE}>AUTRES</MenuItem>
                    </Select>
                    {( error.competitionType &&
                        <FormHelperText>Le type de l'épreuve doit être renseigné</FormHelperText>
                    )}
                </FormControl>
                <FormControl required={true} className={classes.formControl} error={error.fede}>
                    <InputLabel id="federation-epreuve">Fédération</InputLabel>
                    <Select value={props.mainInfos.fede || ""}
                            onSelect={handleSelectFede}
                            onChange={handleSelectFede}
                            id="federation-select"
                            inputProps={{ name: "fede" }}
                            labelId="federation-select-label" >
                        <MenuItem value={FedeEnum.FSGT}>FSGT</MenuItem>
                        <MenuItem value={FedeEnum.UFOLEP}>UFOLEP</MenuItem>
                        <MenuItem value={FedeEnum.FFC}>FFC</MenuItem>
                        <MenuItem value={FedeEnum.CYCLOS}>CYCLOS</MenuItem>
                        <MenuItem value={FedeEnum.FFVELO}>FFVELO</MenuItem>
                        <MenuItem value={FedeEnum.FFTRI}>FFTRI</MenuItem>
                        <MenuItem value={FedeEnum.NL}>NL</MenuItem>
                    </Select>
                    {( error.fede &&
                        <FormHelperText>La fédération de l'épreuve doit être renseignée</FormHelperText>
                    )}
                </FormControl>
            </div>
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField label="Longueur circuit"
                           value={props.mainInfos.circuitLength}
                           type="text"
                           name='longueurCircuit'
                           onSelect={handleForm}
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField required={true}
                           label="Code Postal"
                           value={props.mainInfos.zipCode}
                           placeholder="ex : 31000"
                           name='zipCode'
                           onSelect={handleForm}
                           onChange={handleForm}
                           error={error.zipCode}
                           helperText={error.zipCode && "Le code postal doit être renseigné en 5 chiffres"}
                           onInput={(event: any) => { event.target.value = event.target.value.replace(/[^0-9]/g, '') }}
                           InputLabelProps={{shrink: true,}}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           inputProps={{type: "text", maxLength: 5}}/>
                <FormControl className={classes.formControl}>
                    <InputLabel>Profil</InputLabel>
                    <Select labelId="profil-select-label"
                            id="profil-select"
                            value={props.mainInfos.info}
                            onSelect={handleSelect}
                            onChange={handleSelect}
                            name="profil"
                            inputProps={{ name: 'info' }}>
                        <MenuItem value={'Valloné'}>VALLONE</MenuItem>
                        <MenuItem value={'Montagne'}>MONTAGNEUX</MenuItem>
                        <MenuItem value={'Circuit Plat'}>PLAT</MenuItem>
                        <MenuItem value={'Moy-Montagne'}>MOY-MONTAGNE</MenuItem>
                        <MenuItem value={'NC'}>NC</MenuItem>
                    </Select>
                </FormControl>
                {
                    props.mainInfos.fede && props.mainInfos.fede !== FedeEnum.NL &&
                        <div style={{ width: '400px', marginTop: '47px', display: 'inline-block' }}>
                            <ClubSelectRace clubError={error.club}
                                            dept="" fede={props.mainInfos.fede}
                                            onSelect={onSelectClub}
                                            chosenClub={{ value: props.mainInfos.club, label:''  } as IOptionType} />
                        </div>
                }
            </div>
            <div>
                <TextField label="Nom contact"
                           value={props.mainInfos.contactName}
                           placeholder="Prénom NOM"
                           name='contactName'
                           type="text"
                           onSelect={handleForm}
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField label="Téléphone Contact"
                           value={props.mainInfos.contactPhone}
                           placeholder="ex : 0695085349"
                           name='contactPhone'
                           onSelect={handleForm}
                           onChange={handleForm}
                           error={error.contactPhone}
                           helperText={error.contactPhone && "le numéro de téléphone doit comporter 10 chiffres"}
                           onInput={(event: any) => { event.target.value = event.target.value.replace(/[^0-9]/g, '') }}
                           InputLabelProps={{shrink: true,}}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           inputProps={{type: 'tel', maxLength: 10,}} />
                <TextField label="E-mail Contact"
                           value={props.mainInfos.contactEmail}
                           placeholder="ex : personne@mail.com"
                           name='contactEmail'
                           type="email"
                           error={error.contactEmail}
                           helperText={error.contactEmail === true && "l'email n'est pas au bon format xyz@mail.com'"}
                           onSelect={handleForm}
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField label="Lien Facebook"
                           value={props.mainInfos.facebook}
                           placeholder="ex : https://www.monfacebook.fr"
                           name='facebook'
                           type="url"
                           error={error.facebook}
                           helperText={error.facebook && "le nom du site doit commencer par http"}
                           onSelect={handleForm}
                           onChange={handleForm}
                           style={{margin: 8, width: '250px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField label="Site web"
                           value={props.mainInfos.website}
                           placeholder="ex : https://www.monsite.fr"
                           name='website'
                           type="url"
                           onSelect={handleForm}
                           onChange={handleForm}
                           error={error.website}
                           helperText={error.website && "le nom du site doit commencer par http"}
                           style={{margin: 8, width: '250px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
            </div>
            <div>
                {
                    props.mainInfos.id ?
                        <TextField label="Commissaires" value={props.mainInfos.commissioner} placeholder="Prénom NOM"
                                   name='commissaires' type="text" onSelect={handleForm} onChange={handleForm}
                                   style={{margin: 8, marginRight: '50px', width: '200px', marginTop: '50px'}}
                                   margin="normal" InputLabelProps={{shrink: true,}} />
                        &&
                        <TextField label="Speaker" value={props.mainInfos.speaker} placeholder="Prénom NOM"
                                   name='speaker' type="text" onSelect={handleForm} onChange={handleForm}
                                   style={{ margin: 8, marginRight: '50px', width: '200px', marginTop: '50px' }}
                                   margin="normal" InputLabelProps={{ shrink: true,}} />
                        &&
                        <TextField label="Observations" value={props.mainInfos.feedback} name='feedback' type="text"
                                   onSelect={handleForm} onChange={handleForm} margin="normal"
                                   style={{margin: 8, marginRight: '50px', width: '250px', marginTop: '50px'}}
                                   InputLabelProps={{ shrink: true, }} />
                        && props.mainInfos.competitionType===CompetitionCreateCompetitionTypeEnum.CX ?
                            <TextField label="Aboyeur" value={props.mainInfos.aboyeur} InputLabelProps={{shrink: true,}}
                                       name='aboyeur' type="text"  onSelect={handleForm} onChange={handleForm}
                                       style={{ margin: 8, marginRight: '50px', width: '200px', marginTop: '50px' }}
                                       margin="normal" placeholder="Prénom NOM" />
                            : null
                        : null
                }
            </div>
            <div style={{ display: 'block', marginTop: '50px' }}>
                <FormControlLabel control={ <Checkbox checked={props.mainInfos.isOpenedToOtherFede}
                                                      onSelect={handleChangeBox}
                                                      onChange={handleChangeBox}
                                                      name="isOpenedToOtherFede"
                                                      color="primary" /> }
                                  label="Ouvert aux licenciés des autres fédérations" />
                <FormControlLabel control={ <Checkbox checked={props.mainInfos.isOpenedToNL}
                                                      onSelect={handleChangeBox}
                                                      onChange={handleChangeBox}
                                                      name="isOpenedToNL"
                                                      color="primary" /> }
                                  label="Ouvert aux non licenciés"
                                  style={{ left: '80px', position: 'relative' }} />
            </div>
            <div style={{ display: 'block', margin: 'auto' }}>
                <Editor data={handleObservations} edit={props.mainInfos.observations} />
            </div>
        </div>
    )
}
export default InfoRace;