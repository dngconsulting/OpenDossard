import {
  Button,
  ButtonBase,
  createStyles,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Tooltip
} from "@material-ui/core";
import { Delete, EditRounded } from "@material-ui/icons";
import { NotificationContext } from "components/CadSnackbar";
import React, { useContext, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { PricingInfo } from "sdk";
import { IErrorPrice } from "../competition/CompetitionForm";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      margin: 8,
      width: "200px",
      marginRight: "150px"
    },
    table: {
      marginRight: "auto",
      marginLeft: "auto",
      tableLayout: "auto",
      width: "100%"
    }
  })
);

interface IPriceProps {
  pricesInfos: PricingInfo[];
  updatePricesInfos: (priceList: PricingInfo[], errors: boolean) => void;
  onSaveCompetition: Function;
}

const PriceRace = (props: IPriceProps) => {
  const classes = useStyles();
  const errorMessage = "Veuillez remplir l'ensemble des champs obligatoires.";

  const [, setNotification] = useContext(NotificationContext);
  const [prices, setPrices] = useState<PricingInfo[]>(props.pricesInfos);
  const [index, setIndex] = useState<number>();
  const [error, setError] = useState<IErrorPrice>({
    name: false,
    tarif: false
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { register, handleSubmit, getValues, setValue } = useForm<
    PricingInfo
  >();

  useEffect(() => {
    setPrices(props.pricesInfos);
  }, [props.pricesInfos]);

  const resetFormValues = (): void => {
    setValue("tarif", null);
    setValue("name", "");
  };

  const showEmptyFields = (data: PricingInfo): void => {
    setError({
      name: !data.name,
      tarif: !data.tarif
    });
  };

  const onSubmit: SubmitHandler<PricingInfo> = (data: PricingInfo) => {
    showEmptyFields(data);

    if (data.name === "" || String(data.tarif) === "" || data.tarif === null) {
      setNotification({
        message: errorMessage,
        open: true,
        type: "error"
      });
    } else {
      props.pricesInfos.push(data);
      const pricesError = error.tarif && error.name;
      props.updatePricesInfos(props.pricesInfos, pricesError);
      props.onSaveCompetition();
      resetFormValues();
    }
  };

  const onEdit = (event: any): void => {
    const row = getValues(["name", "tarif"]);
    showEmptyFields(row);

    if (row.name === "" || String(row.tarif) === "" || row.tarif === null) {
      setNotification({
        message: errorMessage,
        open: true,
        type: "error"
      });
    } else {
      prices[event.currentTarget.value] = getValues(["name", "tarif"]);
      const pricesError = error.tarif && error.name;
      props.updatePricesInfos(prices, pricesError);
      props.onSaveCompetition();
      resetFormValues();
      setIsEditing(false);
    }
  };

  const editTabRow = (event: any): void => {
    setIsEditing(true);

    const tabPrices = prices[event.currentTarget.value];
    setValue("tarif", tabPrices.tarif);
    setValue("name", tabPrices.name);
    setIndex(event.currentTarget.value);
  };

  const deleteTabRow = (event: any): void => {
    const raceIndex = event.currentTarget.value;
    const pricesError = error.tarif && error.name;
    props.pricesInfos.splice(raceIndex, 1);
    props.updatePricesInfos(props.pricesInfos, pricesError);
    props.onSaveCompetition();
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <TextField
          required={true}
          label="Nom du tarif"
          error={error.name}
          helperText={error.name && "Le nom du tarif doit être renseigné"}
          placeholder="ex : Licencié FFC"
          className={classes.textField}
          name="name"
          inputRef={register()}
          inputProps={{ name: "name", ref: { register } }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          required={true}
          label="Montant"
          error={error.tarif}
          helperText={error.tarif && "Le montant doit être renseigné"}
          placeholder="ex : 7€"
          className={classes.textField}
          name="tarif"
          inputRef={register}
          inputProps={{ name: "tarif", ref: { register } }}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
      </div>
      {isEditing ? (
        <Button
          style={{
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            width: "206px",
            marginTop: "30px"
          }}
          variant={"contained"}
          value={index}
          color={"primary"}
          onClick={onEdit}
        >
          Modifier
        </Button>
      ) : (
        <Button
          style={{
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            width: "206px",
            marginTop: "30px"
          }}
          variant={"contained"}
          value={index}
          color={"primary"}
          onClick={handleSubmit(onSubmit)}
        >
          Ajouter
        </Button>
      )}
      <TableContainer
        style={{ marginLeft: 16, marginTop: 16, padding: 0 }}
        component={Paper}
      >
        <Table
          className={classes.table}
          size="small"
          aria-label="a dense table"
        >
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                style={{ width: "35%", border: "1px solid black" }}
              >
                Tarif
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "35%", border: "1px solid black" }}
              >
                Montant
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "5%", border: "1px solid black" }}
              />
              <TableCell
                align="center"
                style={{ width: "5%", border: "1px solid black" }}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {prices && prices.length > 0 ? (
              prices.map((row: PricingInfo, key: number) => (
                <TableRow key={key}>
                  <TableCell
                    scope="row"
                    align="center"
                    style={{ columnWidth: "35%", border: "1px solid black" }}
                  >
                    {row ? row.name : ""}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ columnWidth: "35%", border: "1px solid black" }}
                  >
                    {row ? row.tarif : ""}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ columnWidth: "5%", border: "1px solid black" }}
                  >
                    <Tooltip title="Modifier le tarif">
                      <ButtonBase value={key} onClick={editTabRow}>
                        <EditRounded fontSize={"default"} />
                      </ButtonBase>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{
                      columnWidth: "5%",
                      border: "1px solid black",
                      paddingLeft: "16px"
                    }}
                  >
                    <Tooltip title="Supprimer définitivement ce tarif">
                      <ButtonBase value={key} onClick={deleteTabRow}>
                        <Delete fontSize={"default"} />
                      </ButtonBase>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  style={{ textAlign: "center", height: 50 }}
                  colSpan={8}
                >
                  Aucun tarif encore ajouté
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
export default PriceRace;
