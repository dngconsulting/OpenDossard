import { Button, ButtonBase, createStyles, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Theme, Tooltip } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubmitHandler, useForm,} from "react-hook-form";


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 200,
      },
      table: {
        minWidth: 650,
      },
    }
  ));
interface Iprices {
    tarif : string;
    montant : string;
  }
  interface PriceProps {
    delete: any
    prices: any
    value: any
    edit : any
  }
const PriceRace =(props : PriceProps) =>{

const [prices, setPrices]=useState([props.value]);
const [i,setI] = useState();
const classes = useStyles();
useEffect(
    () => {
      
      setPrices(props.value);
  
      
    },[props.value]
  );
const { register, handleSubmit, watch, errors,setValue,getValues } = useForm<Iprices>();
const onSubmit: SubmitHandler<Iprices> = (data) => { console.log(JSON.stringify(data)); props.prices(data);  };
const onEdit = ((event : any) : any => {
    setValue("tarif",prices[event.currentTarget.value].tarif);
    setValue("montant",prices[event.currentTarget.value].montant);
   
    setI(event.currentTarget.value)
  })

  const onUpdate = ((event : any) : void => {
    console.log(event.currentTarget.value);
    prices[event.currentTarget.value]=getValues(["tarif","montant"]);
  
    console.log(prices[event.currentTarget.value])
    props.edit(prices)

  });

  const onDelete = ((event: any): void => { props.delete(event.currentTarget.value);console.log(event.currentTarget.value) });

const TableGen = ():any => { return(
    <TableBody>
      {prices.map((row: any,index: any)=>
        (
        <TableRow key={index}>
          <TableCell scope="row">
            {row.tarif}
          </TableCell>
          <TableCell align="right">{row.montant}
          </TableCell>
          <TableCell align="right">
            <Tooltip title='Modifier le tarif'>
            <ButtonBase value={index} onClick={onEdit}>
              <EditRounded fontSize={'small'} 
              />
              </ButtonBase>
            </Tooltip>
          </TableCell>
          <TableCell align="right" size="small">
            <Tooltip title='Supprimer définitivement ce tarif'>
              <ButtonBase value={index} onClick={onDelete}>
                <Delete fontSize={'small'}/>
              </ButtonBase>
            </Tooltip>
          </TableCell>
        </TableRow>
  ))}</TableBody>)}
return(
<div>
<form onSubmit={handleSubmit(onSubmit)}>
        
          <TextField
            name="tarif"
            
            inputRef={register({ required: true })}
            label="Nom du tarif"
            style={{
              margin: 8,
              position: 'relative',
              left: '2.49%',
              width: '200px'

            }}
            placeholder=""
            //helperText="Full width!"
            //fullWidth

            inputProps={{ 'name': 'tarif','ref': {register} }}
            InputLabelProps={{
              shrink: true,
            }}
          />
            {/* {errors.epreuve && <p>Le nom de la catégorie est obligatoire</p>} */}
          <TextField
            name="montant"
            inputRef={register}
            label="Montant"
            style={{
              margin: 8, width: 200, position: 'relative',
              left: '10.88%',
            }}
            placeholder=""
            //helperText="Full width!"
            //fullWidth
            inputProps={{ 'name': 'montant','ref': {register} }}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
         
          <Button style={{ position: 'relative', width: '206px' }} value={i} variant={'contained'}  onClick={onUpdate} color={'primary'}>Sauvegarder</Button>
          <TableContainer component={Paper}>
          <Table className={classes.table} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell align="right">Tarif</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
         
                <TableGen/>
            
                </Table>
                </TableContainer> 
                <Button type='submit' onSubmit={handleSubmit(onsubmit)} style={{ position: 'relative', width: '206px' }} variant={'contained'} color={'primary'} >Ajouter</Button>
                </form>
</div>);
}
export default PriceRace;