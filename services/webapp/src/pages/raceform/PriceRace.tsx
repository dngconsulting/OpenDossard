import { Button, ButtonBase, createStyles, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Theme, Tooltip } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import { NotificationContext } from 'components/CadSnackbar';
import React, { useState, useEffect, useContext } from 'react';
import { SubmitHandler, useForm, } from "react-hook-form";
import { PricingInfo } from 'sdk';


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
      width: '80%',
    },
  }
  ));

interface PriceProps {
  delete: any
  prices: any
  value: any
  edit: any
}
const PriceRace = (props: PriceProps) => {

  const [, setNotification] = useContext(NotificationContext);
  const [prices, setPrices] = useState<PricingInfo[]>([props.value]);
  const [i, setI] = useState<number>();
  const [propRaceError, setPropRaceError] = useState<boolean>(false);
  const classes = useStyles();
  useEffect(
    () => {

      setPrices(props.value);


    }, [props.value]
  );
  const { register, handleSubmit, setValue, getValues } = useForm<PricingInfo>();
  const onSubmit: SubmitHandler<PricingInfo> = (data) => {
    if (String(data.tarif)==="" || data.name === "") {
      setPropRaceError(true);
      setNotification({
        message: `tous les champs doivent être renseignées. Possibilité de mettre NC (non communiqué).`,
        open: true,
        type: 'error'
      });
    }
    else {
      setPropRaceError(false);
      props.prices(data);
    }
    console.log(JSON.stringify(data));
  };

  const onEdit = ((event: any): any => {
    setValue("tarif", prices[event.currentTarget.value].tarif);
    setValue("name", prices[event.currentTarget.value].name);
    setI(event.currentTarget.value);
  })

  const onUpdate = ((event: any): void => {
    const tampons=prices[event.currentTarget.value];//recuperation avant erreur
    prices[event.currentTarget.value] = getValues(["name", "tarif"]);

    if (String(prices[event.currentTarget.value].tarif) === "" || prices[event.currentTarget.value].name === "" ) {
      setPropRaceError(true);
      setNotification({
        message: `tous les champs doivent être renseignées. Possibilité de mettre NC (non communiqué).`,
        open: true,
        type: 'error'
      });
      if(tampons){
      prices[event.currentTarget.value].name=tampons.name;
      prices[event.currentTarget.value].tarif=tampons.tarif;
      }
    }
    else {
      setPropRaceError(false);
      props.edit(prices);
    }
  });
    

  

  const onDelete = ((event: any): void => { props.delete(event.currentTarget.value); console.log(event.currentTarget.value) });

  const TableGen = (): any => {
    return (
      <TableBody>
        {prices.map((row: any, index: any) =>
          (
            <TableRow key={index}>
              <TableCell scope="row" align="center" style={{ columnWidth: '35%', border: '1px solid black' }}>
                {row.name}
              </TableCell>
              <TableCell align="center" style={{ columnWidth: '35%', border: '1px solid black' }}>{row.tarif}
              </TableCell>
              <TableCell align="center" style={{ columnWidth: '5%', border: '1px solid black' }}>
                <Tooltip title='Modifier le tarif'>
                  <ButtonBase value={index} onClick={onEdit}>
                    <EditRounded fontSize={'default'}
                    />
                  </ButtonBase>
                </Tooltip>
              </TableCell>
              <TableCell align="center" style={{ columnWidth: '5%', border: '1px solid black', paddingLeft: '16px' }}>
                <Tooltip title='Supprimer définitivement ce tarif'>
                  <ButtonBase value={index} onClick={onDelete}>
                    <Delete fontSize={'default'} />
                  </ButtonBase>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}</TableBody>)
  }
  return (
    <div>

      <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
        <TextField
          error={propRaceError}
          // helperText={propRaceError && "champs requis"}
          className={classes.textField}
          name="name"
          inputRef={register()}
          label="Nom du tarif"
          placeholder="ex : FSGT"
          inputProps={{ 'name': 'name', 'ref': { register } }}
          InputLabelProps={{
            shrink: true,
          }}
        />
        {/* {errors.epreuve && <p>Le nom de la catégorie est obligatoire</p>} */}
        <TextField
          error={propRaceError}
          // helperText={propRaceError && "champs requis"}
          className={classes.textField}
          name="tarif"
          inputRef={register}
          label="Montant"
          placeholder="ex : 7€"
          inputProps={{ 'name': 'tarif', 'ref': { register } }}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          onInput={(e: any) => { e.target.value = e.target.value.replace(/[^0-9]/g, '') }}
        />
      </div>
      <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px', marginTop: '30px' }} value={i} variant={'contained'} onClick={onUpdate} color={'primary'}>Sauvegarder</Button>
      <TableContainer component={Paper}>
        <Table className={classes.table} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell align="center" style={{ width: '35%', border: '1px solid black' }}>Tarif</TableCell>
              <TableCell align="center" style={{ width: '35%', border: '1px solid black' }}>Montant</TableCell>
              <TableCell align="center" style={{ width: '5%', border: '1px solid black' }}></TableCell>
              <TableCell align="center" style={{ width: '5%', border: '1px solid black' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableGen />
        </Table>
      </TableContainer>
      <Button onClick={handleSubmit(onSubmit)} style={{ display: 'block', width: '206px', marginLeft: 'auto', marginRight: 'auto' }} variant={'contained'} color={'primary'} >Ajouter</Button>
    </div>
  );
}
export default PriceRace;