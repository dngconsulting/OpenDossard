import React, { useContext, useState } from "react";
import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import cadtheme from "../../App";
import { apiCompetitions } from "../../util/api";
import {
  CompetitionEntity,
  CompetitionEntity as Competition,
  RaceRow
} from "../../sdk";
import { Tooltip } from "@material-ui/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toMMDDYYYY } from "../../util/date";
import { NotificationContext } from "../../components/CadSnackbar";
import { styles } from "../../navigation/styles";
import { Delete, EditRounded } from "@material-ui/icons";
import { ConfirmDialog } from "../../util";
import { CompetitionFilterPanel } from "../../components/CompetitionFilterPanel";

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
      padding: "10px"
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
  const [open, openDialog] = React.useState(false);
  const [competitionToDelete, setCompetitionToDelete] = React.useState(null);
  const [raceRows, setRaceRows] = useState<RaceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const classes = useStyles(cadtheme);

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
            openDialog(true);
            setCompetitionToDelete(compRow);
          }}
          fontSize={"default"}
        />
      </Tooltip>
    );
  };

  return (
    <Paper className={classes.root}>
      <ConfirmDialog
        title={"Attention"}
        question={
          "Êtes-vous sûr de vouloir supprimer DEFINITIVEMENT cette épreuve (s'il existe un coureur engagé, cette suppression sera interdite) ?"
        }
        open={open}
        confirmMessage={"Oui je souhaite supprimer cette épreuve"}
        cancelMessage={"Non"}
        handleClose={() => openDialog(false)}
        handleOk={async () => {
          openDialog(false);
          try {
            setLoading(true);
            const id = competitionToDelete.id;
            await apiCompetitions.deleteCompetition({ id });
            setRefreshData(!refreshData);
          } catch {
            setNotification({
              message: `L'épreuve' ${competitionToDelete.name} n'a pu être effacée`,
              type: "error",
              open: true
            });
          } finally {
            setLoading(false);
          }
        }}
      />
      <CompetitionFilterPanel
        history={props.history}
        refreshData={refreshData}
        setData={setData}
        setRaceRows={setRaceRows}
        setLoading={setLoading}
      />

      <div className={classes.titre}>
        {data?.length} épreuve(s) affichée(s), cliquez sur une ligne pour
        Engager/Classer
      </div>

      <DataTable
        paginator={true}
        currentPageReportTemplate="De {first} à {last} sur {totalRecords} épreuves"
        rows={100}
        rowsPerPageOptions={[10, 20, 50]}
        responsive={true}
        loading={loading}
        resizableColumns
        autoLayout={true}
        value={data}
        emptyMessage="Aucune épreuve ne correspond à la recherche"
        selectionMode="single"
        onRowClick={(e: any) => {
          console.log("Select " + JSON.stringify(e.data.id));
          setSelectedCompetition(data.find(d => d.id === e.data.id));
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
          sortable={true}
          body={displayDate}
          style={{ minWidth: "2%" }}
        />
        <Column
          field="name"
          header="Nom de l'épreuve"
          sortable={true}
          filter={true}
          filterMatchMode={"contains"}
          style={{ minWidth: "2%" }}
        />
        <Column
          field="zipCode"
          sortable={true}
          filter={true}
          filterMatchMode={"contains"}
          header="Lieu"
          style={{ minWidth: "2%" }}
        />
        <Column
          sortable={true}
          filter={true}
          filterMatchMode={"contains"}
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
        <Column
          field="fede"
          filterHeaderStyle={{ minWidth: 100 }}
          sortable={true}
          header="Fédé."
          style={{ textAlign: "center", minWidth: "5%" }}
        />
        <Column
          body={(compRow: CompetitionEntity) => editIcon(compRow)}
          style={{ textAlign: "center", minWidth: "2%" }}
        />
        <Column
          header="Type"
          sortable={true}
          filterHeaderStyle={{ minWidth: 100 }}
          field={"competitionType"}
          style={{ minWidth: "2%", textAlign: "center" }}
        />
        <Column
          body={(compRow: CompetitionEntity) => deleteIcon(compRow)}
          style={{ textAlign: "center", minWidth: "2%" }}
        />
      </DataTable>
    </Paper>
  );
};
export default withStyles(styles as any, { withTheme: true })(
  CompetitionChooser as any
);
