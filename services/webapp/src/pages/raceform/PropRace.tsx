
import { TextField, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, createStyles, makeStyles, Theme, Tooltip, TableContainer } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import React, { useState, useEffect, useContext } from 'react';
import { SubmitHandler, useForm, } from "react-hook-form";
import { ButtonBase } from '@material-ui/core';
import { NotificationContext } from 'components/CadSnackbar';
import { CompetitionInfo } from 'sdk';


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


interface RaceProps {
  delete: any
  races: any
  value: any
  edit: any
}

const PropRace = (props: RaceProps) => {

  const [, setNotification] = useContext(NotificationContext);
  const [tab, setTab] = useState<CompetitionInfo[]>([props.value]);
  const classes = useStyles();
  const [i, setI] = useState<number>();
  const [propRaceError, setPropRaceError] = useState<boolean>(false);
  const { register, handleSubmit, setValue, getValues } = useForm<CompetitionInfo>();

  const onSubmit: SubmitHandler<CompetitionInfo> = (data) => {
      if(data.course==="" || data.horaireEngagement==="" || data.horaireDepart==="" || data.info1==="" || data.info2==="" || data.info3===""){
        setPropRaceError(true); 
        setNotification({
          message: `tous les champs doivent être renseignées. Possibilité de mettre NC (non communiqué).`,
          open: true,
          type: 'error'
        });
      }
      else{
        setPropRaceError(false); 
        props.races(data);
      }
  }
  
  const onEdit = ((event: any): any => {
   
    setValue("course", tab[event.currentTarget.value].course);
    setValue("info2", tab[event.currentTarget.value].info2);
    setValue("horaireDepart", tab[event.currentTarget.value].horaireDepart);
    setValue("horaireEngagement", tab[event.currentTarget.value].horaireEngagement);
    setValue("info3", tab[event.currentTarget.value].info3);
    setValue("info1", tab[event.currentTarget.value].info1);
    setI(event.currentTarget.value);
    
 
  })

  const onUpdate = ((event: any): void => {
    const tampons=tab[event.currentTarget.value];
    tab[event.currentTarget.value] = getValues(["course", "horaireEngagement", "horaireDepart", "info1", "info2", "info3"]);
    if(tab[event.currentTarget.value].course==="" || tab[event.currentTarget.value].horaireEngagement==="" || tab[event.currentTarget.value].horaireDepart==="" || tab[event.currentTarget.value].info1==="" || tab[event.currentTarget.value].info2==="" || tab[event.currentTarget.value].info3===""){
      setPropRaceError(true); 
      setNotification({
        message: `tous les champs doivent être renseignées. Possibilité de mettre NC (non communiqué).`,
        open: true,
        type: 'error'
      });
      if(tampons){
      tab[event.currentTarget.value].course=tampons.course;
      tab[event.currentTarget.value].horaireDepart=tampons.horaireDepart;
      tab[event.currentTarget.value].horaireEngagement=tampons.horaireEngagement;
      tab[event.currentTarget.value].info1=tampons.info1;
      tab[event.currentTarget.value].info2=tampons.info2;
      tab[event.currentTarget.value].info3=tampons.info3;
      }
    }
    else{
    
    setPropRaceError(false);
    props.edit(tab)

  }
});

  const onDelete = ((event: any): void => { props.delete(event.currentTarget.value); });

  const TableGen = (): any => {
    return (
      <TableBody>
        {tab.map((row: any, index: any) =>
          (
            <TableRow key={index}>
              <TableCell scope="row" align="center" style={{ columnWidth: '25%', border: '1px solid black' }}>
                {row.course}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.horaireEngagement}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.horaireDepart}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.info1}
              </TableCell>
              <TableCell align="center" style={{ width: '10%', border: '1px solid black' }}>{row.info2}
              </TableCell>
              <TableCell align="center" style={{ width: '25%', border: '1px solid black' }}>{row.info3}
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
          error={propRaceError}
          className={classes.textField}
          name="course"
          inputRef={register()}
          label="Catégorie/Epreuve"
          placeholder=""
          inputProps={{ 'name': 'course', 'ref': { register } }}
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          error={propRaceError}
          className={classes.textField}
          name="horaireEngagement"
          inputRef={register()}
          label="Heure Dossard/Inscription"
          placeholder="ex : 14h"
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          error={propRaceError}
          className={classes.textField}
          inputRef={register()}
          name="horaireDepart"
          label="Heure départ"
          placeholder="ex : 15h"
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>
      <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
        <TextField
          error={propRaceError}
          className={classes.textField}
          name="info1"
          inputRef={register()}
          label="Tour/Distance"
          placeholder="ex : 5 ou 125kms"
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          error={propRaceError}
          className={classes.textField}
          name="info2"
          inputRef={register()}
          label="Kms/Dénivelé"
          placeholder="ex: 7,5km ou 1550mD+"
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          error={propRaceError===true}
          className={classes.textField}
          name="info3"
          inputRef={register()}
          label="Lien OpenRunner"
          style={{
            margin: 8,
            marginRight: '150px',
            width: '250px'
          }}
          placeholder="https:/www.lienOpenrunner.com"
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