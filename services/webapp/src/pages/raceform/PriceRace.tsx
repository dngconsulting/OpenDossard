import { Button, ButtonBase, createStyles, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Theme, Tooltip } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import { NotificationContext } from 'components/CadSnackbar';
import React, { useState, useEffect, useContext } from 'react';
import { SubmitHandler, useForm, } from "react-hook-form";
import { PricingInfo } from 'sdk';

const useStyles = makeStyles(() =>
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
  })
);

interface IError {
  name: boolean;
  tarif: boolean;
}

interface IPriceProps {
  updatePricesInfos: (priceList: PricingInfo[]) => void,
  pricesInfos: PricingInfo[],
}

const PriceRace = (props: IPriceProps) => {
  const [, setNotification] = useContext(NotificationContext);
  const [prices, setPrices] = useState<PricingInfo[]>(props.pricesInfos);
  const [index, setIndex] = useState<number>();
  const [error, setError] = useState<IError>({
    name: false,
    tarif: false,
  });
  const { register, handleSubmit, setValue } = useForm<PricingInfo>();

  const classes = useStyles();

  useEffect(() => {
      setPrices(props.pricesInfos);
    }, [props.pricesInfos]);

  const onSubmit: SubmitHandler<PricingInfo> = (data: PricingInfo) => {
    setError({
      name: !data.name,
      tarif: !data.tarif,
    });

    if (String(data.tarif) === "" || data.name === "") {
      setNotification({
        message: 'Tous les champs doivent être renseignées. Possibilité de mettre NC (non communiqué).',
        open: true,
        type: 'error'
      });
    }
    else {
      props.pricesInfos.push(data)
      props.updatePricesInfos(props.pricesInfos);
    }
  }

  const editTabRow = ((event: any): void => {
    const tabPrices = prices[event.currentTarget.value];
    setValue("tarif", tabPrices.tarif);
    setValue("name", tabPrices.name);
    setIndex(event.currentTarget.value);
  })

  const deleteTabRow = ((event: any): void => {
    const raceIndex = event.currentTarget.value;
    props.pricesInfos.splice(raceIndex, 1);
    props.updatePricesInfos(props.pricesInfos);
  })

  return (
    <div>
      <div style={{ display: 'block', width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
        <TextField label="Nom du tarif"
                   error={error.name}
                   helperText={error.name && "Le nom du tarif doit être renseigné"}
                   placeholder="ex : FSGT"
                   className={classes.textField}
                   name="name"
                   inputRef={register()}
                   inputProps={{ 'name': 'name', 'ref': { register } }}
                   InputLabelProps={{shrink: true}} />
        <TextField label="Montant"
                   error={error.tarif}
                   helperText={error.tarif && "Le montant doit être renseigné"}
                   placeholder="ex : 7€"
                   className={classes.textField}
                   name="tarif"
                   inputRef={register}
                   inputProps={{ 'name': 'tarif', 'ref': { register } }}
                   margin="normal"
                   InputLabelProps={{shrink: true}}
                   onInput={(event: any) => { event.target.value = event.target.value.replace(/[^0-9]/g, '') }} />
      </div>
      <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px', marginTop: '30px' }}
              value={index} variant={'contained'} onClick={handleSubmit(onSubmit)} color={'primary'}>
        Sauvegarder
      </Button>
      <TableContainer component={Paper}>
        <Table className={classes.table} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell align="center" style={{ width: '35%', border: '1px solid black' }}>Tarif</TableCell>
              <TableCell align="center" style={{ width: '35%', border: '1px solid black' }}>Montant</TableCell>
              <TableCell align="center" style={{ width: '5%', border: '1px solid black' }} />
              <TableCell align="center" style={{ width: '5%', border: '1px solid black' }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {prices ? prices.map((row: PricingInfo, key: number) =>
                (
                    <TableRow key={key}>
                      <TableCell scope="row" align="center" style={{ columnWidth: '35%', border: '1px solid black' }}>
                        {row ? row.name : ""}
                      </TableCell>
                      <TableCell align="center" style={{ columnWidth: '35%', border: '1px solid black' }}>
                        {row ? row.tarif : ""}
                      </TableCell>
                      <TableCell align="center" style={{ columnWidth: '5%', border: '1px solid black' }}>
                        <Tooltip title='Modifier le tarif'>
                          <ButtonBase value={key} onClick={editTabRow}>
                            <EditRounded fontSize={'default'}/>
                          </ButtonBase>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center" style={{ columnWidth: '5%', border: '1px solid black', paddingLeft: '16px' }}>
                        <Tooltip title='Supprimer définitivement ce tarif'>
                          <ButtonBase value={key} onClick={deleteTabRow}>
                            <Delete fontSize={'default'} />
                          </ButtonBase>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                )
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
      <Button onClick={handleSubmit(onSubmit)}  variant={'contained'} color={'primary'}
              style={{ display: 'block', width: '206px', marginLeft: 'auto', marginRight: 'auto' }} >
        Ajouter
      </Button>
    </div>
  );
}
export default PriceRace;