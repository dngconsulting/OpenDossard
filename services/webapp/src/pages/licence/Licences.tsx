import * as React from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import MaterialTable, { Query, QueryResult } from 'material-table';
import { AppText as T } from '../../util/text';
import { apiLicences } from '../../util/api';
import { LicenceEntity, LicenceEntity as Licence, Search as SearchEntity } from '../../sdk';
import { cadtheme } from '../../theme/theme';
import { Button, Paper, Tooltip } from '@material-ui/core';
import { useContext } from 'react';
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
import jsPDF from 'jspdf';
import moment from 'moment';
import { useWindowDimensions } from '../../util';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { ScrollPanel } from 'primereact/scrollpanel';

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
  const [tableKey, setTableKey] = useState(1);
  const [name, setName] = useState(null);
  const [, setNotification] = useContext(NotificationContext);
  const [psize, setPSize] = useState(17);
  const windowDimensions = useWindowDimensions();
  const tableRef = useRef(null);
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

  const prepareFilter = (query: Query<Licence>): SearchEntity => {
    const filters: any = [];
    if (name) {
      filters.push({ name: 'name', value: name });
    }
    if (id) {
      filters.push({ name: 'id', value: id });
    } else {
      if (query.filters.length > 0) {
        query.filters.forEach((col: any) => {
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

  const exportPDF = async () => {
    const rowstoDisplay: any[][] = [];
    const filename = 'Licences.pdf';
    tableRef.current.state.data.forEach((r: LicenceEntity) => {
      rowstoDisplay.push([
        r.id,
        r.licenceNumber,
        r.name,
        r.firstName,
        r.club,
        r.gender,
        r.dept,
        r.birthYear,
        r.catea,
        r.catev,
        r.catevCX,
        r.fede,
        r.saison
      ]);
    });
    const doc = new jsPDF('p', 'mm', 'a4');
    // @ts-ignore
    const totalPagesExp = '{total_pages_count_string}';
    // @ts-ignore
    doc.autoTable({
      head: [
        [
          'ID',
          'Licence N°',
          'Nom',
          'Prenom',
          'Club',
          'H/F',
          'Dept',
          'Année',
          'Cat.A',
          'Cat.V',
          'Caté.CX',
          'Fédé.',
          'Saison'
        ]
      ],
      bodyStyles: {
        minCellHeight: 3,
        cellHeight: 3,
        cellPadding: 0.5
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 40 },
        5: { cellWidth: 10 },
        6: { cellWidth: 10 },
        7: { cellWidth: 10 },
        8: { cellWidth: 6 },
        9: { cellWidth: 6 },
        10: { cellWidth: 15 },
        11: { cellWidth: 12 },
        12: { cellWidth: 10 }
      },
      body: rowstoDisplay,
      didDrawPage: (data: any) => {
        // Header
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.setFontStyle('normal');
        doc.setFontSize(10);
        doc.text('Open Dossard - Listing de ' + rowstoDisplay.length + ' Licences', data.settings.margin.left + 70, 10);

        // Footer
        const str = 'Page ' + doc.internal.getNumberOfPages() + '/' + totalPagesExp;
        doc.setFontSize(8);

        // jsPDF 1.4+ uses getWidth, <1.4 uses .width
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
        doc.text(
          'Fichier : ' + filename + ' Imprimé le : ' + moment().format('DD/MM/YYYY HH:mm:ss'),
          70,
          pageHeight - 5
        );
      },
      headStyles: {
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 0.5,
        minCellHeight: 8
      },
      margin: { top: 14, left: 10 },
      styles: {
        valign: 'middle',
        fontSize: 7,
        minCellHeight: 5,
        maxCellHeight: 5,
        margin: 0
      }
    });
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY;
    doc.putTotalPages(totalPagesExp);
    doc.save(filename);
  };
  return (
    <MaterialTable
      onChangePage={(pageNumber: number) => {
        try {
          const el = document.querySelectorAll('[class^=Component-horizontalScrollContainer]')[0].firstChild
            .firstChild as Element;
          el && el.scrollTo(0, 0);
        } catch (err) {
          // Lets ignore if it fails
        }
      }}
      key={tableKey}
      title={T.LICENCES.TITLE}
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
        { title: 'Club', field: 'club', headerStyle: { minWidth: 380 } },
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
        filterCellStyle: { padding: 0, margin: 0 },
        rowStyle: { maxHeight: 20, fontSize: 8, padding: 0, margin: 0 },
        filtering: true,
        debounceInterval: 1000,
        pageSize: psize,
        toolbar: true,
        padding: 'dense',
        actionsColumnIndex: -1,
        maxBodyHeight: windowDimensions.height - 200,
        pageSizeOptions: [5, 10, 17, 20, 100],
        search: true,
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
            exportPDF();
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
  );
};

export default LicencesPage;
