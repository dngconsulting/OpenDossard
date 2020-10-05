import classes from '*.module.css';
import { TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, createStyles, makeStyles, Theme } from '@material-ui/core';
import Editor from 'components/Editor';
import { type } from 'os';
import React, { useState, useEffect } from 'react';


interface InfoRaceProps {

}
const useStyles = makeStyles((theme: Theme) =>
createStyles({

    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
        position: 'relative',
        width: '126.56px',
        height: '20px',
        left: '774.59px',
        top: '-68px'
    },
    formControl1: {
        margin: theme.spacing(1),
        minWidth: 120,
        position: 'relative',
        width: '126.56px',
        height: '20px',
        left: '875px',
        top: '-68px'
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
    root: {
        '& > *': {
            margin: theme.spacing(1),
            width: '25ch',
        },
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        width: '200',
        position: 'relative',
        left: '23%',
        right: '6%',
        top: '-7px',

    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 200,
    },
    table: {
        minWidth: 650,
    },
}),
);

const InfoRace = (props: InfoRaceProps) => {
    const [type, setType] = useState("");
    const [fede, setFede] = useState("");
    const [obs, setObs] = useState("");
    const [check, setCheck] = React.useState({
        checkedA: true,
        checkedB: true,
    })
    const handleChangeBox = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCheck({ ...check, [event.target.name]: event.target.checked });
    };
    const getObs = (value: any): void => { setObs(value); console.log(value) };


    const classes = useStyles();
    return (
        <div>
            <div>
                <TextField

                    label="Nom de l'épreuve"
                    style={{
                        margin: 8, width: 200, position: 'relative',
                        left: '2.49%',
                        right: '86.61%',
                        top: '50px',
                    }}
                    placeholder=""
                    //helperText="Full width!"
                    //fullWidth
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />

                <form className={classes.container} noValidate>
                    <TextField
                        id="datetime-local"
                        label="Date et heure de l'épreuve"
                        type="datetime-local"
                        defaultValue="2020-09-24T10:30"
                        //className={classes.textField}
                        InputLabelProps={{
                            shrink: true,
                        }} />
                </form>

                <FormControl className={classes.formControl}>
                    <InputLabel id="type-epreuve">TYPE</InputLabel>
                    <Select
                        labelId="type-select-label"
                        id="type-select"
                        value={type}
                        onChange={(e: React.ChangeEvent<{ value: unknown; }>) => { setType(e.target.value as string); }}
                    >
                        <MenuItem value={'CX'}>CX</MenuItem>
                        <MenuItem value={'ROUTE'}>ROUTE</MenuItem>
                        <MenuItem value={'VTT'}>VTT</MenuItem>
                        <MenuItem value={'AUTRES'}>AUTRES</MenuItem>
                    </Select>
                </FormControl>
                <FormControl className={classes.formControl1}>
                    <InputLabel id="federation-epreuve">Fédération</InputLabel>
                    <Select
                        labelId="federation-select-label"
                        id="federation-select"
                        value={fede}
                        onChange={(e: React.ChangeEvent<{ value: unknown; }>) => { setFede(e.target.value as string); }}
                    >
                        <MenuItem value={'FSGT'}>FSGT</MenuItem>
                        <MenuItem value={'UFOLEP'}>UFOLEP</MenuItem>
                        <MenuItem value={'FFC'}>FFC</MenuItem>
                        <MenuItem value={'CYCLOS'}>CYCLOS</MenuItem>
                        <MenuItem value={'FFVELO'}>FFVELO</MenuItem>
                        <MenuItem value={'NL'}>NL</MenuItem>
                        <MenuItem value={'FFTRI'}>FFTRI</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <div>
                <TextField

                    label="Longueur circuit"
                    style={{
                        margin: 8,
                        position: 'relative',
                        left: '2.49%',
                        width: '200px'
                    }}
                    placeholder=""
                    //helperText="Full width!"
                    //fullWidth
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />

                <TextField

                    label="Commune"
                    style={{
                        margin: 8, width: 200, position: 'relative',
                        left: '10.88%',
                    }}
                    placeholder=""
                    //helperText="Full width!"
                    //fullWidth
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />
                <TextField

                    label="Profil"
                    style={{
                        margin: 8, width: 200, position: 'relative',
                        left: '19%',

                        top: '98',
                    }}
                    placeholder=""
                    //helperText="Full width!"
                    //fullWidth
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }} />


            </div>
            <div style={{ position: 'relative', top: '50px', left: '80px' }}>
                <FormControlLabel
                    //style={{left : '33px',width:'367.77px', top :'310px', height:'28px'}}
                    control={<Checkbox

                        checked={check.checkedA}
                        onChange={handleChangeBox}
                        name="checkedA"
                        color="primary" />}
                    label="Ouvert aux licenciés des autres fédérations" />

                <FormControlLabel
                    style={{ left: '80px', position: 'relative' }}
                    control={<Checkbox
                        checked={check.checkedB}
                        onChange={handleChangeBox}
                        name="checkedB"
                        color="primary" />}
                    label="Ouvert aux non licenciés" />
            </div>


            <div style={{ width: '1092px', height: '520px', top: '80px', left: '80px', position: 'relative' }}>
                <Editor data={getObs} />
            </div>
        </div>
    )
}

export default InfoRace;