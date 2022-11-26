import React, { useContext, useRef, useState } from 'react';

import { CircularProgress, Fab, IconButton, makeStyles, Tooltip } from '@material-ui/core';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { apiRaces } from '../util/api';
import Grid from '@material-ui/core/Grid';
import { CompetitionLayout } from './competition/CompetitionLayout';
import { NotificationContext } from '../components/CadSnackbar';
import { DataTable } from 'primereact/datatable';
import { Column, ColumnProps } from 'primereact/column';
import { CreationForm } from './engagement/EngagementCreation';
import { Reorganizer } from './engagement/ReorganizeRaces';
import Box from '@material-ui/core/Box';
import { RaceRow } from '../sdk';
import { CloudDownload, Delete, PictureAsPdf, Warning } from '@material-ui/icons';
import 'jspdf-autotable';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { styles } from '../navigation/styles';
import * as _ from 'lodash';
import moment from 'moment';
import 'moment/locale/fr';
import SearchIcon from '@material-ui/icons/Search';
import { ConfirmDialog, linkToPalmares, useWindowDimensions } from '../util';
import { ActionButton } from '../components/ActionButton';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import { cadtheme } from '../theme/theme';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { DropdownMenu, DropdownMenuItem } from '../components/DropdownMenu';
import { listeEngagesPDF } from '../reports';

moment.locale('fr');
const style = makeStyles(theme => ({
  surclassed: {
    zoom: '79%',
    display: 'inline-block',
    marginLeft: 10
  }
}));

const filterByRace = (rows: RaceRow[], race: string): RaceRow[] => {
  return rows.filter(coureur => coureur.raceCode === race);
};

const surclassed = ({ catev, raceCode }: RaceRow) => {
  return raceCode.split('/').indexOf(catev) >= 0 ? false : true;
};

const SHORT = {
  style: { width: 90, textAlign: 'center', padding: 5 },
  bodyClassName: 'nopadding'
};
const EngagementPage = (props: any) => {
  const { height, width } = useWindowDimensions();
  const competitionId = props.match.params.id;
  const saisieResultat = props.match.url.includes('engagementresultats');
  const dg = useRef(null);
  const [, setNotification] = useContext(NotificationContext);
  const [selectedRow, selectRow] = useState<RaceRow>();
  const [open, openDialog] = React.useState(false);
  const [showSablier, setShowSablier] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState(null);

  const FILTERABLE = { filter: showFilters, filterMatchMode: 'contains' };
  const closeDialog = () => {
    openDialog(false);
  };

  const classes = style({});

  const exportCSV = async () => {
    dg && dg.current && dg.current.exportCSV();
  };

  return (
    <CompetitionLayout history={props.history} competitionId={competitionId} displayType={'engagements'}>
      {({ competition, currentRace, rows, fetchRows, fetchCompetition }) => {
        const deleteAction = (row: RaceRow, column: any) => {
          if (saisieResultat) {
            if (column.rowIndex + 1 === rows.length) {
              return (
                <Tooltip title={'Désengager ce coureur'}>
                  <Delete
                    fontSize={'small'}
                    onClick={() => {
                      selectRow(row);
                      openDialog(true);
                    }}
                  />
                </Tooltip>
              );
            } else {
              return null;
            }
          } else {
            return (
              <Tooltip title={'Désengager ce coureur'}>
                <Delete
                  fontSize={'small'}
                  onClick={() => {
                    selectRow(row);
                    openDialog(true);
                  }}
                />
              </Tooltip>
            );
          }
        };

        const handleOk = async (fetchRows: any) => {
          closeDialog();
          try {
            setShowSablier(true);
            await apiRaces.deleteRace({ id: String(selectedRow.id) });
            await fetchRows();
          } catch (ex) {
            setNotification({
              message: `Le coureur ${selectedRow.name} n'a pas pu être supprimé`,
              type: 'error',
              open: true
            });
            throw ex;
          } finally {
            setShowSablier(false);
          }
          setNotification({
            message: `Le coureur ${selectedRow.name} a été supprimé de la compétition`,
            type: 'info',
            open: true
          });
        };

        const columns: ColumnProps[] = [
          {
            header: (
              <IconButton
                style={{ height: 20, padding: 0 }}
                onClick={() => {
                  setShowFilters(prevState => !prevState);
                }}
              >
                {<SearchIcon height={20} style={{ padding: 0 }} htmlColor={'#333333'} />}
              </IconButton>
            ),
            style: {
              width: 50,
              textAlign: 'center',
              paddingLeft: 5,
              paddingRight: 5,
              cursor: 'pointer'
            },
            bodyClassName: 'nopadding',
            body: (rowdata: RaceRow, column: any) => {
              if (rowdata.comment == null && rowdata.rankingScratch == null) return deleteAction(rowdata, column);
              else return 'Classé';
            }
          },
          ...(saisieResultat
            ? [
                {
                  header: 'Clt',
                  body: (rowdata: RaceRow, column: any) => column.rowIndex + 1,
                  ...SHORT
                }
              ]
            : []),
          {
            field: 'riderNumber',
            header: 'Dossard',
            ...FILTERABLE,
            ...SHORT,
            body: (row: RaceRow) => linkToPalmares(row.riderNumber.toString(), row.licenceId),
            sortable: true
          },
          {
            field: 'name',
            header: 'Coureur',
            ...FILTERABLE,
            bodyClassName: 'nopadding',
            body: (rowdata: RaceRow, column: any) =>
              rowdata.comment == null && rowdata.rankingScratch == null ? (
                <Link to={'/licence/' + rowdata.licenceId + '#engagement_' + rowdata.competitionId}>
                  {rowdata.name}
                </Link>
              ) : (
                rowdata.name
              )
          },
          {
            field: 'club',
            header: 'Club',
            ...FILTERABLE,
            bodyClassName: 'nopadding',
            sortable: true
          },
          { field: 'gender', header: 'H/F', ...FILTERABLE, ...SHORT },
          {
            field: 'dept',
            header: 'Dept',
            ...FILTERABLE,
            style: { width: 90, textAlign: 'center' },
            bodyClassName: 'nopadding',
            sortable: true
          },
          {
            field: 'birthYear',
            header: 'Année',
            ...FILTERABLE,
            ...SHORT,
            sortable: true
          },
          {
            field: 'catea',
            header: 'Caté. A.',
            ...FILTERABLE,
            ...SHORT,
            sortable: true
          },
          {
            field: 'catev',
            header: 'Caté. V.',
            ...FILTERABLE,
            ...SHORT,
            sortable: true,
            body: (row: RaceRow) => (
              <span>
                {row.catev}
                {surclassed(row) && (
                  <span title="surclassé ou catégorie supérieure" className={classes.surclassed}>
                    <Warning />
                  </span>
                )}
              </span>
            )
          },
          {
            field: 'fede',
            header: 'Fédé.',
            ...FILTERABLE,
            ...SHORT,
            sortable: true
          }
        ];
        const existResults = rows.length > 0;

        const controleDossards = () => {
          const lrows = filterByRace(rows, currentRace);
          const groupByCatev = _.groupBy(lrows, (item: RaceRow) => item.catev);
          let shouldExit = false;
          Object.keys(groupByCatev).map(item => {
            const diffMaxMin =
              _.maxBy(groupByCatev[item], c => c.riderNumber).riderNumber -
              _.minBy(groupByCatev[item], c => c.riderNumber).riderNumber +
              1;
            if (groupByCatev[item].length != diffMaxMin) {
              setNotification({
                message: `Attention la catégorie ${item} n'est pas continue`,
                type: 'error',
                open: true
              });
              shouldExit = true;
              return;
            }
          });
          if (shouldExit) return;
          setNotification({
            message: `Controle des dossards OK`,
            type: 'success',
            open: true
          });
        };

        const canReorganise = (rows: RaceRow[]) => {
          const alreadyRanked = !(
            rows.filter((rr: RaceRow) => rr.rankingScratch != null || rr.comment != null).length === 0
          );
          const groupByNumber = _.groupBy(rows, row => row.riderNumber);
          const sameNumberInDifferentCates =
            Object.keys(groupByNumber).filter(key => groupByNumber[key].length > 1).length > 0;
          if (alreadyRanked) return 'Réorganisation de la course impossible car des coureurs ont déjà été classés';
          else if (sameNumberInDifferentCates)
            return 'Réorganisation de la course impossible car la même séquence de dossard a été affectée à plusieurs catégories';
          return true;
        };
        const canReorg = canReorganise(rows);
        return (
          <Box position="relative" padding={0}>
            {showSablier && (
              <div
                style={{
                  position: 'fixed',
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 10000,
                  cursor: 'pointer'
                }}
              >
                <div style={{ position: 'absolute', top: '40%', left: '40%' }}>
                  <CircularProgress color="primary" />
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: '#3333330d',
                justifyContent: 'space-between',
                padding: '5px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <Reorganizer
                  tooltip={canReorg === true ? 'Fusionner ou scinder des départs' : canReorg.toString()}
                  disabled={canReorg != true}
                  competition={competition}
                  rows={rows}
                  onSuccess={() => {
                    fetchRows();
                    fetchCompetition();
                  }}
                />
                <ActionButton
                  title="Télécharger"
                  color="primary"
                  aria-controls={'download-menu'}
                  aria-haspopup="true"
                  onClick={(evt: React.MouseEvent) => setDownloadMenuAnchorEl(evt.currentTarget)}
                >
                  <span style={{ color: 'white' }}>
                    Télécharger <ExpandMore style={{ verticalAlign: 'middle' }} />
                  </span>
                </ActionButton>
                <DropdownMenu
                  id="download-menu"
                  color="primary"
                  anchorEl={downloadMenuAnchorEl}
                  open={Boolean(downloadMenuAnchorEl)}
                  onClose={() => setDownloadMenuAnchorEl(null)}
                  anchorOrigin={{
                    horizontal: 'left',
                    vertical: 'bottom'
                  }}
                >
                  <DropdownMenuItem
                    title={'Télécharger les engagement en PDF'}
                    onClick={() => {
                      listeEngagesPDF(filterByRace, currentRace, rows, competition, false);
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <PictureAsPdf style={{ verticalAlign: 'middle', marginRight: 5 }} /> Engagements PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    title={"Télécharger les feuilles d'émargement"}
                    onClick={() => {
                      listeEngagesPDF(filterByRace, currentRace, rows, competition, true);
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <PictureAsPdf style={{ verticalAlign: 'middle', marginRight: 5 }} /> Feuilles d'émargement PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    title={'Télécharger les engagement en CSV'}
                    onClick={() => {
                      exportCSV();
                      setDownloadMenuAnchorEl(null);
                    }}
                  >
                    <CloudDownload style={{ verticalAlign: 'middle', marginRight: 5 }} /> Engagements CSV
                  </DropdownMenuItem>
                </DropdownMenu>
              </div>
              {existResults && (
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <Fab
                    style={{
                      borderRadius: 4,
                      fontSize: '12px',
                      margin: '5px',
                      paddingLeft: 10,
                      fontWeight: 'bold',
                      paddingRight: 10,
                      paddingBottom: 5,
                      paddingTop: 5,
                      backgroundColor: cadtheme.palette.primary.dark
                    }}
                    variant="extended"
                    size="small"
                  >
                    <Link
                      style={{ color: '#FFF' }}
                      to={'/competition/' + competition?.id + '/results/edit' + props.history.location.hash}
                    >
                      <FormatListNumberedIcon style={{ verticalAlign: 'middle' }} />
                      Accéder aux classements
                    </Link>
                  </Fab>
                </div>
              )}
            </div>
            <Grid container={true}>
              <ConfirmDialog
                question={'Êtes-vous sûr de vouloir désengager le coureur ' + (selectedRow ? selectedRow.name : null)}
                title={'Désengager un coureur'}
                open={open}
                confirmMessage={'Oui'}
                cancelMessage={'Non'}
                handleClose={closeDialog}
                handleOk={() => handleOk(fetchRows)}
              />
              {currentRace && (
                <CreationForm
                  competition={competition}
                  race={currentRace}
                  onSuccess={fetchRows}
                  saisieResultat={saisieResultat}
                  rows={rows}
                />
              )}
            </Grid>

            <DataTable
              ref={dg}
              csvSeparator={';'}
              value={saisieResultat ? filterByRace(rows, currentRace).reverse() : filterByRace(rows, currentRace)}
              scrollHeight={height - 300 + 'px'}
              scrollable={true}
              emptyMessage="Aucun coureur encore engagé sur cette épreuve ou aucun coureur ne correspond à votre filtre de recherche"
              responsive={true}
              columnResizeMode="expand"
              reorderableColumns
              onColReorder={e => {}}
              resizableColumns
              exportFilename={'Engagements_' + (competition && competition.name) + '_CAT_' + currentRace}
            >
              {columns.map((column, i) => (
                <Column key={i} columnKey={(i++).toString()} {...column} />
              ))}
            </DataTable>
          </Box>
        );
      }}
    </CompetitionLayout>
  );
};

export default withStyles(styles as any, { withTheme: true })(EngagementPage as any);
