import React, { useState } from "react";
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Container,
  Button,
  makeStyles,
  Theme,
  createStyles
} from "@material-ui/core";
import Editor from "components/Editor";
import moment from "moment";
import ClubSelect, { IOptionType } from "components/ClubSelect";
import {
  CompetitionCreate,
  CompetitionCreateCompetitionTypeEnum,
  CompetitionEntityCompetitionTypeEnum
} from "sdk";
import { FedeEnum } from "sdk/models/FedeEnum";
import { IErrorInfo } from "../competition/CompetitionForm";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Grid from "@material-ui/core/Grid";
import { saveCompetition } from "../common/Competition";

interface IInfoRaceProps {
  mainInfos: CompetitionCreate;
  history: any;
  onSaveCompetition: any;
  updateMainInfos: (competition: CompetitionCreate, errors: boolean) => void;
}
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    Tab: {
      "&:hover": {
        backgroundColor: "#004f04",
        color: "#ffffff"
      }
    },
    button: {
      display: "block",
      width: "206px",
      marginLeft: "auto",
      marginRight: "auto",
      marginBottom: 10
    }
  })
);
const InfoRace = (props: IInfoRaceProps) => {
  const date: string = moment(props.mainInfos.eventDate).format(
    "YYYY-MM-DDTHH:mm"
  );
  const classes = useStyles();
  const [error, setError] = useState<IErrorInfo>({
    fede: false,
    name: false,
    competitionType: false,
    eventDate: false,
    zipCode: false,
    club: false,
    contactPhone: false,
    contactEmail: false,
    facebook: false,
    website: false
  });

  const showEmptyFields = (): boolean => {
    return (
      error.fede ||
      error.name ||
      error.competitionType ||
      error.eventDate ||
      error.zipCode ||
      error.club ||
      error.contactPhone ||
      error.contactEmail ||
      error.facebook ||
      error.website
    );
  };

  const handleChangeBox = (event: React.ChangeEvent<HTMLInputElement>) => {
    const mainInfoError = showEmptyFields();
    props.updateMainInfos(
      {
        ...props.mainInfos,
        [event.target.name]: event.target.checked
      },
      mainInfoError
    );
  };

  const handleObservations = (data: string): void => {
    const mainInfoError = showEmptyFields();
    props.updateMainInfos(
      { ...props.mainInfos, observations: data },
      mainInfoError
    );
  };

  const handleFormDate = (event: any): void => {
    const label = event.currentTarget.name;
    const value = event.currentTarget.value;
    if (label === "eventDate") {
      setError({
        ...error,
        eventDate: !value
      });
    }
    const mainInfoError = showEmptyFields();
    props.updateMainInfos(
      {
        ...props.mainInfos,
        [label]: moment(value, "YYYY-MM-DD HH:mm:ssZZ")
      },
      mainInfoError
    );
  };

  const handleForm = (event: any): void => {
    const label = event.target.name;
    const value = event.target.value;
    if (label === "name" || label === "zipCode") {
      setError({
        ...error,
        [label]: !value
      });
    }
    controlTextfield(label, value);
    const mainInfoError = showEmptyFields();
    props.updateMainInfos(
      {
        ...props.mainInfos,
        [label]: value
      },
      mainInfoError
    );
  };

  const onSelectClub = (value: number) => {
    const mainInfoError = showEmptyFields();
    setError({
      ...error,
      club: !value
    });
    props.updateMainInfos({ ...props.mainInfos, club: value }, mainInfoError);
  };

  const handleFEDEChange = (event: any, target: string | any) => {
    const mainInfoError = showEmptyFields();
    setError({
      ...error,
      fede: !target
    });
    if (target) {
      if (target.value === FedeEnum.FSGT) {
        props.updateMainInfos(
          {
            ...props.mainInfos,
            fede: target.value,
            club: null,
            races: ["2,3,4,5"]
          },
          mainInfoError
        );
      } else {
        props.updateMainInfos(
          {
            ...props.mainInfos,
            fede: target.value,
            club: null,
            races: ["Toutes"]
          },
          mainInfoError
        );
      }
    } else {
      props.updateMainInfos(
        {
          ...props.mainInfos,
          fede: null,
          club: null,
          races: []
        },
        mainInfoError
      );
    }
  };

  // controles format
  const controlTextfield = (label: string, value: string): void => {
    let mainInfoError =
      error.fede &&
      error.name &&
      error.competitionType &&
      error.eventDate &&
      error.zipCode &&
      error.club &&
      error.contactPhone &&
      error.contactEmail &&
      error.facebook &&
      error.website;
    if (label === "contactPhone") {
      if (value.length <= 9 && value !== "") {
        setError({
          ...error,
          contactPhone: true
        });
        mainInfoError = mainInfoError && error.contactPhone;
        props.updateMainInfos(
          { ...props.mainInfos, isValidResults: false },
          mainInfoError
        );
      } else {
        setError({
          ...error,
          contactPhone: false
        });
      }
    } else if (label === "contactEmail") {
      if (value.includes("@", null) === false && value !== "") {
        setError({
          ...error,
          contactEmail: true
        });
        mainInfoError = mainInfoError && error.contactPhone;
        props.updateMainInfos(
          { ...props.mainInfos, isValidResults: false },
          mainInfoError
        );
      } else {
        setError({
          ...error,
          contactEmail: false
        });
      }
    } else if (label === "zipCode") {
      if (value.length < 5) {
        setError({
          ...error,
          zipCode: true
        });
        mainInfoError = mainInfoError && error.contactPhone;
        props.updateMainInfos(
          { ...props.mainInfos, isValidResults: false },
          mainInfoError
        );
      } else {
        setError({
          ...error,
          zipCode: false
        });
      }
    } else if (label === "facebook") {
      if (value.includes("http", 0) === false && value !== "") {
        setError({
          ...error,
          facebook: true
        });
        mainInfoError = mainInfoError && error.contactPhone;
        props.updateMainInfos(
          { ...props.mainInfos, isValidResults: false },
          mainInfoError
        );
      } else {
        setError({
          ...error,
          facebook: false
        });
      }
    } else if (label === "website") {
      if (value.includes("http", 0) === false && value !== "") {
        setError({
          ...error,
          website: true
        });
        mainInfoError = mainInfoError && error.contactPhone;
        props.updateMainInfos(
          { ...props.mainInfos, isValidResults: false },
          mainInfoError
        );
      } else {
        setError({
          ...error,
          website: false
        });
      }
    }
  };

  return (
    <>
      <Container style={{ marginLeft: 0, marginTop: "2rem" }}>
        <Grid container={true} spacing={2} alignItems={"center"}>
          <Grid item={true} xs={4}>
            <TextField
              required={true}
              label="Nom de l'épreuve"
              value={props.mainInfos.name}
              error={error.name}
              helperText={
                error.name && "Le nom de l'épreuve doit être renseigné"
              }
              type="text"
              name="name"
              onSelect={handleForm}
              onChange={handleForm}
              InputLabelProps={{ shrink: true }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              required={true}
              label="Date et heure de l'épreuve"
              value={date}
              error={error.eventDate}
              type="datetime-local"
              id="datetime-local"
              name="eventDate"
              onSelect={handleFormDate}
              onChange={handleFormDate}
              helperText={
                error.eventDate && "la date de l'épreuve doit être renseignée"
              }
              InputLabelProps={{ shrink: true }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <Autocomplete
              value={{
                label: props.mainInfos.competitionType || "",
                value: props.mainInfos.competitionType || ""
              }}
              getOptionLabel={option => option.label}
              getOptionSelected={(option, target) =>
                option.value === target.value
              }
              autoComplete={true}
              autoSelect={true}
              autoHighlight={true}
              renderInput={params => (
                <TextField
                  {...params}
                  required={true}
                  label="Type"
                  variant="standard"
                  error={error.competitionType}
                  helperText={
                    error.competitionType
                      ? "Le type de l'épreuve doit être renseigné"
                      : ""
                  }
                />
              )}
              style={{ width: "80%" }}
              onChange={(event: any, target: string | any) => {
                setError({ ...error, competitionType: !target });
                const mainInfoError = showEmptyFields();
                if (target) {
                  props.updateMainInfos(
                    { ...props.mainInfos, competitionType: target.value },
                    mainInfoError
                  );
                } else {
                  props.updateMainInfos(
                    { ...props.mainInfos, competitionType: null },
                    mainInfoError
                  );
                }
              }}
              options={Object.keys(CompetitionEntityCompetitionTypeEnum).map(
                key => ({
                  value: CompetitionEntityCompetitionTypeEnum[key],
                  label: CompetitionEntityCompetitionTypeEnum[key]
                })
              )}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              label="Longueur circuit"
              value={props.mainInfos.circuitLength}
              type="text"
              name="circuitLength"
              onSelect={handleForm}
              onChange={handleForm}
              InputLabelProps={{ shrink: true }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              required={true}
              label="Code Postal"
              value={props.mainInfos.zipCode}
              placeholder="ex : 31000"
              name="zipCode"
              onSelect={handleForm}
              onChange={handleForm}
              error={error.zipCode}
              helperText={
                error.zipCode &&
                "Le code postal doit être renseigné en 5 chiffres"
              }
              onInput={(event: any) => {
                event.target.value = event.target.value.replace(/[^0-9]/g, "");
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ type: "text", maxLength: 5 }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <Autocomplete
              value={props.mainInfos.info}
              getOptionLabel={option => option}
              getOptionSelected={(option, target) => option === target}
              autoComplete={true}
              autoSelect={true}
              autoHighlight={true}
              renderInput={params => (
                <TextField {...params} label="Profil" variant="standard" />
              )}
              style={{ width: "80%" }}
              onChange={(event: any, target: string | any) => {
                const mainInfoError = showEmptyFields();
                props.updateMainInfos(
                  { ...props.mainInfos, info: target },
                  mainInfoError
                );
              }}
              options={[
                "Valloné",
                "Montagne",
                "Circuit Plat",
                "Moy-Montagne",
                "NC"
              ]}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <Autocomplete
              value={{
                label: props.mainInfos.fede || "",
                value: props.mainInfos.fede || ""
              }}
              getOptionLabel={option => option.label}
              getOptionSelected={(option, target) =>
                option.value === target.value
              }
              autoComplete={true}
              autoSelect={true}
              autoHighlight={true}
              renderInput={params => (
                <TextField
                  {...params}
                  required={true}
                  label="Fédération"
                  variant="standard"
                  error={error.fede}
                  helperText={
                    error.fede
                      ? "La fédération de l'épreuve doit être renseignée"
                      : ""
                  }
                />
              )}
              style={{ width: "80%" }}
              onChange={handleFEDEChange}
              options={Object.keys(FedeEnum)
                .filter(fede => fede != "NL" && fede != "FFTRI")
                .map(key => ({
                  value: FedeEnum[key],
                  label: FedeEnum[key]
                }))}
            />
          </Grid>
          <Grid item={true} xs={8}>
            {props.mainInfos.fede && props.mainInfos.fede !== FedeEnum.NL && (
              <ClubSelect
                isError={error.club}
                dept={props.mainInfos.dept}
                fede={props.mainInfos.fede}
                onSelectClubId={onSelectClub}
                defaultChosenClub={
                  {
                    value: props.mainInfos.club,
                    label: "default"
                  } as IOptionType
                }
              />
            )}
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              label="Nom contact"
              value={props.mainInfos.contactName}
              placeholder="Prénom NOM"
              name="contactName"
              type="text"
              onSelect={handleForm}
              onChange={handleForm}
              InputLabelProps={{ shrink: true }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              label="Téléphone Contact"
              value={props.mainInfos.contactPhone}
              placeholder="ex : 0695085349"
              name="contactPhone"
              onSelect={handleForm}
              onChange={handleForm}
              error={error.contactPhone}
              helperText={
                error.contactPhone &&
                "le numéro de téléphone doit comporter 10 chiffres"
              }
              onInput={(event: any) => {
                event.target.value = event.target.value.replace(/[^0-9]/g, "");
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ type: "tel", maxLength: 10 }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              label="E-mail Contact"
              value={props.mainInfos.contactEmail}
              placeholder="ex : personne@mail.com"
              name="contactEmail"
              type="email"
              error={error.contactEmail}
              helperText={
                error.contactEmail === true &&
                "l'email n'est pas au bon format xyz@mail.com'"
              }
              onSelect={handleForm}
              onChange={handleForm}
              InputLabelProps={{ shrink: true }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              label="Lien Facebook"
              value={props.mainInfos.facebook}
              placeholder="ex : https://www.monfacebook.fr"
              name="facebook"
              type="url"
              error={error.facebook}
              helperText={
                error.facebook && "le nom du site doit commencer par http"
              }
              onSelect={handleForm}
              onChange={handleForm}
              InputLabelProps={{ shrink: true }}
              style={{ width: "80%" }}
            />
          </Grid>
          <Grid item={true} xs={4}>
            <TextField
              label="Site web"
              value={props.mainInfos.website}
              placeholder="ex : https://www.monsite.fr"
              name="website"
              type="url"
              onSelect={handleForm}
              onChange={handleForm}
              error={error.website}
              helperText={
                error.website && "le nom du site doit commencer par http"
              }
              InputLabelProps={{ shrink: true }}
              style={{ width: "80%" }}
            />
          </Grid>
        </Grid>
        {props.mainInfos.id ? (
          <Grid container={true} spacing={2} alignItems={"center"}>
            <Grid item={true} xs={4}>
              <TextField
                label="Commissaires"
                value={props.mainInfos.commissaires}
                placeholder="Prénom NOM"
                name="commissaires"
                type="text"
                onSelect={handleForm}
                onChange={handleForm}
                InputLabelProps={{ shrink: true }}
                style={{ width: "80%" }}
              />
            </Grid>
            <Grid item={true} xs={4}>
              <TextField
                label="Speaker"
                value={props.mainInfos.speaker}
                placeholder="Prénom NOM"
                name="speaker"
                type="text"
                onSelect={handleForm}
                onChange={handleForm}
                InputLabelProps={{ shrink: true }}
                style={{ width: "80%" }}
              />
            </Grid>
            {props.mainInfos.competitionType ===
            CompetitionCreateCompetitionTypeEnum.CX ? (
              <Grid item={true} xs={4}>
                <TextField
                  label="Aboyeur"
                  value={props.mainInfos.aboyeur}
                  InputLabelProps={{ shrink: true }}
                  name="aboyeur"
                  type="text"
                  onSelect={handleForm}
                  onChange={handleForm}
                  placeholder="Prénom NOM"
                  style={{ width: "80%" }}
                />
              </Grid>
            ) : null}
            <Grid item={true} xs={12}>
              <TextField
                label="Note commissaire(s)"
                value={props.mainInfos.feedback}
                name="feedback"
                type="text"
                onSelect={handleForm}
                onChange={handleForm}
                InputLabelProps={{ shrink: true }}
                style={{ width: "80%" }}
              />
            </Grid>
          </Grid>
        ) : null}
        <Grid container={true} spacing={2} alignItems={"center"}>
          <Grid item={true} xs={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={props.mainInfos.isOpenedToOtherFede}
                  onSelect={handleChangeBox}
                  onChange={handleChangeBox}
                  name="isOpenedToOtherFede"
                  color="primary"
                />
              }
              label="Ouvert aux licenciés des autres fédérations"
            />
          </Grid>
          <Grid item={true} xs={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={props.mainInfos.isOpenedToNL}
                  onSelect={handleChangeBox}
                  onChange={handleChangeBox}
                  name="isOpenedToNL"
                  color="primary"
                />
              }
              label="Ouvert aux non licenciés"
            />
          </Grid>
          <Grid item={true} xs={12}>
            <Editor
              data={handleObservations}
              edit={props.mainInfos.observations}
            />
          </Grid>
        </Grid>
      </Container>
      <Container>
        <Grid container={true} spacing={4} alignItems={"center"}>
          <Grid item={true} xs={6}>
            <Button
              variant="contained"
              color="secondary"
              className={classes.button}
              onClick={() => {
                props.history.goBack();
              }}
            >
              Retour
            </Button>
          </Grid>
          <Button
            onClick={props.onSaveCompetition}
            variant={"contained"}
            color={"primary"}
            className={classes.button}
          >
            Sauvegarder
          </Button>
        </Grid>
      </Container>
    </>
  );
};
export default InfoRace;
