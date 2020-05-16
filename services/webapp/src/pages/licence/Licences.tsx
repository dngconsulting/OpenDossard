import * as React from 'react';
import {Ref, useEffect, useRef, useState} from 'react';
import MaterialTable, {Query, QueryResult} from 'material-table';
import {AppText as T} from '../../util/text';
import {apiLicences} from '../../util/api';
import {LicenceEntity as Licence,Search} from '../../sdk';
import {cadtheme} from '../../theme/theme';
import {Button, Icon, Paper} from '@material-ui/core';
import AwesomeDebouncePromise from 'awesome-debounce-promise';
import {useContext} from "react";
import {NotificationContext} from "../../components/CadSnackbar";
import {store} from "../../store/Store";
import {setVar} from "../../actions/App.Actions";

interface ILicencesProps {
    items: any[];
    classes: any;
    history: any;
    location:any
}

const getPageSizeLicencesForPageDebounced = AwesomeDebouncePromise((p) => apiLicences.getPageSizeLicencesForPage({search:p}),500)

const tableIcons = {
    Add: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>add_box</Icon>),
    Check: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>check</Icon>),
    Clear: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>clear</Icon>),
    Delete: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon style={{fontSize:'20px'}} {...props} ref={ref}>delete_outline</Icon>),
    DetailPanel: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>chevron_right</Icon>),
    Edit: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon style={{fontSize:'10px'}}  {...props} ref={ref}>edit</Icon>),
    Export: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>save_alt</Icon>),
    Filter: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon style={{fontSize:'15px'}} {...props} ref={ref}>filter_list</Icon>),
    FirstPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>first_page</Icon>),
    LastPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>last_page</Icon>),
    NextPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>chevron_right</Icon>),
    PreviousPage: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>chevron_left</Icon>),
    ResetSearch: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>clear</Icon>),
    Search: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>search</Icon>),
    SortArrow: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>arrow_downward</Icon>),
    ThirdStateCheck: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>remove</Icon>),
    ViewColumn: React.forwardRef((props, ref:Ref<SVGSVGElement>) => <Icon {...props} ref={ref}>view_column</Icon>)
};



const LicencesPage = (props: ILicencesProps) => {
    const [id,setId] = useState(null)
    const [name,setName] = useState(null)
    const [, setNotification] = useContext(NotificationContext);
    const tableRef = useRef()
    useEffect(()=> {
        const queryParams = new URLSearchParams(props.location.search)
        if (queryParams.has('id')) {
            setId(queryParams.get('id'))
        };
        return ()=>{setId(null)}
    })

    const fetchLicences = async (query: Query<Licence>): Promise<QueryResult<Licence>> => {
        const res = await getPageSizeLicencesForPageDebounced(prepareFilter(query));
        return {data: res.data, page: res.page, totalCount: res.totalCount};
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
        return {
            currentPage: query.page,
            pageSize: query.pageSize,
            orderBy: query.orderBy ? query.orderBy.field : undefined,
            orderDirection: query.orderDirection ? query.orderDirection.toUpperCase() : 'ASC',
            search:query.search,
            filters
        };
    };
    return (

        <Paper style={{padding:'5px', height:'100%'}}>

            <MaterialTable
                title={T.LICENCES.TITLE}
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
                ]}

                ref={tableRef}
                data={fetchLicences}
                icons={tableIcons}
                options={{
                    filterCellStyle:{maxWidth:100,padding:0, margin:0},
                    rowStyle:{maxHeight:20,fontSize:10,padding:0,margin:0},
                    filtering: true,
                    toolbar: true,
                    padding: 'dense',
                    actionsColumnIndex: -1,
                    pageSize: 17,
                    pageSizeOptions: [5, 10, 20],
                    search: true,
                    headerStyle: {
                        backgroundColor: cadtheme.palette.primary.main,
                        color: '#FFF',
                        fontSize: 15,
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
