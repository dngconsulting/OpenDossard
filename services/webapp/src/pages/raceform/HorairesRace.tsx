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
import { Delete, EditRounded, FileCopyRounded } from "@material-ui/icons";
import React, { useContext, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { NotificationContext } from "components/CadSnackbar";
import { CompetitionCreate, CompetitionInfo, FedeEnum } from "sdk";
import { IErrorProp } from "../competition/CompetitionForm";
import _ from "lodash";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      margin: 8,
      width: "220px",
      marginRight: "100px"
    },
    table: {
      margin: 0,
      marginRight: "auto",
      marginLeft: "auto",
      tableLayout: "auto",
      width: "100%"
    },
    tableRow: {
      height: 30
    }
  })
);

interface IRaceProps {
  competition: CompetitionCreate;
  updateCompetitionInfos: (races: CompetitionInfo[], errors: boolean) => void;
  onSaveCompetition: any;
}

const HorairesRace = (props: IRaceProps) => {
  const classes = useStyles();
  const errorMessage = "Veuillez remplir l'ensemble des champs obligatoires";

  const [, setNotification] = useContext(NotificationContext);
  const [competitionInfos, setCompetitionInfos] = useState<CompetitionInfo[]>(
    props.competition.competitionInfo
  );
  const [index, setIndex] = useState<number>();
  const [error, setError] = useState<IErrorProp>({
    course: false,
    horaireEngagement: false,
    horaireDepart: false,
    info1: false,
    info2: false
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const { register, handleSubmit, getValues, setValue } = useForm<
    CompetitionInfo
  >();

  useEffect(() => {
    if (!props.competition.competitionInfo) setCompetitionInfos([]);
  }, [props.competition.competitionInfo]);

  const resetFormValues = (): void => {
    setValue("course", "");
    setValue("info1", "");
    setValue("info2", "");
    setValue("info3", "");
    setValue("horaireDepart", "");
    setValue("horaireEngagement", "");
  };

  const showEmptyFields = (data: CompetitionInfo): void => {
    setError({
      course: !data.course,
      horaireEngagement: !data.horaireEngagement,
      horaireDepart: !data.horaireDepart,
      info1: !data.info1,
      info2: !data.info2
    });
  };

  const onSubmit: SubmitHandler<CompetitionInfo> = async (
    data: CompetitionInfo
  ) => {
    if (
      data.course === "" ||
      data.horaireEngagement === "" ||
      data.horaireDepart === "" ||
      data.info1 === "" ||
      data.info2 === ""
    ) {
      showEmptyFields(data);
      setNotification({
        message: errorMessage,
        open: true,
        type: "error"
      });
    } else {
      if (_.isEmpty(data.info3)) delete data.info3;
      setCompetitionInfos([...competitionInfos, data]);
      const infosError =
        error.course &&
        error.info1 &&
        error.info2 &&
        error.horaireDepart &&
        error.horaireEngagement;
      props.updateCompetitionInfos(competitionInfos, infosError);
      props.onSaveCompetition([...competitionInfos, data]);
      resetFormValues();
    }
  };
  // ---- Wording routines
  const wordingDepartsOfFede = (fede: FedeEnum) => {
    switch (fede) {
      case FedeEnum.FSGT:
      case FedeEnum.FFC:
      case FedeEnum.UFOLEP:
        return ["Catégorie/Départ", "ex: Cat 4"];
        break;
      case FedeEnum.FFVELO:
        return ["Randonnée", "ex: Randonnée de Saint-Orens"];
        break;
      case FedeEnum.CYCLOS:
        return ["Épreuve", "ex: Ronde Castraise"];
        break;
      default:
        return ["Départ", ""];
        break;
    }
  };

  const wordingInscriptionOfFede = (fede: FedeEnum) => {
    switch (fede) {
      case FedeEnum.FSGT:
      case FedeEnum.FFC:
      case FedeEnum.UFOLEP:
        return ["Heure dossard", "ex: 14h"];
        break;
      case FedeEnum.FFVELO:
        return ["Inscription", "ex: 14h"];
        break;
      case FedeEnum.CYCLOS:
        return ["Inscription", "ex: 14h ou en ligne uniquement"];
        break;
      default:
        return ["Inscription", ""];
        break;
    }
  };

  const wordingLapsOfFede = (fede: FedeEnum) => {
    switch (fede) {
      case FedeEnum.FSGT:
      case FedeEnum.FFC:
      case FedeEnum.UFOLEP:
        return ["Tours", "ex: 10 ou 10 tours"];
        break;
      case FedeEnum.FFVELO:
        return ["Distance", "ex: 150 Kms"];
        break;
      case FedeEnum.CYCLOS:
        return ["Distance", "ex: 150 Kms"];
        break;
      default:
        return ["Info", ""];
        break;
    }
  };

  const wordingLastInfoOfFede = (fede: FedeEnum) => {
    switch (fede) {
      case FedeEnum.FSGT:
      case FedeEnum.FFC:
      case FedeEnum.UFOLEP:
        return ["Distance totale", "ex: 58kms"];
        break;
      case FedeEnum.FFVELO:
        return ["Dénivelé", "ex: 1500m de D+"];
        break;
      case FedeEnum.CYCLOS:
        return ["Dénivelé", "ex: 1500m de D+"];
        break;
      default:
        return ["Info", ""];
        break;
    }
  };
  // End Wording Routines
  const onEdit = (event: any): void => {
    const row = getValues([
      "course",
      "horaireEngagement",
      "horaireDepart",
      "info1",
      "info2",
      "info3"
    ]);
    showEmptyFields(row);
    if (_.isEmpty(row.info3)) delete row.info3;
    if (
      row.course === "" ||
      row.horaireEngagement === "" ||
      row.horaireDepart === "" ||
      row.info1 === "" ||
      row.info2 === ""
    ) {
      setNotification({
        message: errorMessage,
        open: true,
        type: "error"
      });
    } else {
      competitionInfos[event.currentTarget.value] = { ...row };
      const infosError =
        error.course &&
        error.info1 &&
        error.info2 &&
        error.horaireDepart &&
        error.horaireEngagement;
      props.updateCompetitionInfos(competitionInfos, infosError);
      props.onSaveCompetition(competitionInfos);
      resetFormValues();
      setIsEditing(false);
    }
  };

  const editTabRow = (event: any): void => {
    setIsEditing(true);

    const tabInfo = competitionInfos[event.currentTarget.value];
    setValue("course", tabInfo.course);
    setValue("info1", tabInfo.info1);
    setValue("info2", tabInfo.info2);
    setValue("info3", tabInfo.info3);
    setValue("horaireDepart", tabInfo.horaireDepart);
    setValue("horaireEngagement", tabInfo.horaireEngagement);
    setIndex(event.currentTarget.value);
  };

  const deleteTabRow = (event: any): void => {
    const raceIndex = event.currentTarget.value;
    let infosError =
      error.course &&
      error.info1 &&
      error.info2 &&
      error.horaireDepart &&
      error.horaireEngagement;
    setCompetitionInfos(competitionInfos.splice(raceIndex, 1));
    if (competitionInfos.length === 0) {
      infosError = true;
    }
    props.updateCompetitionInfos(competitionInfos, infosError);
    props.onSaveCompetition(competitionInfos);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          marginTop: "2rem",
          width: "100%",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <TextField
          required={true}
          label={wordingDepartsOfFede(props.competition.fede)[0]}
          error={error.course}
          className={classes.textField}
          name="course"
          inputRef={register()}
          placeholder={wordingDepartsOfFede(props.competition.fede)[1]}
          inputProps={{ name: "course", ref: { register } }}
          InputLabelProps={{ shrink: true }}
        />
        <Tooltip title={"Si l'engagement/l'inscription à l'épreuve est sur place, donner l'heure d'engagement. S'il est en ligne, précisez du texte indiquant qu'il est en ligne."}>
        <TextField
          required={true}
          label={wordingInscriptionOfFede(props.competition.fede)[0]}
          error={error.horaireEngagement}
          className={classes.textField}
          name="horaireEngagement"
          inputRef={register()}
          placeholder={wordingInscriptionOfFede(props.competition.fede)[1]}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        </Tooltip>
        <Tooltip title={"Correspond à l'heure du départ de l'épreuve"}>
        <TextField
          required={true}
          label="Heure du départ"
          error={error.horaireDepart}
          className={classes.textField}
          inputRef={register()}
          name="horaireDepart"
          placeholder="ex : 15h"
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        </Tooltip>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "2rem",
          width: "100%",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <TextField
          required={true}
          label={wordingLapsOfFede(props.competition.fede)[0]}
          error={error.info1}
          className={classes.textField}
          name="info1"
          inputRef={register()}
          placeholder={wordingLapsOfFede(props.competition.fede)[1]}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          required={true}
          label={wordingLastInfoOfFede(props.competition.fede)[0]}
          error={error.info2}
          className={classes.textField}
          name="info2"
          inputRef={register()}
          placeholder={wordingLastInfoOfFede(props.competition.fede)[1]}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <Tooltip title={"Attention à bien vérifier que le lien OpenRunner fonctionne, le profil du circuit sur Dossardeur est extrait à l'aide de ce lien"}>
        <TextField
          label="Lien OpenRunner"
          className={classes.textField}
          name="info3"
          inputRef={register()}
          style={{ margin: 8, marginRight: "150px", width: "250px" }}
          placeholder="https:/www.lienOpenrunner.com"
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        </Tooltip>
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
            width: "256px",
            marginTop: "30px"
          }}
          variant={"contained"}
          value={index}
          color={"primary"}
          onClick={handleSubmit(onSubmit)}
        >
          Ajouter une course/départ
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
            <TableRow className={classes.tableRow}>
              <TableCell
                align="center"
                style={{ width: "25%", border: "1px solid black" }}
              >
                {wordingDepartsOfFede(props.competition.fede)[0]}
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "10%", border: "1px solid black" }}
              >
                {wordingInscriptionOfFede(props.competition.fede)[0]}
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "10%", border: "1px solid black" }}
              >
                Heure Départ
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "10%", border: "1px solid black" }}
              >
                {wordingLapsOfFede(props.competition.fede)[0]}
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "10%", border: "1px solid black" }}
              >
                {wordingLastInfoOfFede(props.competition.fede)[0]}
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "25%", border: "1px solid black" }}
              >
                Lien OpenRunner
              </TableCell>
              <TableCell
                align="center"
                style={{ width: "5%", border: "1px solid black" }}
              />
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
            {competitionInfos && competitionInfos.length > 0 ? (
              competitionInfos.map((info: CompetitionInfo, key: number) => (
                <TableRow key={key} className={classes.tableRow}>
                  <TableCell
                    scope="row"
                    align="center"
                    style={{ columnWidth: "25%", border: "1px solid black" }}
                  >
                    {info.course}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ width: "10%", border: "1px solid black" }}
                  >
                    {info.horaireEngagement}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ width: "10%", border: "1px solid black" }}
                  >
                    {info.horaireDepart}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ width: "10%", border: "1px solid black" }}
                  >
                    {info.info1}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ width: "10%", border: "1px solid black" }}
                  >
                    {info.info2}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ width: "25%", border: "1px solid black" }}
                  >
                    {info.info3}
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ width: "5%", border: "1px solid black" }}
                  >
                    <Tooltip title="Dupliquer cette ligne">
                      <ButtonBase
                        value={key}
                        onClick={() => {
                          setValue("course", info.course);
                          setValue("info1", info.info1);
                          setValue("info2", info.info2);
                          setValue("info3", info.info3);
                          setValue("horaireDepart", info.horaireDepart);
                          setValue("horaireEngagement", info.horaireEngagement);
                        }}
                      >
                        <FileCopyRounded />
                      </ButtonBase>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{ width: "5%", border: "1px solid black" }}
                  >
                    <Tooltip title="Modifier cette catégorie">
                      <ButtonBase value={key} onClick={editTabRow}>
                        <EditRounded />
                      </ButtonBase>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    style={{
                      width: "5%",
                      border: "1px solid black",
                      paddingLeft: "16px"
                    }}
                  >
                    <Tooltip title="Supprimer définitivement cette catégorie">
                      <ButtonBase value={key} onClick={deleteTabRow}>
                        <Delete />
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
                  Aucun horaire ou parcours encore ajouté
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default HorairesRace;
