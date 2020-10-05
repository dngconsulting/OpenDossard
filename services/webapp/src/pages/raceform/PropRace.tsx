
import { TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, createStyles, makeStyles, Theme, ListItem, Input, Tooltip, IconButton, TableContainer } from '@material-ui/core';
import { Delete, EditRounded, SettingsBackupRestore } from '@material-ui/icons';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubmitHandler, useForm,} from "react-hook-form";
import { ButtonBase } from '@material-ui/core';




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

interface Iraces {
  epreuve: string,
  dossard: string,
  depart: string,
  distance: string,
  deniv: string,
  link: string
}
interface RaceProps {
  delete: any
  races: any
  value: any
  edit : any
}

const PropRace = (props: RaceProps) => {
 
  const [tab, setTab] = useState([props.value]);
  const classes = useStyles();
  const [i,setI] = useState();
  const { register, handleSubmit, watch, errors,setValue,getValues } = useForm<Iraces>();
  const onSubmit: SubmitHandler<Iraces> = (data) => { console.log(JSON.stringify(data)); props.races(data);  };
  
  const onEdit = ((event : any) : any => {
    setValue("epreuve",tab[event.currentTarget.value].epreuve);
    setValue("distance",tab[event.currentTarget.value].distance);
    setValue("depart",tab[event.currentTarget.value].depart);
    setValue("dossard",tab[event.currentTarget.value].dossard);
    setValue("link",tab[event.currentTarget.value].link);
    setValue("deniv",tab[event.currentTarget.value].deniv);
    setI(event.currentTarget.value)
  })

  const onUpdate = ((event : any) : void => {
    console.log(event.currentTarget.value);
    tab[event.currentTarget.value]=getValues(["epreuve","dossard","depart","distance","deniv","link"]);
    console.log(tab[event.currentTarget.value])
    props.edit(tab)

  });
  const onDelete = ((event: any): void => { props.delete(event.currentTarget.value); });
  const TableGen = ():any => { return(
    <TableBody>
      {tab.map((row: any,index: any)=>
        (
        <TableRow key={index}>
          <TableCell scope="row">
            {row.epreuve}
          </TableCell>
          <TableCell align="right">{row.dossard}
          </TableCell>
          <TableCell align="right">{row.depart}
          </TableCell>
          <TableCell align="right">{row.distance}
          </TableCell>
          <TableCell align="right">{row.deniv}
          </TableCell>
          <TableCell align="right">{row.link}
          </TableCell>
          <TableCell align="right">
            <Tooltip title='Modifier cette catégorie'>
            <ButtonBase value={index} onClick={onEdit}>
              <EditRounded fontSize={'small'} 
              />
              </ButtonBase>
            </Tooltip>
          </TableCell>
          <TableCell align="right" size="small">
            <Tooltip title='Supprimer définitivement cette catégorie'>
              <ButtonBase value={index} onClick={onDelete}>
                <Delete fontSize={'small'}/>
              </ButtonBase>
            </Tooltip>
          </TableCell>
        </TableRow>
  ))}</TableBody>)}
      


  useEffect(
  () => {
    
    setTab(props.value);

    
  },[props.value]
);

  return (
    <div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <TextField
            name="epreuve"
            
            inputRef={register({ required: true })}
            label="Catégorie/Epreuve"
            style={{
              margin: 8,
              position: 'relative',
              left: '2.49%',
              width: '200px'

            }}
            placeholder=""
            //helperText="Full width!"
            //fullWidth

            inputProps={{ 'name': 'epreuve','ref': {register} }}
            InputLabelProps={{
              shrink: true,
            }}
          />
            {/* {errors.epreuve && <p>Le nom de la catégorie est obligatoire</p>} */}
          <TextField
            name="dossard"
            inputRef={register}
            label="Heure Dossard/Inscription"
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
            }}
          />
          <TextField
            name="depart"
            inputRef={register}
            label="Heure Départ"
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
            }}
          />
        </div>
        <div>
          <TextField
            name="distance"
            inputRef={register}
            label="Tour/Distance"
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
            }}
          />

          <TextField
            name="deniv"
            inputRef={register}
            label="Kms/Dénivelé"
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
            }}
          />
          <TextField
            name="link"
            inputRef={register}
            label="Lien OpenRunner"
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
            }}
          />
        </div>
       
        <Button style={{ position: 'relative', width: '206px' }} variant={'contained'} value={i} color={'primary'} onClick={onUpdate}>Sauvegarder</Button>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Epreuve</TableCell>
                <TableCell align="right">Heure Dossard</TableCell>
                <TableCell align="right">Heure Départ</TableCell>
                <TableCell align="right">Tour Distance</TableCell>
                <TableCell align="right">Kms/Dénivelé</TableCell>
                <TableCell align="right">Lien OpenRunner</TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
         
                <TableGen/>
            
                </Table>
                </TableContainer> 
                <Button type='submit' onSubmit={handleSubmit(onsubmit)} style={{ position: 'relative', width: '206px' }} variant={'contained'} color={'primary'} >Ajouter Epreuve</Button>
      </form>
    </div>
    )
}

export default PropRace;