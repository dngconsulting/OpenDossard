
import { TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, createStyles, makeStyles, Theme, Tooltip, TableContainer } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import React, { useState, useEffect } from 'react';
import { SubmitHandler, useForm, } from "react-hook-form";
import { ButtonBase } from '@material-ui/core';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      margin: 8,
      width: '200px',
      marginRight: '150px'
    },
    table: {
      margin: 50,
      marginRight: 'auto',
      marginLeft: 'auto',
      tableLayout: 'auto',
      width: '100%',
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
  edit: any
}

const PropRace = (props: RaceProps) => {

  const [tab, setTab] = useState([props.value]);
  const classes = useStyles();
  const [i, setI] = useState();
  const { register, handleSubmit, errors, setValue, getValues } = useForm<Iraces>();
  const onSubmit: SubmitHandler<Iraces> = (data) => { console.log(JSON.stringify(data)); props.races(data); };

  const onEdit = ((event: any): any => {
    setValue("epreuve", tab[event.currentTarget.value].epreuve);
    setValue("distance", tab[event.currentTarget.value].distance);
    setValue("depart", tab[event.currentTarget.value].depart);
    setValue("dossard", tab[event.currentTarget.value].dossard);
    setValue("link", tab[event.currentTarget.value].link);
    setValue("deniv", tab[event.currentTarget.value].deniv);
    setI(event.currentTarget.value)
  })

  const onUpdate = ((event: any): void => {

    tab[event.currentTarget.value] = getValues(["epreuve", "dossard", "depart", "distance", "deniv", "link"]);
    props.edit(tab)

  });

  const onDelete = ((event: any): void => { props.delete(event.currentTarget.value); });

  const TableGen = (): any => {
    return (
      <TableBody>
        {tab.map((row: any, index: any) =>
          (
            <TableRow key={index}>
              <TableCell scope="row" align="center" style={{ columnWidth: '25%', border: '1px solid black' }}>
                {row.epreuve}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.dossard}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.depart}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.distance}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.deniv}
              </TableCell>
              <TableCell align="center" style={{ width: '25%', border: '1px solid black' }}>{row.link}
              </TableCell>
              <TableCell align="center" style={{ width: '5%', border: '1px solid black' }}>
                <Tooltip title='Modifier cette catégorie'>
                  <ButtonBase value={index} onClick={onEdit}>
                    <EditRounded
                    />
                  </ButtonBase>
                </Tooltip>
              </TableCell>
              <TableCell align="center" style={{ width: '5%', border: '1px solid black', paddingLeft: '16px' }}>
                <Tooltip title='Supprimer définitivement cette catégorie'>
                  <ButtonBase value={index} onClick={onDelete}>
                    <Delete />
                  </ButtonBase>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}</TableBody>)
  }



  useEffect(
    () => {

      setTab(props.value);


    }, [props.value]
  );


  return (
    <div>
      <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
        <TextField
          className={classes.textField}
          name="epreuve"
          inputRef={register({ required: true })}
          label="Catégorie/Epreuve"
          placeholder=""
          inputProps={{ 'name': 'epreuve', 'ref': { register } }}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
           className={classes.textField}
          name="dossard"
          inputRef={register}
          label="Heure Dossard/Inscription"
          placeholder=""
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
        className={classes.textField}
          name="depart"
          inputRef={register}
          label="Heure Départ"
          placeholder=""
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>
      <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
        <TextField
        className={classes.textField}
          name="distance"
          inputRef={register}
          label="Tour/Distance"
          placeholder=""
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
        className={classes.textField}
          name="deniv"
          inputRef={register}
          label="Kms/Dénivelé"
          placeholder=""
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
        className={classes.textField}
          name="link"
          inputRef={register}
          label="Lien OpenRunner"
          style={{
            margin: 8,
            marginRight: '150px',
            width: '200px'
          }}
          placeholder=""
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>
      <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px', marginTop: '30px' }} variant={'contained'} value={i} color={'primary'} onClick={onUpdate}>Sauvegarder</Button>
      <TableContainer component={Paper}>
        <Table className={classes.table} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell align="center" style={{ width: '25%', border: '1px solid black' }}>Epreuve</TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Heure Dossard</TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Heure Départ</TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Tour Distance</TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>Kms/Dénivelé</TableCell>
              <TableCell align="center" style={{ width: '25%', border: '1px solid black' }}>Lien OpenRunner</TableCell>
              <TableCell align="center" style={{ width: '5%', border: '1px solid black' }}></TableCell>
              <TableCell align="center" style={{ width: '5%', border: '1px solid black' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableGen />
        </Table>
      </TableContainer>
      <Button onClick={handleSubmit(onSubmit)} style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px' }} variant={'contained'} color={'primary'} >Ajouter Epreuve</Button>
    </div>
  )
}

export default PropRace;