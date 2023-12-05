import * as React from 'react';
import { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import MaterialTable, { MTableToolbar, Query, QueryResult } from 'material-table';
import { AppText as T } from '../../util/text';
import { apiLicences } from '../../util/api';
import { LicenceEntity as Licence, Search as SearchEntity } from '../../sdk';
import { BREAK_POINT_MOBILE_TABLET, cadtheme } from '../../theme/theme';
import { Button, FormControlLabel, Switch, Tooltip, useMediaQuery, withStyles } from '@material-ui/core';
import { NotificationContext } from '../../components/CadSnackbar';
import { store } from '../../store/Store';
import { setVar } from '../../actions/App.Actions';
import { ActionButton } from '../../components/ActionButton';
import {
  AddBox,
  ArrowDownward,
  Check,
  ChevronLeft,
  ChevronRight,
  Clear,
  DeleteOutline,
  Edit,
  FilterList,
  FirstPage,
  LastPage,
  PictureAsPdf,
  Remove,
  SaveAlt,
  Search,
  ViewColumn
} from '@material-ui/icons';
import { useWindowDimensions } from '../../util';
import { Link } from 'react-router-dom';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { licencesPDF } from '../../reports';

interface ILicencesProps {
  items: any[];
  classes: any;
  history: any;
  location: any;
}

const tableIcons = {
  Add: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <DeleteOutline style={{ fontSize: '20px' }} {...props} ref={ref} />
  )),
  DetailPanel: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ChevronRight {...props} ref={ref} />),
  Edit: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <Edit style={{ fontSize: '10px' }} {...props} ref={ref} />
  )),
  Export: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <SaveAlt {...props} ref={ref} />),
  Filter: forwardRef((props, ref: React.Ref<SVGSVGElement>) => (
    <FilterList style={{ fontSize: '15px' }} {...props} ref={ref} />
  )),
  FirstPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <FirstPage {...props} ref={ref} />),
  LastPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <LastPage {...props} ref={ref} />),
  NextPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ChevronRight {...props} ref={ref} />),
  PreviousPage: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ChevronLeft {...props} ref={ref} />),
  ResetSearch: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Clear {...props} ref={ref} />),
  Search: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ArrowDownward {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref: React.Ref<SVGSVGElement>) => <ViewColumn {...props} ref={ref} />)
};

const LicencesPage = (props: ILicencesProps) => {
  const [id, setId] = useState(null);
  const [licencesSansNumeroFilter, setLicencesSansNumeroFilter] = useState<boolean>(false);
  const [tableKey, setTableKey] = useState(1);
  const [name, setName] = useState(null);
  const [, setNotification] = useContext(NotificationContext);
  const [psize, setPSize] = useState(17);
  const windowDimensions = useWindowDimensions();
  const tableRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(BREAK_POINT_MOBILE_TABLET));
  useEffect(() => {
    const queryParams = new URLSearchParams(props.location.search);
    if (queryParams.has('id')) {
      setId(queryParams.get('id'));
    }
    return () => {
      setId(null);
    };
  });

  const fetchLicences = async (query: Query<Licence>): Promise<QueryResult<Licence>> => {
    const res = await apiLicences.getPageSizeLicencesForPage({
      search: prepareFilter(query)
    });
    const d = res.data;
    return { data: d, page: res.page, totalCount: res.totalCount };
  };

  const StyledMTableToolbar = withStyles({
    root: {
      display: isMobile ? 'block' : 'flex',
      '& .MuiToolbar-gutters': {
        paddingLeft: 0,
        paddingRight: 0
      }
    },
    spacer: {
      flex: '0 0 0%',
      backgroundColor: 'red'
    }
  })(MTableToolbar);

  const prepareFilter = (query: Query<Licence>): SearchEntity => {
    const filters: any = [];
    if (licencesSansNumeroFilter) filters.push({ name: 'licenceNumber', value: 'NC' });
    if (name) {
      filters.push({ name: 'name', value: name });
    }
    if (id) {
      filters.push({ name: 'id', value: id });
    } else {
      if (query.filters.length > 0) {
        query.filters.forEach((col: any) => {
          if ((licencesSansNumeroFilter && col != 'licenceNumber') || !licencesSansNumeroFilter)
            filters.push({ name: col.column.field, value: col.value });
        });
      }
    }
    setPSize(query.pageSize);
    return {
      currentPage: query.page,
      pageSize: query.pageSize,
      orderBy: query.orderBy ? query.orderBy.field : undefined,
      orderDirection: query.orderDirection ? query.orderDirection.toUpperCase() : 'ASC',
      search: query.search,
      filters
    };
  };

  const useStyles = makeStyles(theme => ({
    toolbarWrapper: {
      '& .MuiToolbar-gutters': {
        paddingLeft: 0,
        paddingRight: 0
      }
    }
  }));
  const classes = useStyles();
  return (
    <div id={'mydiv'}>
      <MaterialTable
        style={{ margin: 5, padding: 10 }}
        components={{
          Toolbar: props => {
            return <StyledMTableToolbar {...props} />;
          }
        }}
        onChangePage={(pageNumber: number) => {
          try {
            const el = document.querySelectorAll('div[style*=overflow-y]')[0];
            el && el.scrollTo(0, 0);
          } catch (err) {
            // Lets ignore if it fails
          }
        }}
        key={tableKey}
        tableRef={tableRef}
        columns={[
          {
            title: 'ID',
            field: 'id',
            headerStyle: { maxWidth: 20, minWidth: 20 },
            filterPlaceholder: id
          },
          {
            title: 'Lic. N°',
            field: 'licenceNumber',
            headerStyle: { width: 20, minWidth: 20 }
          },
          {
            title: 'Nom',
            field: 'name',
            headerStyle: { width: 150, minWidth: 150, maxWidth: 150 },
            render: (data, type) => {
              return (
                <Tooltip title="Pour accéder au palmarès du coureur, dans une nouvelle fenêtre: Ctrl+click">
                  <Link style={{ cursor: 'pointer' }} to={`/palmares/${data.id}`}>
                    {data.name}
                  </Link>
                </Tooltip>
              );
            }
          },
          {
            title: 'Prénom',
            field: 'firstName',
            headerStyle: { width: 100, minWidth: 100, maxWidth: 100 }
          },
          {
            title: 'Club',
            field: 'club',
            headerStyle: { minWidth: 200 },
            render: (data, type) => {
              return <div style={{ minWidth: 300 }}>{data.club}</div>;
            }
          },
          {
            title: 'H/F',
            field: 'gender',
            headerStyle: { width: 10, minWidth: 10, maxWidth: 10 }
          },
          {
            title: 'Dept',
            field: 'dept',
            headerStyle: { width: 10, minWidth: 10, maxWidth: 10 }
          },
          {
            title: 'Année',
            field: 'birthYear',
            headerStyle: { width: 10, minWidth: 10, maxWidth: 10 }
          },
          {
            title: 'Caté.A',
            field: 'catea',
            headerStyle: { width: 10, minWidth: 10, maxWidth: 10 }
          },
          {
            title: 'Caté.V',
            field: 'catev',
            headerStyle: { width: 10, minWidth: 10, maxWidth: 10 }
          },
          {
            title: 'Caté.CX',
            field: 'catevCX',
            headerStyle: { width: 10, minWidth: 10, maxWidth: 10 }
          },
          {
            title: 'Fédé',
            field: 'fede',
            headerStyle: { width: 20, minWidth: 20, maxWidth: 20 },
            sorting: false
          },
          {
            title: 'Saison',
            field: 'saison',
            headerStyle: { width: 20, minWidth: 20, maxWidth: 20 },
            sorting: false
          }
        ]}
        data={fetchLicences}
        icons={tableIcons}
        options={{
          showEmptyDataSourceMessage: true,
          filterCellStyle: { padding: 0, margin: 0 },
          rowStyle: { maxHeight: 20, fontSize: 'unset', padding: 0, margin: 0 },
          filtering: true,
          debounceInterval: 1000,
          pageSize: psize,
          toolbar: true,
          padding: 'dense',
          actionsColumnIndex: -1,
          maxBodyHeight: windowDimensions.height - 200,
          pageSizeOptions: [20, 50, 75, 100, 200, 300, 500, 1000, 1500],
          search: true,
          selection: false,
          showTitle: false,
          searchFieldStyle: { width: 320 },
          exportButton: true,
          exportFileName: 'licences',
          headerStyle: {
            backgroundColor: cadtheme.palette.primary.main,
            color: '#FFF',
            fontSize: 15,
            padding: 5,
            zIndex: 'auto'
          }
        }}
        editable={{
          onRowDelete: async oldData => {
            try {
              store.dispatch(setVar({ showLoading: true }));
              await apiLicences._delete({ id: `${oldData.id}` });
            } catch (ex) {
              setNotification({
                message: `Le coureur ${oldData.firstName} ${oldData.name} n'a pas été supprimé (pb réseau ou coureur déjà engagé sur une course)`,
                open: true,
                type: 'error'
              });
            } finally {
              store.dispatch(setVar({ showLoading: false }));
            }
          }
        }}
        actions={[
          {
            icon: () => (
              <FormControlLabel
                control={
                  <Switch
                    checked={licencesSansNumeroFilter}
                    onChange={() => {
                      setLicencesSansNumeroFilter(!licencesSansNumeroFilter);
                      tableRef.current.onQueryChange();
                    }}
                    name="checkedB"
                    color="primary"
                  />
                }
                label="Licences sans numéro"
              />
            ),
            tooltip: 'Afficher uniquement les licences avec le numéro non renseigné',
            isFreeAction: true,
            onClick: () => {}
          },
          {
            icon: () => (
              <Button variant={'contained'} color={'primary'}>
                Ajouter une licence
              </Button>
            ),
            tooltip: T.LICENCES.ADD_NEW_LICENCE,
            isFreeAction: true,
            onClick: () => {
              props.history.push('/licence/new');
            }
          },
          {
            icon: () => (
              <Button variant={'contained'} color={'secondary'}>
                Tout Afficher
              </Button>
            ),
            tooltip: 'Afficher tous les enregistrements',
            isFreeAction: true,
            onClick: () => {
              setTableKey(Math.random());
              props.history.push('/licences/');
            }
          },
          {
            icon: 'edit',
            iconProps: { fontSize: 'small' },
            tooltip: T.LICENCES.EDIT_TOOL_TIP,
            onClick: (event, rowData: any) => {
              props.history.push('/licence/' + rowData.id);
            }
          },
          {
            icon: () => (
              <ActionButton color={'primary'}>
                <span style={{ color: 'white' }}>
                  <PictureAsPdf style={{ verticalAlign: 'middle' }} />
                  Export PDF
                </span>
              </ActionButton>
            ),
            tooltip: 'Exporter la page courante en PDF',
            isFreeAction: true,
            onClick: () => {
              licencesPDF(tableRef.current.state.data);
            }
          }
        ]}
        localization={{
          body: {
            editRow: {
              saveTooltip: T.LICENCES.EDIT_ROW.SAVE_TOOL_TIP,
              cancelTooltip: T.LICENCES.EDIT_ROW.CANCEL_TOOL_TIP,
              deleteText: T.LICENCES.EDIT_ROW.DELETE_TEXT
            },
            deleteTooltip: T.LICENCES.DELETE_TOOL_TIP,
            editTooltip: T.LICENCES.EDIT_TOOL_TIP,
            emptyDataSourceMessage: T.LICENCES.EMPTY_DATA_SOURCE_MESSAGE,
            filterRow: {
              filterTooltip: T.LICENCES.FILTER_TOOL_TIP
            }
          },
          pagination: {
            labelRowsSelect: T.LICENCES.PAGINATION.LABEL_ROWS_SELECT,
            firstTooltip: T.LICENCES.PAGINATION.FIRST_TOOL_TIP,
            previousTooltip: T.LICENCES.PAGINATION.PREVIOUS_TOOL_TIP,
            nextTooltip: T.LICENCES.PAGINATION.NEXT_TOOL_TIP,
            lastTooltip: T.LICENCES.PAGINATION.LAST_TOOL_TIP,
            labelDisplayedRows: T.LICENCES.PAGINATION.LABEL_DISPLAYED_ROWS
          },
          toolbar: {
            searchTooltip: T.LICENCES.TOOLBAR.SEARCH_TOOL_TIP,
            searchPlaceholder: 'Nom Prenom Fédé N° Licence'
          }
        }}
      />
    </div>
  );
};

export default LicencesPage;
