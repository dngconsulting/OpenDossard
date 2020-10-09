import { Button, ButtonBase, createStyles, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Theme, Tooltip } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import React, { useState, useEffect } from 'react';
import { SubmitHandler, useForm, } from "react-hook-form";


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
interface Iprices {
  tarif: string;
  montant: string;
}
interface PriceProps {
  delete: any
  prices: any
  value: any
  edit: any
}
const PriceRace = (props: PriceProps) => {

  const [prices, setPrices] = useState([props.value]);
  const [i, setI] = useState();
  const classes = useStyles();
  useEffect(
    () => {

      setPrices(props.value);


    }, [props.value]
  );
  const { register, handleSubmit, watch, errors, setValue, getValues } = useForm<Iprices>();
  const onSubmit: SubmitHandler<Iprices> = (data) => { console.log(JSON.stringify(data)); props.prices(data); };
  const onEdit = ((event: any): any => {
    setValue("tarif", prices[event.currentTarget.value].tarif);
    setValue("montant", prices[event.currentTarget.value].montant);

    setI(event.currentTarget.value)
  })

  const onUpdate = ((event: any): void => {

    prices[event.currentTarget.value] = getValues(["tarif", "montant"]);
    props.edit(prices)

  });

  const onDelete = ((event: any): void => { props.delete(event.currentTarget.value); console.log(event.currentTarget.value) });

  const TableGen = (): any => {
    return (
      <TableBody>
        {prices.map((row: any, index: any) =>
          (
            <TableRow key={index}>
              <TableCell scope="row" align="center" style={{ columnWidth: '35%', border: '1px solid black' }}>
                {row.tarif}
              </TableCell>
              <TableCell align="center" style={{ columnWidth: '35%', border: '1px solid black' }}>{row.montant}
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
          className={classes.textField}
          name="tarif"
          inputRef={register({ required: true })}
          label="Nom du tarif"
          placeholder=""
          inputProps={{ 'name': 'tarif', 'ref': { register } }}
          InputLabelProps={{
            shrink: true,
          }}
        />
        {/* {errors.epreuve && <p>Le nom de la catégorie est obligatoire</p>} */}
        <TextField
          className={classes.textField}
          name="montant"
          inputRef={register}
          label="Montant"
          placeholder=""
          inputProps={{ 'name': 'montant', 'ref': { register } }}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
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