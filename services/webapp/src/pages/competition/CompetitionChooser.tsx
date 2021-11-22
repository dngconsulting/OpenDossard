import React, { useContext, useEffect, useState } from "react";
import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import cadtheme from "../../App";
import { apiCompetitions, apiRaces } from "../../util/api";
import {
  CompetitionEntity,
  CompetitionEntity as Competition,
  RaceRow
} from "../../sdk";
import { Link } from "react-router-dom";
import {
  Button,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Tooltip
} from "@material-ui/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toMMDDYYYY } from "../../util/date";
import moment from "moment";
import _ from "lodash";
import { NotificationContext } from "../../components/CadSnackbar";
import { styles } from "../../navigation/styles";
import { Delete, EditRounded } from "@material-ui/icons";

interface ICompetitionChooserProps {
  classes?: any;
  match: any;
  history: {
    push(url: any): void;
    location: any;
  };
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      height: "100%",
      padding: "5px"
    },
    titre: {
      padding: "10px",
      fontWeight: "bold"
    },
    nocomp: {
      padding: "20px"
    }
  })
);

const CompetitionChooser = (props: ICompetitionChooserProps) => {
  const [, setNotification] = useContext(NotificationContext);

  const [data, setData] = useState<CompetitionEntity[]>([]);
  const [raceRows, setRaceRows] = useState<RaceRow[]>([]);
  const [filteredData, setFilteredData] = useState<Competition[]>([]);
  const [selectPastOrFuture, setSelectPastOrFuture] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const classes = useStyles(cadtheme);
  const [competitionFilter, setCompetitionFilter] = useState({
    competitionTypes: ["ROUTE", "CX"],
    fedes: ["FSGT", "UFOLEP"],
    displayFuture: true,
    openedNL: false,
    openedToOtherFede: false,
    displayPast: true,
    displaySince: 600
  });

  const fetchCompetitions = async () => {
    try {
      const results = await apiCompetitions.getCompetitionsByFilter({
        competitionFilter
      });
      setData(results);
      const filter =
        props.history.location.hash && props.history.location.hash.substr(1);
      if (filter) {
        setSelectPastOrFuture(filter);
        filterData(results, filter);
      }
    } catch (ex) {
      setNotification({
        message: `Impossible de récupérer la liste des épreuves`,
        open: true,
        type: "error"
      });
    }
  };
  const fetchAllRaces = async () => {
    try {
      const results = await apiRaces.getRaces({
        competitionFilter: {
          displayFuture: true,
          displayPast: true
        }
      });
      setRaceRows(results);
    } catch (ex) {
      setNotification({
        message: `Impossible de récupérer la liste des participations`,
        open: true,
        type: "error"
      });
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        await fetchCompetitions();
        fetchAllRaces();
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [competitionFilter]);

  const goToPage = (competitionId: number, resultsPage?: string) => {
    props.history.push({
      pathname: `/competition/${competitionId}/${
        resultsPage ? resultsPage : "engagement"
      }`,
      state: { title: resultsPage ? "Résultats" : "Engagements" }
    });
  };

  const goToPageUpdate = (competitionId: number) => {
    props.history.push({
      pathname: `/competition/update/${competitionId}`,
      state: { title: "Modification épreuve" }
    });
  };

  const displayDate = (row: Competition) => {
    return toMMDDYYYY(row.eventDate);
  };

  const displayEngagement = (competition: Competition) => {
    const nbEngages = raceRows.filter(rr => rr.competitionId === competition.id)
      .length;
    return nbEngages > 0 ? (
      <Tooltip key="2" title="Editer les engagements">
        <a
          href="#"
          onClick={() => goToPage(competition.id, "engagement")}
          color="primary"
          style={{ marginRight: "0px" }}
        >
          {nbEngages} Engagé(s)
        </a>
      </Tooltip>
    ) : (
      <span>Aucun engagé</span>
    );
  };

  const displayClassement = (competition: Competition) => {
    const nbClasses = raceRows.filter(
      rr =>
        rr.competitionId === competition.id &&
        (rr.comment != null || rr.rankingScratch != null)
    ).length;
    return nbClasses > 0 ? (
      <Tooltip key="2" title="Editer/Visualiser les classements">
        <a
          href="#"
          onClick={() => goToPage(competition.id, "results/edit")}
          color="primary"
          style={{ marginRight: "0px" }}
        >
          {nbClasses} Classé(s)
        </a>
      </Tooltip>
    ) : (
      <span>Aucun classé</span>
    );
  };
  const filterData = (
    competition: CompetitionEntity[],
    targetValue: string
  ) => {
    if (targetValue === "all") {
      setFilteredData(competition);
    } else {
      setFilteredData(
        _.orderBy(
          competition.filter((comp: Competition) =>
            targetValue === "past"
              ? moment(comp.eventDate).isBefore(moment())
              : moment(comp.eventDate).isAfter(moment())
          ),
          ["event_date"],
          targetValue === "past" ? ["desc"] : ["asc"]
        )
      );
    }
  };
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetValue = event.target.value;
    setSelectPastOrFuture(targetValue);
    filterData(data, targetValue);
  };

  const setSelectedCompetition = (selectedCompetition: Competition) => {
    goToPage(selectedCompetition.id, "engagement");
  };

  const editIcon = (compRow: CompetitionEntity): JSX.Element => {
    return (
      <Tooltip title="Modifier cette épreuve">
        <EditRounded
          onClick={async (event: any) => {
            event.stopPropagation();
            goToPageUpdate(compRow.id);
          }}
          fontSize={"default"}
        />
      </Tooltip>
    );
  };

  const deleteIcon = (compRow: CompetitionEntity): JSX.Element => {
    return (
      <Tooltip title="Supprimer définitivement cette épreuve">
        <Delete
          onClick={async (event: any) => {
            event.stopPropagation();
            try {
              setLoading(true);
              const id = compRow.id;
              await apiCompetitions.deleteCompetition({ id });
              fetchCompetitions();
            } catch {
              setNotification({
                message: `L'épreuve' ${compRow.name} n'a pu être effacée`,
                type: "error",
                open: true
              });
            } finally {
              setLoading(false);
            }
          }}
          fontSize={"default"}
        />
      </Tooltip>
    );
  };

  return (
    <Paper className={classes.root}>
      <FormControl
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        component="fieldset"
      >
        <RadioGroup
          aria-label="races"
          name="races"
          value={setSelectPastOrFuture}
          onChange={handleChange}
          row={true}
        >
          <FormControlLabel
            value="past"
            label="Epreuves passées"
            control={
              <Link to="/competitions#past">
                <Radio
                  checked={selectPastOrFuture === "past"}
                  value="past"
                  name="radio-button-demo"
                />
              </Link>
            }
          />
          <FormControlLabel
            value="future"
            label="Epreuves à venir"
            control={
              <Link to="/competitions#future">
                <Radio
                  checked={selectPastOrFuture === "future"}
                  value="future"
                  name="radio-button-demo"
                />
              </Link>
            }
          />
          <FormControlLabel
            value="all"
            label="Toutes les épreuves"
            control={
              <Link to="/competitions#all">
                <Radio
                  checked={selectPastOrFuture === "all"}
                  value="all"
                  name="radio-button-demo"
                />
              </Link>
            }
          />
        </RadioGroup>

        <Select
          multiple
          style={{ width: 250 }}
          value={competitionFilter.fedes}
          //@ts-ignore
          renderValue={selected => selected.join(", ")}
          onChange={(event: any) => {
            setCompetitionFilter({
              ...competitionFilter,
              fedes: event.target.value
            });
          }}
        >
          <MenuItem key="FSGT" value={"FSGT"}>
            FSGT
          </MenuItem>
          <MenuItem key="UFOLEP" value={"UFOLEP"}>
            UFOLEP
          </MenuItem>
          <MenuItem key="CYCLOS" value={"CYCLOS"}>
            CYCLOS
          </MenuItem>
          <MenuItem key="FFC" value={"FFC"}>
            FFC
          </MenuItem>
          <MenuItem key="FFVELO" value={"FFVELO"}>
            FFVELO
          </MenuItem>
        </Select>
        <Select
          multiple
          style={{ marginLeft: 10, width: 150 }}
          value={competitionFilter.competitionTypes}
          //@ts-ignore
          renderValue={selected => selected.join(", ")}
          onChange={(event: any) => {
            setCompetitionFilter({
              ...competitionFilter,
              competitionTypes: event.target.value
            });
          }}
        >
          <MenuItem key="ROUTE" value={"ROUTE"}>
            ROUTE
          </MenuItem>
          <MenuItem key="CX" value={"CX"}>
            CX
          </MenuItem>
          <MenuItem key="VTT" value={"VTT"}>
            VTT
          </MenuItem>
        </Select>
      </FormControl>

      <Button
        style={{ position: "absolute", right: 25 }}
        variant={"contained"}
        color={"primary"}
        onClick={() => {
          props.history.push({
            pathname: "/competition/create",
            state: { title: "Création épreuve" }
          });
        }}
      >
        CRÉER UNE EPREUVE
      </Button>

      <div className={classes.titre}>
        Cliquer sur une épreuve pour Engager/Classer
      </div>

      <DataTable
        responsive={true}
        loading={loading}
        autoLayout={true}
        value={filteredData}
        emptyMessage="Aucune donnée ne correspond à la recherche"
        selectionMode="single"
        //setSelectedCompetition((filteredData[e.index]))
        //onSelectionChange={e => setSelectedCompetition(e.value)}
        onRowClick={(e: any) => {
          setSelectedCompetition(filteredData[e.index]);
        }}
      >
        <Column
          header="Engagements"
          body={displayEngagement}
          style={{ minWidth: "2%", textAlign: "center" }}
        />
        <Column
          header="Classements"
          body={displayClassement}
          style={{ minWidth: "5%", textAlign: "center" }}
        />
        <Column
          field="eventDate"
          header="Date"
          body={displayDate}
          style={{ minWidth: "2%" }}
        />
        <Column
          field="name"
          header="Nom de l'épreuve"
          style={{ minWidth: "2%" }}
        />
        <Column field="zipCode" header="Lieu" style={{ minWidth: "2%" }} />
        <Column
          field="club.longName"
          header="Club"
          style={{ minWidth: "5%" }}
        />
        <Column
          header="Catégories"
          body={(compRow: CompetitionEntity) => {
            return compRow.races.toString();
          }}
        />
        <Column field="fede" header="Fédération" style={{ minWidth: "5%" }} />
        <Column
          body={(compRow: CompetitionEntity) => editIcon(compRow)}
          style={{ minWidth: "2%" }}
        />
        <Column
          body={(compRow: CompetitionEntity) => deleteIcon(compRow)}
          style={{ minWidth: "2%" }}
        />
      </DataTable>
    </Paper>
  );
};
export default withStyles(styles as any, { withTheme: true })(
  CompetitionChooser as any
);
