import React, { useContext } from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, createStyles, makeStyles, Theme, FormHelperText, } from '@material-ui/core';
import Editor from 'components/Editor';
import ClubSelectRace from './ClubSelectRace';
import moment from 'moment';
import { IOptionType } from 'pages/licence/ClubSelect';
import { CompetitionCreate, CompetitionCreateCompetitionTypeEnum, CompetitionEntityCompetitionTypeEnum } from 'sdk';
import { FedeEnum } from 'sdk/models/FedeEnum';

interface IErrorsForm {
    fede:boolean,
    name:boolean,
    competitionType:boolean,
    eventDate:boolean,
    zipCode:boolean,
    club:boolean,
    contactPhone:boolean,
    contactEmail:boolean,
    facebook:boolean,
    website:boolean
}

interface IInfoRaceProps {
    mainInfos: CompetitionCreate;
    updateMainInfos: (competition: CompetitionCreate) => void;
    errors: IErrorsForm;
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

    const handleChangeBox = (event: React.ChangeEvent<HTMLInputElement>) => {
        props.updateMainInfos({
            ...props.mainInfos,
            [event.target.name]: event.target.checked
        });
    }

    const handleObservations = (data: string): void => {
        props.updateMainInfos({
            ...props.mainInfos,
            observations: data
        })
    }
    
    const handleFormDate = (event: any) => {
        props.updateMainInfos({
            ...props.mainInfos,
            [event.currentTarget.name]: moment(event.currentTarget.value, "YYYY-MM-DD HH:mm:ssZZ")
        });
    }

    const handleForm = (event: any) => {
        props.updateMainInfos({
            ...props.mainInfos,
            [event.currentTarget.name]: event.currentTarget.value
        });
    }

    const handleSelect = (event: any) => {
        props.updateMainInfos({
            ...props.mainInfos,
            [event.target.name]: event.currentTarget.dataset.value
        });
    }

    const handleSelectFede = (event: any) => {
        if(event.currentTarget.dataset.value===FedeEnum.FSGT){
            props.updateMainInfos({
                ...props.mainInfos,
                [event.target.name]: event.currentTarget.dataset.value, races : ['2,3,4,5']
            });
         }
         else{
            props.updateMainInfos({
                ...props.mainInfos,
                [event.target.name]: event.currentTarget.dataset.value, races : ['Toutes']
            });
         }
    }

    const onSelectClub = (value: number) => {
        props.updateMainInfos({ ...props.mainInfos, club: value });
    }

    return (
        <div >
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField required={true}
                           label="Nom de l'épreuve"
                           value={props.mainInfos.name}
                           error={props.errors.name}
                           helperText={props.errors.name && "Le nom de l'épreuve doit être renseigné"}
                           type="text"
                           name="name"
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField required={true}
                           label="Date et heure de l'épreuve"
                           value={date}
                           error={props.errors.eventDate}
                           type="datetime-local"
                           id="datetime-local"
                           name="eventDate"
                           onChange={handleFormDate}
                           helperText={props.errors.eventDate && "la date de l'épreuve doit être renseignée"}
                           className={classes.container}
                           InputLabelProps={{shrink: true,}} />

                <FormControl required={true} className={classes.formControl} error={props.errors.competitionType}>
                    <InputLabel id="type-epreuve">TYPE</InputLabel>
                    <Select value={props.mainInfos.competitionType || ''}
                            onChange={handleSelect}
                            id="type-select"
                            inputProps={{ name: 'competitionType' }}
                            labelId="type-select-label" >
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.CX}>CX</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.ROUTE}>ROUTE</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.VTT}>VTT</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.AUTRE}>AUTRES</MenuItem>
                    </Select>
                    {( props.errors.competitionType &&
                        <FormHelperText>Le type de l'épreuve doit être renseigné</FormHelperText>
                    )}
                </FormControl>
                <FormControl required={true} className={classes.formControl} error={props.errors.fede}>
                    <InputLabel id="federation-epreuve">Fédération</InputLabel>
                    <Select value={props.mainInfos.fede || ""}
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
                    {( props.errors.fede &&
                        <FormHelperText>La fédération de l'épreuve doit être renseignée</FormHelperText>
                    )}
                </FormControl>
            </div>
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField label="Longueur circuit"
                           value={props.mainInfos.circuitLength}
                           type="text"
                           name='longueurCircuit'
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField required={true}
                           label="Code Postal"
                           value={props.mainInfos.zipCode}
                           placeholder="ex : 31000"
                           name='zipCode'
                           onChange={handleForm}
                           error={props.errors.zipCode}
                           helperText={props.errors.zipCode && "Le code postal doit être renseigné en 5 chiffres"}
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
                            onChange={handleSelect}
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
                            <ClubSelectRace clubError={props.errors.club}
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
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField label="Téléphone Contact"
                           value={props.mainInfos.contactPhone}
                           placeholder="ex : 0695085349"
                           name='contactPhone'
                           onChange={handleForm}
                           error={props.errors.contactPhone}
                           helperText={props.errors.contactPhone && "le numéro de téléphone doit comporter 10 chiffres"}
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
                           error={props.errors.contactEmail}
                           helperText={props.errors.contactEmail === true && "l'email n'est pas au bon format xyz@mail.com'"}
                           onChange={handleForm}
                           style={{margin: 8, width: '200px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField label="Lien Facebook"
                           value={props.mainInfos.facebook}
                           placeholder="ex : https://www.monfacebook.fr"
                           name='facebook'
                           type="url"
                           error={props.errors.facebook}
                           helperText={props.errors.facebook && "le nom du site doit commencer par http"}
                           onChange={handleForm}
                           style={{margin: 8, width: '250px', marginRight: '50px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
                <TextField label="Site web"
                           value={props.mainInfos.website}
                           placeholder="ex : https://www.monsite.fr"
                           name='siteweb'
                           type="url"
                           onChange={handleForm}
                           error={props.errors.website}
                           helperText={props.errors.website && "le nom du site doit commencer par http"}
                           style={{margin: 8, width: '250px', marginTop: '50px'}}
                           margin="normal"
                           InputLabelProps={{shrink: true,}} />
            </div>
            <div>
                {
                    props.mainInfos.id ?
                        <TextField label="Commissaires" value={props.mainInfos.commissioner} placeholder="Prénom NOM"
                                   name='commissaires' type="text" onChange={handleForm}
                                   style={{margin: 8, marginRight: '50px', width: '200px', marginTop: '50px'}}
                                   margin="normal" InputLabelProps={{shrink: true,}} />
                        &&
                        <TextField label="Speaker" value={props.mainInfos.speaker} placeholder="Prénom NOM"
                                   name='speaker' type="text" onChange={handleForm}
                                   style={{ margin: 8, marginRight: '50px', width: '200px', marginTop: '50px' }}
                                   margin="normal" InputLabelProps={{ shrink: true,}} />
                        &&
                        <TextField label="Observations" value={props.mainInfos.feedback} name='feedback' type="text"
                                   onChange={handleForm} margin="normal" InputLabelProps={{ shrink: true, }}
                                   style={{margin: 8, marginRight: '50px', width: '250px', marginTop: '50px'}} />
                        && props.mainInfos.competitionType===CompetitionCreateCompetitionTypeEnum.CX ?
                            <TextField label="Aboyeur" value={props.mainInfos.aboyeur} InputLabelProps={{shrink: true,}}
                                       name='aboyeur' type="text" onChange={handleForm} margin="normal" placeholder="Prénom NOM"
                                       style={{ margin: 8, marginRight: '50px', width: '200px', marginTop: '50px' }} />
                            : null
                        : null
                }
            </div>
            <div style={{ display: 'block', marginTop: '50px' }}>
                <FormControlLabel control={ <Checkbox checked={props.mainInfos.isOpenedToOtherFede}
                                                     onChange={handleChangeBox}
                                                     name="isOpenedToOtherFede"
                                                     color="primary" /> }
                                  label="Ouvert aux licenciés des autres fédérations" />
                <FormControlLabel control={ <Checkbox checked={props.mainInfos.isOpenedToNL}
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