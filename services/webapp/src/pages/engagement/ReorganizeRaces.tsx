import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import React, { useContext, useEffect, useState } from "react";
import TextField from "@material-ui/core/TextField";
import { CompetitionEntity as Competition, RaceRow } from "../../sdk";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Fab from "@material-ui/core/Fab";
import { Add, Delete, ThreeSixty } from "@material-ui/icons";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Badge from "@material-ui/core/Badge/Badge";
import { apiCompetitions } from "../../util/api";
import { NotificationContext } from "../../components/CadSnackbar";
import { ActionButton } from "../../components/ActionButton";
import { cadtheme } from "../../theme/theme";
import Tooltip from "@material-ui/core/Tooltip";

const styles = makeStyles(theme => ({
  button: {
    textTransform: "none",
    textDecoration: "underline"
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    "& [data-cp=field] input": {
      textAlign: "center"
    },
    "& [data-cp=icon]": {
      zoom: "57%",
      marginTop: 10,
      marginLeft: 10
    }
  },
  races: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 200,
    justifyContent: "center",
    paddingLeft: 10
  },
  categories: {
    display: "flex",
    alignSelf: "center",
    flex: 1,
    flexDirection: "column",
    color: theme.palette.grey[600],
    "& table": {
      borderCollapse: "collapse",
      justifySelf: "center",
      alignSelf: "center"
    },
    "& th": {
      textAlign: "left",
      paddingRight: 10
    },
    "& td": {
      border: "1px solid grey",
      textAlign: "center",
      padding: "0 10px 0 10px"
    },
    "& span": {
      justifySelf: "center",
      alignSelf: "center"
    }
  },
  badges: {
    "& span": {
      top: 14,
      right: 22
    }
  },
  errors: {
    color: theme.palette.error.main,
    alignSelf: "center"
  }
}));

const computeByRace = (rows: RaceRow[], categories: string[]): number => {
  return rows.filter(row => categories.indexOf("" + row.catev) >= 0).length;
};

const computeByCate = (rows: RaceRow[]) => {
  const catemap = rows.reduce((acc: { [catev: string]: number }, row) => {
    return {
      ...acc,
      [row.catev]: acc[row.catev] ? acc[row.catev] + 1 : 1
    };
  }, {});
  return Object.keys(catemap).map(catev => ({
    catev,
    participants: catemap[catev]
  }));
};

const computeErrors = (races: string[], categories: string[]) => {
  const messages = races
    .filter(race => !/^[a-zA-Z0-9]/.test(race))
    .filter(race => race.length !== 0)
    .map(input => `Saisie incorrecte "${input}"`);
  if (messages.length) {
    return messages;
  }

  const flatCategories = races
    .map(race => race.split("/"))
    .reduce((acc, cate) => [...acc, ...cate], []);
  const uniqueCategories = Array.from(new Set(flatCategories));
  const remaining = categories.filter(c => uniqueCategories.indexOf(c) < 0);

  if (remaining.length) {
    return [
      `Les inscrits en catégories ${remaining.join(
        ","
      )} n'ont pas été pris en charge`
    ];
  }

  if (flatCategories.length !== uniqueCategories.length) {
    return [`Certaines catégories sont renseignées en double`];
  }

  return [];
};

export const Reorganizer = ({
  tooltip,
  disabled,
  competition,
  rows,
  onSuccess
}: {
  tooltip: string;
  disabled: boolean;
  competition: Competition;
  rows: RaceRow[];
  onSuccess: () => void;
}) => {
  const [races, setRaces] = useState([]);
  const [open, setOpen] = useState(false);
  const [, setNotification] = useContext(NotificationContext);

  const classes = styles({});

  useEffect(() => {
    if (competition && competition.races) {
      setRaces(competition.races);
    }
  }, [open, competition]);

  const save = async () => {
    try {
      await apiCompetitions.reorganize({
        competitionReorganize: {
          competitionId: competition.id,
          races
        }
      });
      setNotification({
        message: `La compétition a été réorganisée avec succès`,
        type: "info",
        open: true
      });
      setOpen(false);
      onSuccess();
    } catch (e) {
      setNotification({
        message: `Une erreur s'est produite`,
        type: "error",
        open: true
      });
    }
  };

  const byCate = computeByCate(rows);
  const errors = computeErrors(
    races,
    byCate.map(c => c.catev)
  );
  return (
    <div>
      <Tooltip title={tooltip}>
        <span>
          <ActionButton
            color="primary"
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            <span style={{ color: "white" }}>
              <ThreeSixty
                style={{
                  color: "white",
                  verticalAlign: "middle"
                }}
              />
              Réorganiser la course
            </span>
          </ActionButton>
        </span>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Réorganiser les départs
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <Typography variant="body2">
            Ici, vous pouvez revoir les catégories de chaque courses, ajouter ou
            supprimer des courses...
          </Typography>
          <Box display="flex">
            <Races races={races} setRaces={setRaces} rows={rows} />
            <Categories byCate={byCate} />
          </Box>
          {errors.length === 0 ? (
            <br />
          ) : (
            errors.map((error, i) => (
              <span key={i} className={classes.errors}>
                {error}
              </span>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            variant="contained"
            color="secondary"
          >
            Annuler
          </Button>
          <Button
            onClick={() => save()}
            variant="contained"
            color="primary"
            disabled={errors.length > 0}
          >
            Réorganiser
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const Races = ({
  races,
  setRaces,
  rows
}: {
  races: string[];
  setRaces: (races: string[]) => void;
  rows: RaceRow[];
}) => {
  const classes = styles({});

  return (
    <Box className={classes.races}>
      {races.map((raceCode, i) => (
        <Box key={i} justifySelf="center" alignSelf="center">
          <Badge
            badgeContent={computeByRace(rows, raceCode.split("/"))}
            max={999}
            className={classes.badges}
            color="secondary"
          >
            <TextField
              data-cp="field"
              value={raceCode}
              onChange={e => {
                const newOne = [...races];
                newOne[i] = e.target.value;
                setRaces(newOne);
              }}
            />
          </Badge>
          {races.length > 1 && (
            <Fab
              color="primary"
              data-cp="icon"
              onClick={() => setRaces(races.filter((item, j) => i !== j))}
            >
              <Delete />
            </Fab>
          )}
          <Fab
            style={{
              visibility: i === races.length - 1 ? "visible" : "hidden"
            }}
            color="primary"
            data-cp="icon"
            onClick={() => setRaces([...races, ""])}
          >
            <Add />
          </Fab>
        </Box>
      ))}
    </Box>
  );
};

const Categories = ({
  byCate
}: {
  byCate: Array<{ catev: string; participants: number }>;
}) => {
  const classes = styles({});

  return (
    <Box className={classes.categories}>
      <table>
        <tbody>
          <tr>
            <th>Caté.:</th>
            {byCate.map(stat => (
              <td key={stat.catev}>{stat.catev}</td>
            ))}
          </tr>
          <tr>
            <th>Inscrits:</th>
            {byCate.map(stat => (
              <td key={stat.catev}>{stat.participants}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <span>Répartition des coureurs par catégories</span>
    </Box>
  );
};

