import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import React, { useLayoutEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { apiChallenge, apiCompetitions } from '../../util/api';
import { Column } from 'primereact/column';
import { ChallengeDTO, ChallengeRider, CompetitionEntity } from '../../sdk';
import _ from 'lodash';
import Tab from '@material-ui/core/Tab';
import Badge from '@material-ui/core/Badge';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Checkbox, FormControlLabel, Tooltip } from '@material-ui/core';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import { LoaderIndicator } from '../../components/LoaderIndicator';
import Button from '@material-ui/core/Button';
import { PictureAsPdf } from '@material-ui/icons';
import { exportPdf, getAllCates, getAllGenders } from './challenge-utils';

const rowClass = data => {
  return { 'ui-state-highlight': true };
};

const useStyles = makeStyles(theme => ({
  customWidth: {
    minWidth: 500
  }
}));

export const ChallengePage = (props: any) => {
  const [rowRaces, setRowRaces] = useState<ChallengeRider[]>([]);
  const [challenge, setChallenge] = useState<ChallengeDTO>();
  const [competitions, setCompetitions] = useState<CompetitionEntity[]>([]);
  const [expandedRows, setExpandedRows] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCate, setCurrentCate] = useState(null);
  const [currentGender, setCurrentGender] = useState('H');
  const theme = useTheme();
  const classes = useStyles();
  const allGendersCate = getAllGenders(rowRaces);
  const allCates = getAllCates(rowRaces.filter(rr => rr.gender === currentGender));
  const data = _.uniqBy(rowRaces, 'licenceId').filter(
    rr => rr.currentLicenceCatev === currentCate && rr.gender === currentGender
  );

  useLayoutEffect(() => {
    const f = async () => {
      try {
        setIsLoading(true);
        const challenge: ChallengeDTO = await apiChallenge.getChallengeById({ id: props.match.params.id });
        setChallenge(challenge);
        const competitions = await apiCompetitions.getCompetitionByIds({
          competitionIdsDTO: { ids: challenge.competitionIds }
        });
        setCompetitions(competitions);
        if (challenge.competitionIds) {
          const rowRaces = await apiChallenge.calculChallenge({ id: challenge.id });
          setRowRaces(rowRaces);
          const cates = getAllCates(rowRaces);
          if (cates.length > 0) setCurrentCate(cates[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    f();
  }, []);

  const ChallengeTabs = ({ rowRaces }) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10
        }}
      >
        {rowRaces?.length > 0 && (
          <Button
            style={{ marginRight: 10 }}
            variant="contained"
            color="primary"
            onClick={() => exportPdf(challenge, rowRaces)}
          >
            <PictureAsPdf style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Export PDF
          </Button>
        )}

        {allCates.map((catev, index) => {
          return (
            <Tab
              style={{
                borderWidth: '0.5px',
                borderColor: theme.palette.grey['400'],
                borderStyle: 'solid',
                backgroundColor: theme.palette.grey['300']
              }}
              onChange={() => {
                setCurrentCate(catev);
              }}
              selected={catev === currentCate}
              key={catev}
              value={catev}
              label={<Badge color="secondary">Caté. {catev}</Badge>}
            />
          );
        })}
        {allGendersCate.includes('H') && (
          <FormControlLabel
            style={{ marginLeft: 10 }}
            control={
              <Checkbox
                checked={currentGender === 'H'}
                onChange={() => {
                  setCurrentGender('H');
                }}
                name="Hommes"
                color="primary"
              />
            }
            label="Hommes"
          />
        )}
        {allGendersCate.includes('F') && (
          <FormControlLabel
            control={
              <Checkbox
                checked={currentGender === 'F'}
                onChange={() => {
                  setCurrentGender('F');
                }}
                name="Dames"
                color="primary"
              />
            }
            label="Dames"
          />
        )}
      </div>
    );
  };

  const rowExpansionTemplate = data => {
    return (
      <div className="p-3">
        <h3 style={{ marginLeft: 10 }}>{data.firstName + ' ' + data.name}</h3>
        <DataTable rowClassName={rowClass} autoLayout={true} style={{ margin: 10 }} value={data.challengeRaceRows}>
          <Column
            field="competitionName"
            body={data => {
              return (
                <Tooltip title={'CTRL+CLIC pour ouvrir dans un nouvel onglet'}>
                  <a href={`/competition/${data.competitionId}/results/edit#${data.catev}`}>{data.competitionName}</a>
                </Tooltip>
              );
            }}
            header="Course"
          ></Column>
          <Column
            field="eventDate"
            body={data => {
              return new Date(Date.parse(data.eventDate)).toLocaleDateString('fr');
            }}
            header="Date"
          ></Column>
          <Column field="catev" header="Catégorie"></Column>
          <Column field="rankingScratch" header="Classement"></Column>
          <Column field="ptsRace" header="Points par épreuve"></Column>
          <Column field="explanation" header="Explications"></Column>
        </DataTable>
      </div>
    );
  };
  return (
    <div style={{ margin: 10 }}>
      <h1 style={{ textAlign: 'center' }}>{challenge?.name}</h1>
      <Tooltip
        enterDelay={500}
        classes={{ tooltip: classes.customWidth }}
        title={
          <h4>
            <ul>
              {competitions?.map(c => {
                return <li>{`(${c.id}) ${c.name} le ${c.eventDate.toLocaleDateString('fr')}`}</li>;
              })}
            </ul>
          </h4>
        }
      >
        <h4 style={{ textAlign: 'center' }}>
          <a href={'#'}>Liste des épreuves concernées par ce challenge</a>
        </h4>
      </Tooltip>

      <ChallengeTabs rowRaces={rowRaces} />

      {currentCate ? (
        <DataTable
          paginator={false}
          rowExpansionTemplate={rowExpansionTemplate}
          expandedRows={expandedRows}
          onRowToggle={e => setExpandedRows(e.data)}
          currentPageReportTemplate="De {first} à {last} sur {totalRecords} coureurs"
          responsive={true}
          loading={isLoading}
          resizableColumns
          autoLayout={true}
          value={data}
          emptyMessage="Aucune épreuve ne correspond à la recherche"
          selectionMode="single"
        >
          <Column expander={true} style={{ width: '1rem' }} />
          <Column
            header="Clt."
            body={(_, { rowIndex }) => {
              return (
                <div style={{ textAlign: 'center' }}>
                  {rowIndex + 1 <= 3 ? (
                    <EmojiEventsIcon
                      style={{
                        verticalAlign: 'middle',
                        color: ['#efd807', '#D7D7D7', '#6A3805'][rowIndex]
                      }}
                      fontSize={'small'}
                    />
                  ) : (
                    <span>{rowIndex + 1}</span>
                  )}
                </div>
              );
            }}
          />
          <Column
            field="name"
            header="Nom"
            bodyStyle={{ textAlign: 'left' }}
            filter={true}
            filterMatchMode={'contains'}
          />
          <Column field="firstName" header="Prénom" filter={true} filterMatchMode={'contains'} />
          <Column field="currentClub" header="Club actuel" filter={true} filterMatchMode={'contains'} />
          <Column field="currentLicenceCatev" header="Catégorie actuelle" filter={true} filterMatchMode={'contains'} />
          <Column
            field="currentLicenceCatea"
            header="Catégorie d'age actuelle"
            filter={true}
            filterMatchMode={'contains'}
          />
          <Column field="ptsAllRaces" header="Points acquis" filter={true} filterMatchMode={'contains'} />
          <Column field="explanation" header="Explications" />
        </DataTable>
      ) : !isLoading ? (
        <h2 style={{ textAlign: 'center', color: 'red' }}>
          Aucun classement disponible pour les épreuves de ce challenge (ou paramétrage du challenge incorrect)
        </h2>
      ) : (
        <>
          <h2 style={{ textAlign: 'center' }}>Veuillez patienter pendant le calcul ...</h2>
          <LoaderIndicator visible={true} />
        </>
      )}
    </div>
  );
};
