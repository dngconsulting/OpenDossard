import React, { Fragment, useContext, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { CompetitionLayout } from '../competition/CompetitionLayout';
import { CompetitionEntityCompetitionTypeEnum, RaceRow } from '../../sdk/models';
import _ from 'lodash';
import SearchIcon from '@material-ui/icons/Search';
import { NotificationContext } from '../../components/CadSnackbar';
import { apiRaces } from '../../util/api';
import { filterByRace } from '../../util/services';
import { CloudDownload, Delete, Edit, PictureAsPdf } from '@material-ui/icons';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import { Fab, IconButton, Tooltip, withStyles } from '@material-ui/core';
import { Column } from 'primereact/column';
import { withRouter } from 'react-router';
import demodnf from '../../assets/images/demodnf.gif';
import { AlertDialog } from '../../alert/Alert';
import InfoGen from './InfoGen';
import { displayDossard, useWindowDimensions } from '../../util';
import { Link } from 'react-router-dom';
import { ActionButton } from '../../components/ActionButton';
import ExpandMore from '@material-ui/icons/ExpandMore';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { cadtheme } from '../../theme/theme';
import { DropdownMenu, DropdownMenuItem } from '../../components/DropdownMenu';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { exportCsv } from '../../util/csv';
import { podiumsPDF, resultsPDF } from '../../reports';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import '../../theme/global.css';
import { FileUpload } from 'primereact/fileupload';
import { ReduxState } from '../../state/ReduxState';
import { connect } from 'react-redux';

const previousRowEmpty = (index: number, transformedRows: any) => {
  return index > 0 && transformedRows[index - 1].riderNumber === undefined;
};

const currentToursValue = allprops => {
  return parseInt(allprops.value[allprops.rowIndex][allprops.field]);
};
const previousToursValues = allprops => {
  return allprops.rowIndex > 0 && parseInt(allprops.value[allprops.rowIndex - 1][allprops.field]);
};

type ListOfDNF = 'DSQ' | 'ABD' | 'NC' | 'NP' | 'CHT' | 'HD' | 'DNV' | null;
const EditResultsPage = (gprops: any) => {
  const [selectedRows, setSelectedRows] = useState<RaceRow[]>([]);
  const { height, width } = useWindowDimensions();
  const competitionId = gprops.match.params.id;
  const isEdit = true;
  const fromPalmaresLicenceId = new URLSearchParams(gprops.location.search).get('palmares');
  const dg = useRef(null);
  const [showDNFDialog, setShowDNFDialog] = useState(false);
  const [modeDNFActivated, setModeDNFActivated] = useState<ListOfDNF>(null);
  const [, setNotification] = useContext(NotificationContext);
  const [currentDossard, setCurrentDossard] = useState('');
  const [currentChrono, setCurrentChrono] = useState('');
  const [openInfoGen, setOpenInfoGen] = useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  const [loading, setLoading] = useState(false);
  const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState(null);

  const transformRows = (rows: RaceRow[]) => {
    const sortedByRankingWithoutABD = _.remove(
      _.orderBy(rows, ['rankingScratch'], ['asc']),
      (item: RaceRow) => item.comment == null
    );
    const sortedByRanking = _.union(
      sortedByRankingWithoutABD,
      rows.filter(item => item.comment !== null)
    );
    return sortedByRanking.map((item: any, index: number) => {
      let classementToDisplay = '';
      if (item.comment != null) {
        classementToDisplay = item.comment;
      } else if (item.rankingScratch != null) {
        classementToDisplay = item.rankingScratch;
      } else {
        classementToDisplay = modeDNFActivated ?? String(index + 1);
      }
      return {
        uid: index,
        classement: classementToDisplay,
        ...(item.rankingScratch !== null || item.comment !== null ? { ...item } : {})
      };
    });
  };
  const dossardEditor = (allprops: any, rows: RaceRow[], transformedRows: any, currentRace: string, fetchRows: any) => {
    return (
      <InputText
        defaultValue={allprops.rowData.riderNumber ? _.padStart(allprops.rowData.riderNumber, 3, '0') : ''}
        keyfilter="pint"
        type="text"
        style={{ height: '1.5em', textAlign: 'center' }}
        onChange={async (e: any) => {
          setCurrentDossard(e.target.value);
        }}
      />
    );
  };

  const chronoEditor = (allprops: any, rows: RaceRow[], transformedRows: any, currentRace: string, fetchRows: any) => {
    return (
      <InputText
        defaultValue={allprops.rowData.chrono}
        type="time"
        step="1"
        style={{ height: '1.5em', textAlign: 'center' }}
        onChange={async (e: any) => {
          setCurrentChrono(e.target.value);
        }}
      />
    );
  };

  const dossardValidator = async (
    allprops: any,
    fetchRows: any,
    currentRace: string,
    transformedRows: any,
    rows: RaceRow[]
  ): Promise<boolean> => {
    const currentRanking = transformedRows[allprops.rowIndex].classement;

    if (!isNaN(currentRanking) && previousRowEmpty(allprops.rowIndex, transformedRows)) {
      if (currentDossard && currentDossard.trim().length > 0) {
        setNotification({
          message: 'Veuillez saisir le dossard ' + currentDossard + ' de manière consécutif aux autres',
          type: 'error',
          open: true
        });
      }
      setCurrentDossard('');
      return true;
    }

    if (
      rows.filter(item => item.riderNumber === parseInt(currentDossard) && item.rankingScratch !== currentRanking)
        .length > 0
    ) {
      try {
        setLoading(true);
        setCurrentDossard('');
        await apiRaces.updateRanking({
          raceRow: {
            riderNumber: parseInt(currentDossard),
            raceCode: currentRace,
            competitionId: parseInt(competitionId),
            ...(modeDNFActivated !== null
              ? {
                  comment: modeDNFActivated,
                  rankingScratch: null
                }
              : { rankingScratch: parseInt(currentRanking), comment: null })
          }
        });

        const lrows = await fetchRows();
        setNotification({
          message: `Le coureur ${
            lrows.find((item: any) => item.riderNumber === parseInt(currentDossard) && item.raceCode === currentRace)
              .name
          } vient d'etre classé ${currentRanking} `,
          type: 'info',
          open: true
        });
      } catch (response) {
        const jsonError = await response.json();
        setNotification({
          message: `La mise à jour a échouée ${jsonError.message ? jsonError.message : ''}`,
          type: 'error',
          open: true
        });
        setCurrentDossard('');
      } finally {
        setLoading(false);
      }
    } else {
      if (currentDossard && currentDossard.trim().length > 0) {
        setNotification({
          message: 'Le numéro de dossard ' + currentDossard + " n'a pas été engagé ou est incorrect",
          type: 'error',
          open: true
        });
        setCurrentDossard('');
        return false;
      }
    }
    return true;
  };

  const chronoValidator = async (
    allprops: any,
    fetchRows: any,
    currentRace: string,
    transformedRows: any,
    rows: RaceRow[]
  ): Promise<boolean> => {
    try {
      if (currentChrono === '') return false;
      setLoading(true);
      await apiRaces.updateChrono({
        raceId: allprops.rowData.id,
        chrono: currentChrono
      });
      const lrows = await fetchRows();
      setNotification({
        message: `Le chrono du coureur vient d'etre mis à jour  `,
        type: 'info',
        open: true
      });
      setCurrentChrono('');
    } catch (response) {
      const jsonError = await response.json();
      setNotification({
        message: `La mise à jour a échouée ${jsonError.message ? jsonError.message : ''}`,
        type: 'error',
        open: true
      });
      setCurrentChrono('');
    } finally {
      setLoading(false);
    }
    return true;
  };

  const debUpdateTours = async (value, allprops, fetchRows) =>
    await updateTours(isNaN(parseInt(value)) ? undefined : parseInt(value), allprops, fetchRows);
  const debouncedUpdateTours = AwesomeDebouncePromise(debUpdateTours, 500);

  const toursEditor = (allprops: any, rows: RaceRow[], transformedRows: any, currentRace: string, fetchRows: any) => {
    return (
      <InputText
        defaultValue={
          !isNaN(currentToursValue(allprops))
            ? currentToursValue(allprops)
            : !isNaN(previousToursValues(allprops))
            ? previousToursValues(allprops)
            : null
        }
        type="number"
        step="1"
        style={{ height: '1.5em', textAlign: 'center' }}
        onKeyDown={async (e: any) => {
          if (e.keyCode == 13) {
            debUpdateTours(e.target.value, allprops, fetchRows);
          }
        }}
        onBlur={async (e: any) => {
          if (e.target.value.trim() === '' && isNaN(currentToursValue(allprops))) return;
          debouncedUpdateTours(e.target.value, allprops, fetchRows);
        }}
      />
    );
  };

  const updateTours = async (tours: number | undefined, allprops: any, fetchRows: any) => {
    try {
      setLoading(true);
      await apiRaces.updateTours({
        updateToursParams: {
          raceId: allprops.rowData.id,
          tours: tours
        }
      });
      const lrows = await fetchRows();
      setNotification({
        message: `Le nombre de tours du coureur vient d'etre mis à jour  `,
        type: 'info',
        open: true
      });
    } catch (response) {
      const jsonError = await response.json();
      setNotification({
        message: `La mise à jour a échouée ${jsonError.message ? jsonError.message : ''}`,
        type: 'error',
        open: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getMedalColorForRank = (ranking: number | string, rankingScratch: number): string => {
    return ranking <= 3 || rankingScratch <= 3
      ? ['#efd807', '#D7D7D7', '#6A3805'][Math.min(rankingScratch, ranking as number) - 1]
      : '#fff';
  };
  const getPodiumTitle = (rankCate: number, rankScratch: number) => {
    let title = '';
    switch (rankScratch) {
      case 1:
        title += 'Vainqueur au scratch ';
        break;
      case 2:
        title += '2ème au scratch ';
        break;
      case 3:
        title += '3ème au scratch ';
        break;
    }
    switch (rankCate) {
      case 1:
        title += 'Vainqueur dans sa catégorie ';
        break;
      case 2:
        title += '2ème dans sa catégorie ';
        break;
      case 3:
        title += '3ème dans sa catégorie ';
        break;
    }
    return title;
  };

  return (
    <CompetitionLayout history={gprops.history} displayType={'results'} competitionId={competitionId}>
      {({ competition, currentRace, rows, fetchRows, fetchCompetition }) => {
        const transformedRows = transformRows(filterByRace(rows, currentRace));
        const callFlagChallenge = async (row: RaceRow) => {
          try {
            setLoading(true);
            await apiRaces.flagChallenge({ raceRow: row });
            await fetchRows();
          } finally {
            setLoading(false);
          }
        };

        const rankOfCate = (rowdata: any, transformedRows: any): string | number => {
          let rankToReturn;
          // If the rider federation is not the hosting race fede, rank that differently
          // https://github.com/dngconsulting/OpenDossard/issues/91
          if (rowdata.gender === 'F') {
            rankToReturn =
              transformedRows
                .filter((v: RaceRow) => v.gender === 'F')
                .findIndex((item: RaceRow) => item.id === rowdata.id) + 1;
          } else {
            rankToReturn =
              transformedRows
                .filter((v: RaceRow) => v.catev === rowdata.catev)
                .findIndex((item: RaceRow) => item.id === rowdata.id) + 1;
          }

          return rankToReturn === 0 ? '' : rankToReturn;
        };

        const AddWinnersIcons = (props: any) => {
          if (props.rowdata.rankingScratch) {
            const lrankOfCate: string | number = rankOfCate(props.rowdata, props.transformedRows);
            if (lrankOfCate <= 3 || props.rowdata.rankingScratch <= 3) {
              return (
                <Tooltip title={getPodiumTitle(lrankOfCate as number, props.rowdata.rankingScratch)}>
                  <EmojiEventsIcon
                    style={{
                      verticalAlign: 'middle',
                      color: getMedalColorForRank(lrankOfCate, props.rowdata.rankingScratch)
                    }}
                    fontSize={'small'}
                  />
                </Tooltip>
              );
            }
          }
          return null;
        };

        const displayRank = (rowdata: any) => {
          return (
            rowdata.classement +
            (rankOfCate(rowdata, transformedRows) !== '' && !isNaN(rowdata.classement) && rowdata.riderNumber
              ? ' (' + rankOfCate(rowdata, transformedRows) + ')'
              : '')
          );
        };

        const displayRankOfCate = (rowdata: any, transformedRows: any) => {
          if (rowdata.comment !== null) {
            return rowdata.classement;
          }
          return rankOfCate(rowdata, transformedRows);
        };
        const getTitleChallengeButton = (row: RaceRow) => {
          return row.sprintchallenge ? 'Enlever ce vainqueur du challenge' : 'Ajouter comme vainqueur du challenge';
        };

        const reorder = async (e: any) => {
          try {
            setLoading(true);
            await apiRaces.reorderRanking({ raceRow: e.value });
            await fetchRows();
          } finally {
            setLoading(false);
          }
        };
        const displayName = (rowdata: RaceRow, column: any) => {
          return (
            <span>
              <AddWinnersIcons rowdata={rowdata} transformedRows={transformedRows} />
              {rowdata.sprintchallenge && (
                <Tooltip title="Vainqueur du challenge du meilleur sprinter">
                  <EmojiPeopleIcon
                    style={{
                      verticalAlign: 'middle'
                    }}
                  />
                </Tooltip>
              )}
              {rowdata.name}
            </span>
          );
        };

        const exportCSV = async races => {
          const allRows: any[][] = [];
          races.forEach((currentRace: string) => {
            const filteredRowsByRace = transformRows(filterByRace(rows, currentRace));
            const r = filteredRowsByRace.map(row => {
              return {
                ...row,
                ...{
                  bycate: isNaN(row.classement)
                    ? row.classement
                    : rankOfCate(
                        { id: row.id, gender: row.gender, catev: row.catev, fede: row.fede },
                        filteredRowsByRace
                      )
                }
              };
            });
            allRows.push(...r);
          });
          const avecTours = allRows.filter((r: any) => r.tours).length > 0;
          await exportCsv(
            [
              { header: 'Cl.Scratch', field: 'classement' },
              { header: 'Dossard', field: 'riderNumber' },
              { header: 'Nom', field: 'name' },
              { header: 'Club', field: 'club' },
              { header: 'Sexe', field: 'gender' },
              { header: 'Dept', field: 'dept' },
              { header: 'Année Naiss.', field: 'birthYear' },
              { header: 'CateV', field: 'catev' },
              { header: 'CateA', field: 'catea' },
              ...(competition.avecChrono ? [{ header: 'Chrono', field: 'chrono' }] : []),
              ...(avecTours ? [{ header: 'Tours', field: 'tours' }] : []),
              { header: 'Cl. Caté', field: 'bycate' },
              { header: 'Num. Licence', field: 'licenceNumber' },
              { header: 'Fede', field: 'fede' },
              { header: 'Course', field: 'raceCode' }
            ],
            _.orderBy(allRows, ['raceCode'], ['asc']),
            `${competition.name}-${competition.eventDate.toISOString()}.csv`
          );
        };

        const getChallengeWinners = (filteredRows: any) => {
          const winners = filteredRows.filter((r: RaceRow) => r.sprintchallenge).map((r: RaceRow) => r.name);
          if (winners.length === 0) return 'NC';
          return winners.join(',');
        };

        const exportResultsPDF = async (races: string[]) => {
          resultsPDF(races, rows, competition, transformRows, filterByRace, displayRankOfCate, getChallengeWinners);
        };

        const flagchallenge = (row: RaceRow) =>
          row.riderNumber && [
            <Tooltip key={1} title={getTitleChallengeButton(row)}>
              <EmojiPeopleIcon onClick={e => callFlagChallenge(row)} />
            </Tooltip>,
            row.sprintchallenge && (
              <Tooltip key={2} title={getTitleChallengeButton(row)}>
                <Delete onClick={e => callFlagChallenge(row)} key={2} style={{ height: 15, width: 15 }} />
              </Tooltip>
            )
          ];
        return (
          <Fragment>
            {showDNFDialog && (
              <AlertDialog
                data={{
                  title: 'Notification',
                  buttons: [
                    {
                      label: 'OK',
                      handler: () => {
                        setShowDNFDialog(false);
                        setModeDNFActivated('NC');
                      }
                    }
                  ]
                }}
                handleClose={() => {
                  setShowDNFDialog(false);
                }}
              >
                <Fragment>
                  <div>
                    Vous allez passer en mode Saisie des abandons, il vous suffit de cliquer dans la colonne
                    'Classements' et de sélectionner les motifs d'abandon dans la liste proposée. Voir la démonstration
                    ci-dessous.
                  </div>
                  <br />
                  <img src={demodnf} />
                </Fragment>
              </AlertDialog>
            )}
            {openInfoGen && (
              <InfoGen
                onClose={async () => {
                  setOpenInfoGen(false);
                  await fetchCompetition();
                }}
                open={true}
                competitionId={competition?.id}
              />
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: '#3333330d',
                cursor: 'pointer',
                justifyContent: 'space-between',
                padding: '5px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                {isEdit && (
                  <>
                    <ToggleButtonGroup
                      style={{ margin: 5 }}
                      value={modeDNFActivated}
                      exclusive
                      onChange={(event, newValue) => {
                        setModeDNFActivated(newValue);
                      }}
                      aria-label="text alignment"
                    >
                      <ToggleButton
                        title={'Lorsque ce bouton poussoir est sélectionné, tout dossard saisi est noté ABD (abandon)'}
                        style={{
                          color: 'white',
                          backgroundColor:
                            modeDNFActivated === 'ABD'
                              ? cadtheme.palette.primary.main
                              : cadtheme.palette.secondary.main,
                          height: 34,
                          marginRight: 5
                        }}
                        value="ABD"
                        aria-label="centered"
                      >
                        ABD
                      </ToggleButton>
                      <ToggleButton
                        title={'Lorsque ce bouton poussoir est sélectionné, tout dossard saisi est noté CHT (chute)'}
                        style={{
                          color: 'white',
                          backgroundColor:
                            modeDNFActivated === 'CHT'
                              ? cadtheme.palette.primary.main
                              : cadtheme.palette.secondary.main,
                          height: 34,
                          marginRight: 5
                        }}
                        value="CHT"
                        aria-label="centered"
                      >
                        CHT
                      </ToggleButton>
                      <ToggleButton
                        title={
                          'Lorsque ce bouton poussoir est sélectionné, tout dossard saisi est noté NC (Non classé)'
                        }
                        style={{
                          color: 'white',
                          backgroundColor:
                            modeDNFActivated === 'NC' ? cadtheme.palette.primary.main : cadtheme.palette.secondary.main,
                          height: 34,
                          marginRight: 5
                        }}
                        value="NC"
                        aria-label="centered"
                      >
                        NC
                      </ToggleButton>
                      <ToggleButton
                        title={
                          'Lorsque ce bouton poussoir est sélectionné, tout dossard saisi est noté NP (Non partant)'
                        }
                        style={{
                          color: 'white',
                          backgroundColor:
                            modeDNFActivated === 'NP' ? cadtheme.palette.primary.main : cadtheme.palette.secondary.main,
                          height: 34,
                          marginRight: 5
                        }}
                        value="NP"
                        aria-label="centered"
                      >
                        NP
                      </ToggleButton>
                      <ToggleButton
                        title={
                          'Lorsque ce bouton poussoir est sélectionné, tout dossard saisi est noté DSQ (Disqualifié)'
                        }
                        style={{
                          color: 'white',
                          backgroundColor:
                            modeDNFActivated === 'DSQ'
                              ? cadtheme.palette.primary.main
                              : cadtheme.palette.secondary.main,
                          height: 34
                        }}
                        value="DSQ"
                        aria-label="centered"
                      >
                        DSQ
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </>
                )}
                {isEdit && (
                  <ActionButton
                    color="primary"
                    title="Saisir speakers, commissaires, observations ou valider les classements"
                    onClick={() => {
                      setOpenInfoGen(true);
                    }}
                  >
                    <span style={{ color: 'white' }}>
                      <Edit style={{ verticalAlign: 'middle' }} />
                      Informations épreuve
                    </span>
                  </ActionButton>
                )}
                <ActionButton
                  title="Télécharger"
                  color="primary"
                  aria-controls={'download-menu'}
                  aria-haspopup="true"
                  onClick={(evt: React.MouseEvent) => setDownloadMenuAnchorEl(evt.currentTarget)}
                >
                  <span style={{ color: 'white' }}>
                    {' '}
                    Télécharger <ExpandMore style={{ verticalAlign: 'middle' }} />
                  </span>
                </ActionButton>
                <DropdownMenu
                  id="download-menu"
                  anchorEl={downloadMenuAnchorEl}
                  open={Boolean(downloadMenuAnchorEl)}
                  onClose={() => setDownloadMenuAnchorEl(null)}
                  anchorOrigin={{
                    horizontal: 'left',
                    vertical: 'bottom'
                  }}
                >
                  <DropdownMenuItem
                    title="Télécharger les classements en PDF (Toutes les courses)"
                    onClick={() => {
                      exportResultsPDF(competition.races);
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <PictureAsPdf style={{ verticalAlign: 'middle', marginRight: 5 }} />{' '}
                    {'Classement PDF de Toutes les courses'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    title={'Télécharger les classements en PDF (Uniquement ' + currentRace + ')'}
                    onClick={() => {
                      exportResultsPDF([currentRace]);
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <PictureAsPdf style={{ verticalAlign: 'middle', marginRight: 5 }} />{' '}
                    {'Classement PDF Uniquement course : ' + currentRace}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    title="Télécharger les podiums en PDF"
                    onClick={() => {
                      podiumsPDF(rows, competition, transformRows, rankOfCate, filterByRace);
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <PictureAsPdf style={{ verticalAlign: 'middle', marginRight: 5 }} /> PDF des podiums
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    title="Exporter les classements en CSV"
                    onClick={() => {
                      exportCSV([currentRace]);
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <CloudDownload style={{ verticalAlign: 'middle', marginRight: 5 }} />{' '}
                    {'Classements CSV Uniquement course : ' + currentRace}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    title="Classements CSV de TOUTES les courses"
                    onClick={() => {
                      exportCSV(competition.races);
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <CloudDownload style={{ verticalAlign: 'middle', marginRight: 5 }} />{' '}
                    {'Classements CSV de TOUTES les courses'}
                  </DropdownMenuItem>
                </DropdownMenu>
                {selectedRows?.length > 0 && isEdit && (
                  <ActionButton color="primary" title="Supprimer du classement les coureurs">
                    <Tooltip title="Supprimer définitivement ces coureurs du classement">
                      <Delete
                        fontSize={'small'}
                        onClick={async () => {
                          try {
                            setLoading(true);
                            for (const rrow of selectedRows) {
                              await apiRaces.removeRanking({ raceRow: { ...rrow, riderNumber: null } });
                            }
                            setSelectedRows([]);
                            await fetchRows();
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </Tooltip>
                  </ActionButton>
                )}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {gprops.authentication.roles.includes('ADMIN') ? (
                    <FileUpload
                      mode="basic"
                      name="file"
                      url={'/api/races/results/upload/' + competitionId}
                      onBeforeSend={event => {
                        setLoading(true);
                        event.xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('token'));
                      }}
                      onError={async event => {
                        setLoading(false);
                        setNotification({
                          message: event.xhr.response,
                          open: true,
                          type: 'error'
                        });
                      }}
                      onUpload={async event => {
                        await fetchRows();
                        setLoading(false);
                        setNotification({
                          message: event.xhr.response,
                          open: true,
                          type: 'info'
                        });
                      }}
                      accept="text/csv"
                      maxFileSize={100000}
                      chooseLabel="Classement via fichier CSV"
                    />
                  ) : (
                    <ActionButton
                      disabled={true}
                      color="primary"
                      title="Classement par fichier CSV (activé pour les administrateurs)"
                    >
                      <span style={{ color: 'white' }}>Classement via fichier CSV</span>
                    </ActionButton>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-end'
                }}
              >
                <Fab
                  style={{
                    borderRadius: 4,
                    fontSize: '12px',
                    margin: '5px',
                    fontWeight: 'bold',
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingBottom: 5,
                    paddingTop: 5,
                    backgroundColor: cadtheme.palette.primary.dark
                  }}
                  variant="extended"
                  size="small"
                >
                  {fromPalmaresLicenceId ? (
                    <Link style={{ color: '#FFF' }} to={'/palmares/' + fromPalmaresLicenceId}>
                      <AssignmentIcon style={{ verticalAlign: 'middle' }} />
                      Revenir au palmarès{' '}
                    </Link>
                  ) : (
                    <Link
                      style={{ color: '#FFF' }}
                      to={'/competition/' + competition?.id + '/engagement/edit' + gprops.history.location.hash}
                    >
                      <AssignmentIcon style={{ verticalAlign: 'middle' }} />
                      Accéder aux engagements
                    </Link>
                  )}
                </Fab>
              </div>
            </div>
            <DataTable
              ref={dg}
              csvSeparator={';'}
              selection={selectedRows}
              scrollHeight={height - 300 + 'px'}
              scrollable={true}
              reorderableColumns={true}
              resizableColumns={true}
              responsive={true}
              exportFilename={'Resultats_' + (competition && competition.name) + '_CAT_' + currentRace}
              value={transformedRows}
              emptyMessage="Aucune donnée ne correspond à la recherche"
              {...(isEdit ? { onRowReorder: reorder } : undefined)}
              loading={loading}
              onSelectionChange={e => setSelectedRows(e.value)}
              columnResizeMode="expand"
              {...(isEdit ? { editMode: 'cell' } : undefined)}
            >
              {isEdit && (
                <Column selectionMode="multiple" bodyStyle={{ textAlign: 'center' }} headerStyle={{ width: '3em' }} />
              )}
              {isEdit && (
                <Column
                  columnKey={'1'}
                  header={
                    <IconButton
                      style={{ height: 20, padding: 0 }}
                      onClick={() => {
                        setShowFilters(prevState => !prevState);
                      }}
                    >
                      {<SearchIcon height={20} style={{ padding: 0 }} htmlColor={'#333333'} />}
                    </IconButton>
                  }
                  rowReorder={true}
                  style={{ width: '3em' }}
                />
              )}
              <Column
                columnKey={'2'}
                field="classement"
                header="Clt."
                filterMatchMode="contains"
                body={(rowdata: RaceRow, column: any) => displayRank(rowdata)}
                style={{ width: '60px' }}
              />
              <Column
                columnKey={'3'}
                field="riderNumber"
                body={(row: RaceRow) => {
                  return row.riderNumber && displayDossard(row.riderNumber.toString());
                }}
                header="Dossard"
                filter={showFilters}
                bodyStyle={{ textAlign: 'center' }}
                style={{ width: '6%', textAlign: 'left' }}
                {...(isEdit
                  ? {
                      editor: allprops => {
                        return dossardEditor(allprops, rows, transformedRows, currentRace, fetchRows);
                      }
                    }
                  : undefined)}
                editorValidator={allprops => {
                  if (isEdit) {
                    dossardValidator(allprops, fetchRows, currentRace, transformedRows, rows);
                  }
                  return true;
                }}
                filterMatchMode="contains"
              />
              {competition?.avecChrono && (
                <Column
                  body={(row: RaceRow) => {
                    return row.chrono;
                  }}
                  columnKey={'12'}
                  editor={allprops => {
                    return chronoEditor(allprops, rows, transformedRows, currentRace, fetchRows);
                  }}
                  editorValidator={allprops => {
                    chronoValidator(allprops, fetchRows, currentRace, transformedRows, rows);
                    return true;
                  }}
                  field="chrono"
                  style={{ width: '9%', textAlign: 'center' }}
                  header="Chrono"
                />
              )}
              {competition?.competitionType === CompetitionEntityCompetitionTypeEnum.CX && (
                <Column
                  body={(row: RaceRow) => {
                    return row.tours;
                  }}
                  columnKey={'13'}
                  editor={allprops => {
                    return toursEditor(allprops, rows, transformedRows, currentRace, fetchRows);
                  }}
                  field="tours"
                  style={{ width: '5%', textAlign: 'center' }}
                  header="Tours"
                />
              )}
              <Column
                columnKey={'4'}
                field="name"
                header="Coureur"
                body={(rowdata: RaceRow, column: any) => displayName(rowdata, column)}
                filter={showFilters}
                filterMatchMode="contains"
              />
              <Column columnKey={'5'} field="club" header="Club" filter={showFilters} filterMatchMode="contains" />
              <Column
                columnKey={'6'}
                field="gender"
                header="H/F"
                filter={showFilters}
                filterMatchMode="contains"
                style={{ width: '5%', textAlign: 'center' }}
              />
              <Column
                columnKey={'7'}
                field="dept"
                header="Dept"
                filter={showFilters}
                filterMatchMode="contains"
                style={{ width: '5%', textAlign: 'center' }}
              />
              <Column
                columnKey={'8'}
                field="birthYear"
                header="Année"
                filter={showFilters}
                filterMatchMode="contains"
                style={{ width: '5%', textAlign: 'center' }}
              />
              <Column
                columnKey={'9'}
                field="catev"
                header="Caté.V"
                filter={showFilters}
                filterMatchMode="contains"
                style={{ width: '6%', textAlign: 'center' }}
              />
              <Column
                columnKey={'10'}
                field="catea"
                header="Caté.A"
                filter={showFilters}
                filterMatchMode="contains"
                style={{ width: '5%', textAlign: 'center' }}
              />
              <Column
                columnKey={'11'}
                field="fede"
                header="Fédé."
                filter={showFilters}
                filterMatchMode="contains"
                style={{ width: '5%', textAlign: 'center' }}
              />
              {isEdit && (
                <Column
                  columnKey={'10'}
                  style={{ width: '5%', textAlign: 'center' }}
                  body={(raceRow: RaceRow) => flagchallenge(raceRow)}
                />
              )}
            </DataTable>
          </Fragment>
        );
      }}
    </CompetitionLayout>
  );
};

const mapStateToProps = (state: ReduxState) => ({
  authentication: state.authentication
});

export default connect(
  mapStateToProps,
  {}
)(withStyles(null, { withTheme: true })(withRouter(EditResultsPage) as any) as any);
