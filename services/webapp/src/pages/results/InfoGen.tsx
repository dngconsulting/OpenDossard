import { default as React, useContext, useEffect, useState } from "react";
import { NotificationContext } from "../../components/CadSnackbar";
import {
  CircularProgress,
  Grid,
  TextareaAutosize,
  withStyles
} from "@material-ui/core";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import {
  CompetitionEntity,
  CompetitionEntityCompetitionTypeEnum
} from "../../sdk/models";
import { apiCompetitions } from "../../util/api";

interface IInfoGenProps {
  classes: any;
  history: any;
  match: any;
  open: boolean;
  competitionId: string;
  onClose: () => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1
    },
    formControl: {
      minWidth: 167
    },
    button: {
      margin: theme.spacing(1)
    }
  })
);
const InfoGen = (props: IInfoGenProps) => {
  const [, setNotification] = useContext(NotificationContext);
  const [showSablier, setShowSablier] = React.useState(false);
  const [currentCompetition, setCurrentCompetition] = useState<
    CompetitionEntity
  >(null);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setShowSablier(true);
        setCurrentCompetition(
          await apiCompetitions.getCompetition({ id: props.competitionId })
        );
      } finally {
        setShowSablier(false);
      }
    };
    fetchCompetition();
  }, []);

  const saveInfoGen = () => {
    const save = async () => {
      setShowSablier(true);
      try {
        await apiCompetitions.saveInfoGen({
          competitionEntity: currentCompetition
        });
      } catch (err) {
        setNotification({
          message: "Une erreur technique est survenue " + JSON.stringify(err),
          open: true,
          type: "error"
        });
        throw err;
      } finally {
        setShowSablier(false);
      }
      props.onClose();
    };
    save();
  };

  const classes = useStyles();
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        props.onClose();
      }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      {showSablier && (
        <div
          style={{
            position: "fixed",
            display: "block",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            cursor: "pointer"
          }}
        >
          <div style={{ position: "absolute", top: "40%", left: "40%" }}>
            <CircularProgress color="primary" />
          </div>
        </div>
      )}
      <DialogTitle
        style={{ backgroundColor: "#2d4889", color: "white" }}
        id="alert-dialog-title"
      >
        Informations épreuve
      </DialogTitle>
      <DialogContent style={{ width: 400, height: 450 }}>
        <div className={classes.root}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl className={classes.formControl}>
                <TextField
                  autoFocus={true}
                  required={false}
                  onChange={e => {
                    setCurrentCompetition({
                      ...currentCompetition,
                      speaker: e.target.value
                    });
                  }}
                  value={
                    currentCompetition && currentCompetition.speaker
                      ? currentCompetition.speaker
                      : ""
                  }
                  id="speaker"
                  label="Speaker"
                  margin="normal"
                />
              </FormControl>
              <FormControl className={classes.formControl}>
                <div style={{ paddingTop: 20 }}>Commissaires :</div>
                <TextareaAutosize
                  value={currentCompetition?.commissaires}
                  style={{ width: 355 }}
                  onChange={e => {
                    setCurrentCompetition({
                      ...currentCompetition,
                      commissaires: e.target.value
                    });
                  }}
                  rowsMin={5}
                  placeholder="Commissaire 1  Commissaire 2  Commissaire 3"
                />
              </FormControl>
              {currentCompetition?.competitionType ===
                CompetitionEntityCompetitionTypeEnum.CX && (
                <FormControl className={classes.formControl}>
                  <TextField
                    value={
                      currentCompetition && currentCompetition.aboyeur
                        ? currentCompetition.aboyeur
                        : ""
                    }
                    onChange={e => {
                      setCurrentCompetition({
                        ...currentCompetition,
                        aboyeur: e.target.value
                      });
                    }}
                    id="aboyeur"
                    label="Aboyeur CX"
                    margin="normal"
                  />
                </FormControl>
              )}
              <FormControl className={classes.formControl}>
                <div style={{ paddingTop: 20 }}>Notes diverses :</div>
                <TextareaAutosize
                  style={{ width: 355 }}
                  value={currentCompetition?.feedback}
                  onChange={e => {
                    setCurrentCompetition({
                      ...currentCompetition,
                      feedback: e.target.value
                    });
                  }}
                  rowsMin={5}
                  placeholder="Incidents de courses/Notes"
                />
              </FormControl>
              <FormControl
                style={{ display: "block" }}
                className={classes.formControl}
              >
                <Switch
                  checked={!!currentCompetition?.resultsValidated}
                  onChange={e => {
                    setCurrentCompetition(prev => {
                      return {
                        ...currentCompetition,
                        resultsValidated: !prev.resultsValidated
                      };
                    });
                  }}
                />{" "}
                Valider les classements
              </FormControl>
            </Grid>
          </Grid>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            props.onClose();
          }}
          variant={"contained"}
          color={"secondary"}
        >
          Annuler
        </Button>
        <Button
          onClick={async () => {
            saveInfoGen();
          }}
          variant={"contained"}
          color={"primary"}
        >
          Valider
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const styles = (theme: Theme) => ({});
export default withStyles(styles as any)(InfoGen as any) as any;
