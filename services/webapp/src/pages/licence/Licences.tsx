import * as React from 'react';
import {Ref, useEffect, useRef, useState} from 'react';
import MaterialTable, {Query, QueryResult} from 'material-table';
import {AppText as T} from '../../util/text';
import {apiLicences} from '../../util/api';
import {LicenceEntity as Licence, Search} from '../../sdk';
import {cadtheme} from '../../theme/theme';
import {Button, Paper} from '@material-ui/core';
import {useContext} from "react";
import {NotificationContext} from "../../components/CadSnackbar";
import {store} from "../../store/Store";
import {setVar} from "../../actions/App.Actions";
import {ActionButton} from "../../components/ActionButton";
import { AddBox, Check, Clear, DeleteOutline, ChevronLeft, ChevronRight, Edit, SaveAlt, FilterList, FirstPage, LastPage,
            Search as SearchIcon, ArrowDownward, Remove, ViewColumn, PictureAsPdf} from "@material-ui/icons";
import jsPDF from "jspdf";
import moment from "moment";
import {useWindowDimensions} from "../../util";

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
    location:any
}

const tableIcons = {
    Add: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <AddBox {...props} ref={ref}/>),
    Check: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Check {...props} ref={ref} />),
    Clear: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Clear {...props} ref={ref} />),
    Delete: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <ChevronRight {...props} ref={ref} />),
    Edit: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Edit {...props} ref={ref} />),
    Export: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <SaveAlt {...props} ref={ref} />),
    Filter: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <FilterList {...props} ref={ref} />),
    FirstPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <FirstPage {...props} ref={ref} />),
    LastPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <LastPage {...props} ref={ref} />),
    NextPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Clear {...props} ref={ref} />),
    Search: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <SearchIcon {...props} ref={ref} />),
    SortArrow: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Remove {...props} ref={ref} />),
    ViewColumn: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <ViewColumn {...props} ref={ref} />)
};

const LicencesPage = (props: ILicencesProps) => {
    const [id,setId] = useState(null)
    const [name,setName] = useState(null)
    const [, setNotification] = useContext(NotificationContext);
    const [psize,setPSize] = useState(17)
    const windowDimensions  = useWindowDimensions();
    const tableRef = useRef(null)
    useEffect(()=> {
        const queryParams = new URLSearchParams(props.location.search)
        if (queryParams.has('id')) {
            setId(queryParams.get('id'))
        };
        return ()=>{setId(null)}
    })

    const fetchLicences = async (query: Query<Licence>): Promise<QueryResult<Licence>> => {
        const res = await apiLicences.getPageSizeLicencesForPage({search:prepareFilter(query)});
        const d = res.data;
        return {data: d, page: res.page, totalCount: res.totalCount};
    };

    const prepareFilter = (query: Query<Licence>): Search => {
        const filters: any = [];
        if (name) filters.push({name:'name',value:name});
        if (id) {
            filters.push({name:'id',value:id})
        } else {
            if (query.filters.length > 0) {
                query.filters.forEach((col: any) => {
                    filters.push({name: col.column.field, value: col.value});
                });
            }
       }
        setPSize(query.pageSize)
        return {
            currentPage: query.page,
            pageSize: query.pageSize,
            orderBy: query.orderBy ? query.orderBy.field : undefined,
            orderDirection: query.orderDirection ? query.orderDirection.toUpperCase() : 'ASC',
            search:query.search,
            filters
        };
    };

    const exportPDF = async () => {
        let rowstoDisplay : any[][] = [];
        const filename = 'Licences.pdf';
        tableRef.current.state.data.forEach((r:Licence,index:number)=>{
            rowstoDisplay.push([r.id,r.licenceNumber,r.name,r.firstName,r.club,r.gender,r.dept,r.birthYear,r.catea,r.catev,r.fede,r.saison]);
        })
        let doc = new jsPDF("p","mm","a4");
        // @ts-ignore
        var totalPagesExp = '{total_pages_count_string}'
        // @ts-ignore
        doc.autoTable({head: [['ID', 'Licence N°', 'Nom','Prenom', 'Club','H/F','Dept','Année','Cat.A','Cat.V','Fédé.','Valid.']],
            bodyStyles: {
                minCellHeight:3,
                cellHeight:3,
                cellPadding:0.5
            },
            columnStyles: {
                0: {cellWidth: 10},
                1: {cellWidth: 20},
                2: {cellWidth: 20},
                3: {cellWidth: 20},
                4: {cellWidth: 40},
                5: {cellWidth: 10},
                6: {cellWidth: 10},
                7: {cellWidth: 15},
                8: {cellWidth: 12},
                9: {cellWidth: 12},
                10: {cellWidth: 15},
                11: {cellWidth:10}
            },body: rowstoDisplay,
            didDrawPage: (data:any) => {
                // Header
                doc.setFontSize(14)
                doc.setTextColor(40)
                doc.setFontStyle('normal')
                doc.setFontSize(10)
                doc.text('Open Dossard - Listing de '  + rowstoDisplay.length + ' Licences', data.settings.margin.left + 70, 10);

                // Footer
                var str = 'Page ' + doc.internal.getNumberOfPages() + '/' + totalPagesExp
                doc.setFontSize(8)

                // jsPDF 1.4+ uses getWidth, <1.4 uses .width
                var pageSize = doc.internal.pageSize
                var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
                doc.text(str, data.settings.margin.left, pageHeight - 10)
                doc.text("Fichier : " + filename + " Imprimé le : " + moment().format("DD/MM/YYYY HH:mm:ss"), 70, pageHeight - 5)
            },
            margin: { top: 14,left:10 },
            styles: {
                valign: 'middle',
                fontSize: 7,
                minCellHeight: 5,
                maxCellHeight:5,
                margin:0
            },
        });
        // @ts-ignore
        let finalY = doc.lastAutoTable.finalY;
        doc.putTotalPages(totalPagesExp)
        doc.save(filename);
    }
    return (
        <Paper style={{flex:1,padding:'5px'}}>
            <MaterialTable
                title={T.LICENCES.TITLE}
                tableRef={tableRef}
                columns={[
                    {title: 'ID', field: 'id',headerStyle:{maxWidth: 20,minWidth:20},filterPlaceholder: id},
                    {title: 'Licence N°', field: 'licenceNumber',headerStyle:{width:20,minWidth:20}},
                    {title: 'Nom', field: 'name',headerStyle:{width:150,minWidth:150,maxWidth:150}},
                    {title: 'Prénom', field: 'firstName',headerStyle:{width:100,minWidth:100,maxWidth:100}},
                    {title: 'Club', field: 'club',headerStyle:{width:380,minWidth:380}},
                    {title: 'H/F', field: 'gender',headerStyle:{width:10,minWidth:10,maxWidth: 10}},
                    {title: 'Dept', field: 'dept',headerStyle:{width:10,minWidth:10,maxWidth: 10}},
                    {title: 'Année', field: 'birthYear',headerStyle:{width:10,minWidth:10,maxWidth: 10}},
                    {title: 'Caté.A', field: 'catea',headerStyle:{width:10,minWidth:10,maxWidth: 10}},
                    {title: 'Caté.V', field: 'catev',headerStyle:{width:10,minWidth:10,maxWidth: 10}},
                    {title: 'Fédé', field: 'fede',headerStyle:{width:20,minWidth:20,maxWidth: 20},sorting:false},
                    {title: 'Saison', field: 'saison',headerStyle:{width:20,minWidth:20,maxWidth: 20},sorting:false},
                ]}

                data={fetchLicences}
                icons={tableIcons}
                options={{
                    filterCellStyle:{maxWidth:100,padding:0, margin:0},
                    rowStyle:{maxHeight:20,fontSize:10,padding:0,margin:0},
                    filtering: true,
                    debounceInterval:1000,
                    pageSize:psize,
                    toolbar: true,
                    padding: 'dense',
                    actionsColumnIndex: -1,
                    maxBodyHeight: windowDimensions.height - 200,
                    pageSizeOptions: [5, 10, 17, 20, 100],
                    search: true,
                    exportButton: true,
                    exportFileName:"licences",
                    headerStyle: {
                        backgroundColor: cadtheme.palette.primary.main,
                        color: '#FFF',
                        fontSize: 15,
                        padding:5,
                        zIndex: 'auto',
                    }
                }}
                editable={{
                    onRowDelete: async (oldData)  => {
                        try {
                            store.dispatch(setVar({showLoading: true}))
                            await apiLicences._delete({id: `${oldData.id}`});
                        } catch (ex) {
                            setNotification({
                                message: `Le coureur ${oldData.firstName} ${oldData.name} n'a pas été supprimé (pb réseau ou coureur déjà engagé sur une course)`,
                                open: true,
                                type: 'error'
                            });
                        }
                        finally {
                            store.dispatch(setVar({showLoading: false}))
                        }
                    }
                }}
                actions={[
                    {
                        icon: () => <Button variant={'contained'} color={'primary'}>Ajouter une licence</Button>,
                        tooltip: T.LICENCES.ADD_NEW_LICENCE,
                        isFreeAction: true,
                        onClick: () => {
                            props.history.push('/licence/new');
                        }
                    },
                    {
                        icon: () => <Button variant={'contained'} color={'secondary'}>Tout Afficher</Button>,
                        tooltip: "Afficher tous les enregistrements",
                        isFreeAction: true,
                        onClick: () => {
                            props.history.push('/licences/');
                        }
                    },
                    {
                        icon: 'edit',
                        iconProps:{fontSize:'small'},
                        tooltip: T.LICENCES.EDIT_TOOL_TIP,
                        onClick: (event, rowData:any)=> {
                            props.history.push('/licence/'+rowData.id);
                        }
                    },
                    {
                        icon: () => <ActionButton><span style={{color:'white'}} ><PictureAsPdf style={{verticalAlign:'middle'}}/>Export PDF</span></ActionButton>,
                        tooltip: "Exporter la page courante en PDF",
                        isFreeAction: true,
                        onClick: () => {
                            exportPDF()
                        }
                    },
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
                        },
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
                        searchPlaceholder: T.LICENCES.TOOLBAR.SEARCH_PLACE_HOLDER
                    }
                }}
            />
        </Paper>
    )
        ;
};

export default LicencesPage;
