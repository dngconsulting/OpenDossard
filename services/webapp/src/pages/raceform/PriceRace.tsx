import { Button, ButtonBase, createStyles, makeStyles, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Theme, Tooltip } from '@material-ui/core';
import { Delete, EditRounded } from '@material-ui/icons';
import { NotificationContext } from 'components/CadSnackbar';
import React, { useState, useEffect, useContext } from 'react';
import { SubmitHandler, useForm, } from "react-hook-form";
import {CompetitionInfo, PricingInfo} from 'sdk';

const useStyles = makeStyles(
    (theme: Theme) => createStyles({
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
    }),
);

interface IError {
    name: boolean;
    tarif: boolean;
}

interface IPriceProps {
    pricesInfos: PricingInfo[],
    updatePricesInfos: (priceList: PricingInfo[]) => void,
}

const PriceRace = (props: IPriceProps) => {
    const classes      = useStyles();
    const errorMessage = 'Tous les champs doivent être renseignées. Possibilité de mettre NC (non communiqué).';

    const [, setNotification] = useContext(NotificationContext);
    const [prices, setPrices] = useState<PricingInfo[]>(props.pricesInfos);
    const [index, setIndex]   = useState<number>();
    const [error, setError]   = useState<IError>({
        name: false,
        tarif: false,
    });
    const [isEditing, setIsEditing]       = useState<boolean>(false);
    const [isHiddenForm, setIsHiddenForm] = useState<boolean>(true);
    const { register, handleSubmit, getValues, setValue } = useForm<PricingInfo>();

    useEffect(() => {
        setPrices(props.pricesInfos);
    }, [props.pricesInfos]);

    const resetFormValues = ():void => {
        setValue("tarif", null);
        setValue("name", "");
    }

    const showEmptyFields = (data: PricingInfo): void=> {
        setError({
            name: !data.name,
            tarif: !data.tarif,
        });
    }

    const onSubmit: SubmitHandler<PricingInfo> = (data: PricingInfo) => {
        showEmptyFields(data);

        if (data.name === "" || String(data.tarif) === "" || data.tarif === null) {
            setNotification({
                message: errorMessage,
                open: true,
                type: 'error'
            });
        }
        else {
            props.pricesInfos.push(data)
            props.updatePricesInfos(props.pricesInfos);
            resetFormValues();
            setIsHiddenForm(true);
        }
    }

    const onEdit = (event: any):void => {
        const row = getValues(["name", "tarif"]);
        showEmptyFields(row);

        if(row.name === "" || String(row.tarif) === "" || row.tarif === null) {
            setNotification({
                message: errorMessage,
                open: true,
                type: 'error'
            });
        }
        else {
            prices[event.currentTarget.value] = getValues(["name", "tarif"]);
            props.updatePricesInfos(prices)
            resetFormValues();
            setIsHiddenForm(true);
        }
    }

    const editTabRow = ((event: any): void => {
        setIsHiddenForm(false);
        setIsEditing(true);

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

    const addTabRow = () => {
        setIsHiddenForm(false);
        setIsEditing(false);
        resetFormValues();
    }

  return (
    <div>
      <div hidden={isHiddenForm}>
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
          {
            isEditing ?
              <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px', marginTop: '30px' }}
                      variant={'contained'} value={index} color={'primary'} onClick={onEdit}>
                Modifier
              </Button>
            :
              <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px', marginTop: '30px' }}
                      variant={'contained'} value={index} color={'primary'} onClick={handleSubmit(onSubmit)}>
                Ajouter
              </Button>
          }
      </div>
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
            { prices ? prices.map((row: PricingInfo, key: number) => (
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
            )) : null}
          </TableBody>
        </Table>
      </TableContainer>
        <Button style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '206px' }}
                variant={'contained'} color={'primary'} onClick={addTabRow} >
        Ajouter un tarif
      </Button>
    </div>
  );
}
export default PriceRace;