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
import { LinkInfo, PricingInfo } from "sdk";
import { IErrorMedia } from "../competition/CompetitionForm";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      margin: 8,
      width: "300px",
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

interface IMediaProps {
  mediaInfos: LinkInfo[];
  updateMediaInfos: (mediasInfos: LinkInfo[], errors: boolean) => void;
  onSaveCompetition: Function;
}

const MediaRace = (props: IMediaProps) => {
  const classes = useStyles();
  const errorMessage = "Veuillez remplir l'ensemble des champs obligatoires.";

  const [, setNotification] = useContext(NotificationContext);
  const [medias, setMedias] = useState<LinkInfo[]>([]);
  const [index, setIndex] = useState<number>();
  const [error, setError] = useState<IErrorMedia>({
    label: false,
    link: false
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { register, handleSubmit, getValues, setValue } = useForm<LinkInfo>();

  useEffect(() => {
    if (props.mediaInfos) setMedias(props.mediaInfos);
  }, [props.mediaInfos]);

  const resetFormValues = (): void => {
    setValue("label", null);
    setValue("link", "");
  };

  const showEmptyFields = (data: LinkInfo): void => {
    setError({
      label: !data.label,
      link: !data.link
    });
  };

  const onSubmit: SubmitHandler<LinkInfo> = (data: LinkInfo) => {
    showEmptyFields(data);
    if (data.label === "" || data.link === "") {
      setNotification({
        message: errorMessage,
        open: true,
        type: "error"
      });
    } else {
      medias.push(data);
      const mediasError = error.label && error.link;
      props.updateMediaInfos(medias, mediasError);
      props.onSaveCompetition(medias);
      resetFormValues();
    }
  };

  const onEdit = (event: any): void => {
    const row = getValues(["label", "link"]);
    showEmptyFields(row);

    if (row.label === "" || row.link === "") {
      setNotification({
        message: errorMessage,
        open: true,
        type: "error"
      });
    } else {
      medias[event.currentTarget.value] = getValues(["label", "link"]);
      const mediasError = error.label && error.link;
      props.updateMediaInfos(medias, mediasError);
      props.onSaveCompetition(medias);
      resetFormValues();
      setIsEditing(false);
    }
  };

  const editTabRow = (event: any): void => {
    setIsEditing(true);

    const tabMedias = medias[event.currentTarget.value];
    setValue("label", tabMedias.label);
    setValue("link", tabMedias.link);
    setIndex(event.currentTarget.value);
  };

  const deleteTabRow = (event: any): void => {
    const raceIndex = event.currentTarget.value;
    const pricesError = error.label && error.link;
    medias.splice(raceIndex, 1);
    props.updateMediaInfos(medias, pricesError);
    props.onSaveCompetition(medias);
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
          label="Nom de l'album"
          error={error.label}
          helperText={error.label && "Le nom de l'album doit être renseigné"}
          placeholder="ex : Photos toutes catégories"
          className={classes.textField}
          name="label"
          inputRef={register()}
          inputProps={{ name: "label", ref: { register } }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          required={true}
          label="Lien de l'album"
          error={error.link}
          helperText={error.link && "Le lien hypertexte doit être renseigné"}
          placeholder="ex : http://google/album/course2"
          className={classes.textField}
          name="link"
          inputRef={register}
          inputProps={{ name: "link", ref: { register } }}
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
                Nom de l'album
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "35%", border: "1px solid black" }}
              >
                Lien de l'album
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
            {medias && medias.length > 0 ? (
              medias.map((row: LinkInfo, key: number) => (
                <TableRow key={key}>
                  <TableCell
                    scope="row"
                    align="center"
                    style={{ columnWidth: "35%", border: "1px solid black" }}
                  >
                    {row ? row.label : ""}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ columnWidth: "35%", border: "1px solid black" }}
                  >
                    <Tooltip title="Cliquer sur le lien pour visualiser l'album">
                      <a target="_blank" href={row ? row.link : ""}>
                        {row ? row.link : ""}
                      </a>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ columnWidth: "5%", border: "1px solid black" }}
                  >
                    <Tooltip title="Modifier le lien">
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
                    <Tooltip title="Supprimer définitivement ce lien">
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
                  Aucun lien encore ajouté
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
export default MediaRace;
