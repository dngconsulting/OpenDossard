
import { TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, createStyles, makeStyles, Theme, FormHelperText, } from '@material-ui/core';
import Editor from 'components/Editor';
import moment from 'moment';
import  { IOptionType } from 'pages/licence/ClubSelect';
import React from 'react';
import {  CompetitionCreateCompetitionTypeEnum,} from 'sdk';
import { FedeEnum } from 'sdk/models/FedeEnum';
import ClubSelectRace from './ClubSelectRace';


interface InfoRaceProps {
    value: any;
    info: any;
    error: any;
    validateError: boolean; 
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

const InfoRace = (props: InfoRaceProps) => {
    
    const date : string = moment(props.value.eventDate).format("YYYY-MM-DDTHH:mm");
   
    const handleChangeBox = (event: React.ChangeEvent<HTMLInputElement>) => {

        props.info({ ...props.value, [event.target.name]: event.target.checked });

    };
    const getObs = (data: any): void => {props.info({ ...props.value, observations: String(data) }) };
    
    const handleFormDate = (event: any) => {


        props.info({ ...props.value, [event.currentTarget.name]: moment(event.currentTarget.value, "YYYY-MM-DD HH:mm:ssZZ")});
    }
    const handleForm = (event: any) => {


        props.info({ ...props.value, [event.currentTarget.name]: event.currentTarget.value });
    }
    const handleSelect = (event: any) => {

        props.info({ ...props.value, [event.target.name]: event.currentTarget.dataset.value });
        
    }
    const handleSelectFede = (event: any) => {

        
        
        if(event.currentTarget.dataset.value===FedeEnum.FSGT){
            props.info({ ...props.value, [event.target.name]: event.currentTarget.dataset.value, races : ['2,3,4,5']});
         }
         else{
            props.info({ ...props.value, [event.target.name]: event.currentTarget.dataset.value, races : ['Toutes']  });
         }
         
    }
    const onSelectClub = (value: number) => {
        props.info({ ...props.value, club: value });
    };


    const classes = useStyles();
    return (
        <div >
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField
                    required
                    error={props.validateError === true && props.value.name === ""}
                    helperText={(props.validateError === true && props.value.name === ""&& "le nom de l'épreuve doit être renseigné")}
                    value={props.value.name}
                    type='text'
                    name="name"
                    onChange={handleForm}
                    label="Nom de l'épreuve"
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    placeholder=""
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />
                <TextField
                    error={props.validateError === true && props.value.eventDate === null}
                    helperText={(props.validateError === true && "la date de l'épreuve doit être renseignée"&& props.value.eventDate === null)}
                    className={classes.container}
                    required
                    name="eventDate"
                    onChange={handleFormDate}
                    id="datetime-local"
                    label="Date et heure de l'épreuve"
                    type="datetime-local"
                    
                    value={date}
                    InputLabelProps={{
                        shrink: true,
                    }} />

                <FormControl className={classes.formControl} required error={props.validateError === true && props.value.competitionType === null}>
                    <InputLabel id="type-epreuve">TYPE</InputLabel>
                    <Select
                        inputProps={{ name: 'competitionType' }}
                        labelId="type-select-label"
                        id="type-select"
                        onChange={handleSelect}
                        value={props.value.competitionType || ''}
                    >
                        <MenuItem value={CompetitionCreateCompetitionTypeEnum.CX}>CX</MenuItem>
                        <MenuItem value={CompetitionCreateCompetitionTypeEnum.ROUTE}>ROUTE</MenuItem>
                        <MenuItem value={CompetitionCreateCompetitionTypeEnum.VTT}>VTT</MenuItem>
                        <MenuItem value={CompetitionCreateCompetitionTypeEnum.AUTRE}>AUTRES</MenuItem>
                    </Select>
                    {(props.validateError&&  props.value.competitionType === null && <FormHelperText>Le type de l'épreuve doit être renseigné</FormHelperText>)}
                </FormControl>
                <FormControl className={classes.formControl} required error={props.validateError === true && props.value.fede === null}>
                    <InputLabel id="federation-epreuve">Fédération</InputLabel>
                    <Select
                        inputProps={{ name: "fede" }}
                        labelId="federation-select-label"
                        id="federation-select"
                        onChange={handleSelectFede}
                        value={props.value.fede || ""}
                    >
                        <MenuItem value={FedeEnum.FSGT}>FSGT</MenuItem>
                        <MenuItem value={FedeEnum.UFOLEP}>UFOLEP</MenuItem>
                        <MenuItem value={FedeEnum.FFC}>FFC</MenuItem>
                        <MenuItem value={FedeEnum.CYCLOS}>CYCLOS</MenuItem>
                        <MenuItem value={FedeEnum.FFVELO}>FFVELO</MenuItem>
                        <MenuItem value={FedeEnum.FFTRI}>FFTRI</MenuItem>
                        <MenuItem value={FedeEnum.NL}>NL</MenuItem>
                    </Select>
                    {(props.validateError === true && props.value.fede === null && <FormHelperText>La fédération de l'épreuve doit être renseignée</FormHelperText>)}
                </FormControl>
            </div>
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField
                    name='longueurCircuit'
                    label="Longueur circuit"
                    type="text"
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    value={props.value.longueurCircuit}
                    onChange={handleForm}
                    placeholder=""
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />

                <TextField
                    required
                    error={props.validateError === true && props.value.zipCode === "" || props.error[4]===true}
                    helperText={(props.validateError === true && "le code postal doit être renseigné en 5 chiffres") || props.error[4]&& "le code postal doit être renseigné en 5 chiffres"}
                    onChange={handleForm}
                    name='zipCode'
                    label="Code Postal"
                    value={props.value.zipCode}
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    placeholder="ex : 31000"
                    margin="normal"
                    inputProps={{
                        type: "text",
                        maxLength: 5

                    }}
                    onInput={(e: any) => { e.target.value = e.target.value.replace(/[^0-9]/g, '') }}
                    InputLabelProps={{
                        shrink: true,
                    }} />
                <FormControl className={classes.formControl}>
                    <InputLabel>Profil</InputLabel>
                    <Select
                        labelId="profil-select-label"
                        id="profil-select"
                        value={props.value.info}
                        onChange={handleSelect}
                        inputProps={{ name: 'info' }}
                       
                    >
                        <MenuItem value={'Valloné'}>VALLONE</MenuItem>
                        <MenuItem value={'Montagne'}>MONTAGNEUX</MenuItem>
                        <MenuItem value={'Circuit Plat'}>PLAT</MenuItem>
                        <MenuItem value={'Moy-Montagne'}>MOY-MONTAGNE</MenuItem>
                        <MenuItem value={'NC'}>NC</MenuItem>
                    </Select>
                </FormControl>
                {props.value.fede && props.value.fede !== FedeEnum.NL &&
                    <div style={{ width: '400px', marginTop: '47px', display: 'inline-block' }}>
                        <ClubSelectRace clubError={props.validateError} dept="" fede={props.value.fede} onSelect={onSelectClub}  chosenClub={{ value: props.value.club, label:''  } as IOptionType} />
                    </div>}
            </div>
            <div>
                <TextField
                    name='contactName'
                    type="text"
                    onChange={handleForm}
                    label="Nom contact"
                    value={props.value.contactName}
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    placeholder="Prénom NOM"
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />
                <TextField
                    error={props.error[0]}
                    helperText={props.error[0] && "le numéro de téléphone doit comporter 10 chiffres"}
                    name='contactPhone'
                    value={props.value.contactPhone}
                    onChange={handleForm}
                    label="Téléphone Contact"
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    placeholder="ex : 0695085349"
                    margin="normal"
                    inputProps={{

                        type: 'tel',
                        maxLength: 10,

                    }}
                    onInput={(e: any) => { e.target.value = e.target.value.replace(/[^0-9]/g, '') }}
                    InputLabelProps={{
                        shrink: true,
                    }} />
                <TextField
                    error={props.error[3]}
                    helperText={props.error[3] === true && "l'email n'est pas au bon format xyz@mail.com'"}
                    name='contactEmail'
                    value={props.value.contactEmail}
                    type="email"
                    onChange={handleForm}
                    label="E-mail Contact"
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    placeholder="ex : personne@mail.com"
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    error={props.error[1] === true}
                    helperText={props.error[1] === true && "le nom du site doit commencer par https"}
                    name='facebook'
                    value={props.value.facebook}
                    type="url"
                    onChange={handleForm}
                    label="Lien Facebook"
                    style={{
                        margin: 8,
                        width: '250px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    placeholder="ex : https://www.monfacebook.fr"
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    error={props.error[2] == true}
                    helperText={props.error[2] === true && "le nom du site doit commencer par https"}
                    name='siteweb'
                    value={props.value.siteweb}
                    type="url"
                    onChange={handleForm}
                    label="Site web"
                    style={{
                        margin: 8,
                        width: '250px',
                        marginTop: '50px'
                    }}
                    placeholder="ex : https://www.monsite.fr"
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                </div>
                <div>
                 {props.value.id&&<TextField
                    name='commissaires'
                    value={props.value.commissaires}
                    type="text"
                    onChange={handleForm}
                    label="Commissaires"
                    style={{
                        margin: 8,
                        marginRight: '50px',
                        width: '200px',
                        marginTop: '50px'
                    }}
                    placeholder="Prénom NOM"
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />}
                 {props.value.id&&props.value.competitionType===CompetitionCreateCompetitionTypeEnum.CX &&<TextField
                    name='aboyeur'
                    value={props.value.aboyeur}
                    type="text"
                    onChange={handleForm}
                    label="Aboyeur"
                    style={{
                        margin: 8,
                        marginRight: '50px',
                        width: '200px',
                        marginTop: '50px'
                    }}
                    placeholder="Prénom NOM"
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />}
                {props.value.id&&<TextField
                    name='speaker'
                    value={props.value.speaker}
                    type="text"
                    onChange={handleForm}
                    label="Speaker"
                    style={{
                        margin: 8,
                        marginRight: '50px',
                        width: '200px',
                        marginTop: '50px'
                    }}
                    placeholder="Prénom NOM"
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />}
                 {props.value.id&&<TextField
                    name='feedback'
                    value={props.value.feedback}
                    type="text"
                    onChange={handleForm}
                    label="Observations"
                    style={{
                        margin: 8,
                        marginRight: '50px',
                        width: '250px',
                        marginTop: '50px'
                    }}
                    placeholder=""
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />}
            </div>
            <div style={{ display: 'block', marginTop: '50px' }}>
                <FormControlLabel
                    control={<Checkbox
                        checked={props.value.openedToOtherFede}
                        onChange={handleChangeBox}
                        name="openedToOtherFede"
                        color="primary" />}
                    label="Ouvert aux licenciés des autres fédérations" />
                <FormControlLabel
                    style={{ left: '80px', position: 'relative' }}
                    control={<Checkbox
                        checked={props.value.openedNL}
                        onChange={handleChangeBox}
                        name="openedNL"
                        color="primary" />}
                    label="Ouvert aux non licenciés" />
            </div>
            <div style={{ display: 'block', margin: 'auto' }}>
                <Editor data={getObs} edit={props.value.observations} />
            </div>
        </div>
    )
}
export default InfoRace;