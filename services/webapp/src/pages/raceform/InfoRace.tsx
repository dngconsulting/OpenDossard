
import { TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, createStyles, makeStyles, Theme } from '@material-ui/core';
import { InfoSharp } from '@material-ui/icons';
import Editor from 'components/Editor';
import ClubSelect, { IOptionType } from 'pages/licence/ClubSelect';
import React, { useState } from 'react';
import { CompetitionEntityCompetitionTypeEnum } from 'sdk';
import { FedeEnum } from 'sdk/models/FedeEnum';


interface InfoRaceProps {
    value: any;
    info: any;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({

        formControl: {
            margin: 8,
            width: '200px',
            marginRight: '50px',

        },
        formControl1: {
            margin: 8,
            width: '200px',
            marginTop: '50px',
            marginRight: '50px'
        },
        container: {
            margin: 8,
            width: '230px',
            marginRight: '50px'

        },

    }),
);

const InfoRace = (props: InfoRaceProps) => {
    const [idClub,setIdClub]=useState(0);
    // const [infos,setInfos]=useState({error: false,epreuve:"",club:"",longueur:"",commune:"",date:null,nameContact:"",emailContact:"",facebook:"",phoneContact:"",siteWeb:"",fede:null,profil:"",type:null,checkedA:false,checkedB:false,obs:""});
    // useEffect(
    //     () => {

    //       setInfos(props.value);


    //     },[props.value]
    //   );
    const handleChangeBox = (event: React.ChangeEvent<HTMLInputElement>) => {
        // setInfos({ ...infos, [event.currentTarget.name]: event.currentTarget.checked });
        props.info({ ...props.value, [event.target.name]: event.target.checked });

    };
    const getObs = (value: any): void => { props.info({ ...props.value, obs: value }) };
    const handleForm = (event: any) => {
        // setInfos({...infos,[event.currentTarget.name] : event.currentTarget.value});
        props.info({ ...props.value, [event.currentTarget.name]: event.currentTarget.value });
    }
    const handleSelect = (event: any) => {
        // setInfos({...infos,[event.currentTarget.name] : event.currentTarget.dataset.value});
        props.info({ ...props.value, [event.target.name]: event.currentTarget.dataset.value });
    }

    const onSelectClub = (value: string) => {
        props.info({ ...props.value, club: value });
    };
    const classes = useStyles();
    return (
        <div >
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField
                    required
                    error={props.value.error === true && props.value.epreuve === ""}
                    type='text'
                    name="epreuve"
                    onChange={handleForm}
                    label="Nom de l'épreuve"
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px'
                    }}
                    placeholder=""
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />
                <TextField
                    error={props.value.error === true && props.value.date === null}
                    className={classes.container}
                    required
                    name="date"
                    onChange={handleForm}
                    id="datetime-local"
                    label="Date et heure de l'épreuve"
                    type="datetime-local"
                    defaultValue="2020-09-24T10:30"
                    InputLabelProps={{
                        shrink: true,
                    }} />

                <FormControl className={classes.formControl} required>
                    <InputLabel id="type-epreuve">TYPE</InputLabel>
                    <Select
                        error={props.value.error === true && props.value.type === null}
                        inputProps={{ name: 'type' }}
                        labelId="type-select-label"
                        id="type-select"
                        onChange={handleSelect}
                        value={props.value.type || ''}
                    >
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.CX}>CX</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.ROUTE}>ROUTE</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.VTT}>VTT</MenuItem>
                        <MenuItem value={CompetitionEntityCompetitionTypeEnum.AUTRE}>AUTRES</MenuItem>
                    </Select>
                </FormControl>
                <FormControl className={classes.formControl} required>
                    <InputLabel id="federation-epreuve">Fédération</InputLabel>
                    <Select
                        error={props.value.error === true && props.value.fede === null}
                        inputProps={{ name: "fede" }}
                        labelId="federation-select-label"
                        id="federation-select"
                        onChange={handleSelect}
                        value={props.value.fede || ''}
                    >
                        <MenuItem value={FedeEnum.FSGT}>FSGT</MenuItem>
                        <MenuItem value={FedeEnum.UFOLEP}>UFOLEP</MenuItem>
                        <MenuItem value={FedeEnum.FFC}>FFC</MenuItem>
                        <MenuItem value={FedeEnum.CYCLOS}>CYCLOS</MenuItem>
                        <MenuItem value={FedeEnum.FFVELO}>FFVELO</MenuItem>
                        <MenuItem value={FedeEnum.FFTRI}>FFTRI</MenuItem>
                        <MenuItem value={FedeEnum.NL}>NL</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <TextField
                    name='longueur'
                    label="Longueur circuit"
                    type="text"
                    style={{
                        margin: 8,
                        width: '200px',
                        marginRight: '50px',
                        marginTop: '50px'
                    }}
                    onChange={handleForm}
                    placeholder=""
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />

                <TextField
                    onChange={handleForm}
                    name='commune'
                    type="text"
                    label="Code Postal"
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
                <FormControl className={classes.formControl1}>
                    <InputLabel>Profil</InputLabel>
                    <Select
                        labelId="profil-select-label"
                        id="profil-select"
                        value={props.value.profil}
                        onChange={handleSelect}
                        inputProps={{ name: 'profil' }}
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
                        <ClubSelect dept="" fede={props.value.fede} onSelect={onSelectClub} chosenClub={{value:null,label:props.value.club} as IOptionType}/>
                    </div>}
            </div>
            <div>
                <TextField
                    name='nameContact'
                    type="text"
                    onChange={handleForm}
                    label="Nom contact"
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
                    name='phoneContact'
                    type="tel"
                    onChange={handleForm}
                    label="Téléphone Contact"
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
                    name='emailContact'
                    type="email"
                    onChange={handleForm}
                    label="E-mail Contact"
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
                    }}
                />
                <TextField
                    name='facebook'
                    type="url"
                    onChange={handleForm}
                    label="Lien Facebook"
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
                    }}
                />
                <TextField
                    name='siteWeb'
                    type="url"
                    onChange={handleForm}
                    label="Site web"
                    style={{
                        margin: 8,
                        width: '200px',
                        marginTop: '50px'
                    }}
                    placeholder=""
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </div>
            <div style={{ display: 'block', marginTop: '50px' }}>
                <FormControlLabel
                    control={<Checkbox
                        checked={props.value.checkedA}
                        onChange={handleChangeBox}
                        name="checkedA"
                        color="primary" />}
                    label="Ouvert aux licenciés des autres fédérations" />
                <FormControlLabel
                    style={{ left: '80px', position: 'relative' }}
                    control={<Checkbox
                        checked={props.value.checkedB}
                        onChange={handleChangeBox}
                        name="checkedB"
                        color="primary" />}
                    label="Ouvert aux non licenciés" />
            </div>
            <div style={{ display: 'block', margin: 'auto' }}>
                <Editor data={getObs} />
            </div>
        </div>
    )
}
export default InfoRace;