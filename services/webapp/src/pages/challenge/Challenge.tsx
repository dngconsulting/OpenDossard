import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import React, { useLayoutEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { apiRaces } from '../../util/api';
import { Column } from 'primereact/column';
import { ChallengeRider } from '../../sdk';
import _ from 'lodash';

export const ChallengePage = (props: any) => {
  const [rowRaces, setRowRaces] = useState<ChallengeRider[]>([]);
  const [expandedRows, setExpandedRows] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    const f = async () => {
      try {
        setIsLoading(true);
        const rowRaces = await apiRaces.getCompetitionRacesByFilter({
          raceFilter: { competitionIds: [836, 945, 947, 951, 954, 835, 944, 950, 953, 946], gender: 'H' }
        });
        setRowRaces(rowRaces);
      } finally {
        setIsLoading(false);
      }
    };
    f();
  }, []);

  const rowExpansionTemplate = data => {
    return (
      <div className="p-3">
        <h3 style={{ marginLeft: 10 }}>{data.firstName + ' ' + data.name}</h3>
        <DataTable autoLayout={true} style={{ margin: 10 }} value={data.challengeRaceRows}>
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
          <Column field="ptsRace" header="Points de la course"></Column>
        </DataTable>
      </div>
    );
  };
  return (
    <>
      <h1 style={{ marginLeft: 10 }}>Challenge des nocturnes </h1>
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
        value={_.uniqBy(rowRaces, 'licenceId')}
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
        <Column field="currentLicenceCatev" header="Catégorie actuelle" filter={true} filterMatchMode={'contains'} />
        <Column field="ptsAllRaces" header="Points acquis" filter={true} filterMatchMode={'contains'} />
      </DataTable>
    </>
  );
};
