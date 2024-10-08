import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import React, { useLayoutEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { apiChallenge, apiRaces } from '../../util/api';
import { Column } from 'primereact/column';
import { ChallengeDTO, ChallengeRider } from '../../sdk';
import _ from 'lodash';
import Tab from '@material-ui/core/Tab';
import Badge from '@material-ui/core/Badge';
import { useTheme } from '@material-ui/core/styles';

const rowClass = data => {
  return { 'ui-state-highlight': true };
};

const getAllCates = rRaces =>
  _.uniqBy(
    _.flatMap(rRaces, rr => rr.challengeRaceRows),
    'catev'
  ).map(c => c.catev);

export const ChallengePage = (props: any) => {
  const [rowRaces, setRowRaces] = useState<ChallengeRider[]>([]);
  const [challenge, setChallenge] = useState<ChallengeDTO>();
  const [expandedRows, setExpandedRows] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCate, setCurrentCate] = useState(null);
  const theme = useTheme();
  useLayoutEffect(() => {
    const f = async () => {
      try {
        setIsLoading(true);
        const challenge: ChallengeDTO = await apiChallenge.getChallengeById({ id: props.match.params.id });
        setChallenge(challenge);
        if (challenge.competitionIds) {
          const rowRaces = await apiRaces.getCompetitionRacesByFilter({
            raceFilter: { competitionIds: challenge.competitionIds, gender: 'H' }
          });
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

  const ChallengeTabs = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {getAllCates(rowRaces).map((catev, index) => {
          return (
            <Tab
              style={{
                backgroundColor: theme.palette.grey['300'],
                paddingLeft: 20,
                paddingRight: 30
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
      </div>
    );
  };

  const rowExpansionTemplate = data => {
    return (
      <div className="p-3">
        <h3 style={{ marginLeft: 10 }}>{data.firstName + ' ' + data.name}</h3>
        <DataTable rowClassName={rowClass} autoLayout={true} style={{ margin: 10 }} value={data.challengeRaceRows}>
          <Column field="competitionName" header="Course"></Column>
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
        </DataTable>
      </div>
    );
  };
  return (
    <>
      <h1 style={{ textAlign: 'center', marginLeft: 10 }}>{challenge?.name}</h1>
      <ChallengeTabs />
      {currentCate ? (
        <DataTable
          style={{ margin: 10 }}
          paginator={true}
          rowExpansionTemplate={rowExpansionTemplate}
          expandedRows={expandedRows}
          onRowToggle={e => setExpandedRows(e.data)}
          currentPageReportTemplate="De {first} à {last} sur {totalRecords} coureurs"
          responsive={true}
          loading={isLoading}
          resizableColumns
          autoLayout={true}
          value={_.uniqBy(rowRaces, 'licenceId').filter(rr => rr.currentLicenceCatev === currentCate)}
          emptyMessage="Aucune épreuve ne correspond à la recherche"
          selectionMode="single"
        >
          <Column expander={true} style={{ width: '1rem' }} />
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
        </DataTable>
      ) : !isLoading ? (
        <h2 style={{ textAlign: 'center', color: 'red' }}>
          Aucun classement disponible pour les épreuves de ce challenge (ou paramétrage du challenge incorrect)
        </h2>
      ) : (
        <h2 style={{ textAlign: 'center' }}>Chargement et calcul en cours ...</h2>
      )}
    </>
  );
};
