import React, {useContext, useRef, useState} from 'react';

import { CircularProgress, Fab, IconButton, makeStyles } from '@material-ui/core';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {apiRaces} from '../util/api';
import Grid from '@material-ui/core/Grid';
import {CompetitionLayout} from './CompetitionLayout';
import {NotificationContext} from '../components/CadSnackbar';
import {DataTable} from 'primereact/datatable';
import {Column, ColumnProps} from 'primereact/column';
import {CreationForm} from './engagement/EngagementCreation';
import {Reorganizer} from './engagement/ReorganizeRaces';
import Box from '@material-ui/core/Box';
import {RaceRow} from '../sdk';
import {CloudDownload, Delete, PictureAsPdf, Warning} from '@material-ui/icons';
import jsPDF from "jspdf";
import 'jspdf-autotable'
import {Link} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import {styles} from "../navigation/styles";
import * as _ from "lodash";
import moment from 'moment'
import 'moment/locale/fr'
import SearchIcon from '@material-ui/icons/Search';
import {capitalizeFirstLetter, ConfirmDialog, displayDossard, useWindowDimensions} from "../util";
import {ActionButton} from "../components/ActionButton";
import FormatListNumberedIcon from "@material-ui/icons/FormatListNumbered";
import {cadtheme} from "../theme/theme";
import ExpandMore from "@material-ui/icons/ExpandMore";
import {DropdownMenu, DropdownMenuItem} from "../components/DropdownMenu";

moment.locale('fr')
const style = makeStyles(theme => ({
    surclassed: {
        zoom: '79%',
        display: 'inline-block',
        position: 'absolute',
        marginLeft: 10
    }
}));


const filterByRace = (rows: RaceRow[], race: string): RaceRow[] => {
    return rows.filter((coureur) => coureur.raceCode === race);
};

const surclassed = ({catev, raceCode}: RaceRow) => {
    return raceCode.split('/').indexOf(catev) >= 0 ? false : true;
};


const SHORT = {style: {width: 90, textAlign: 'center', padding: 5}, bodyClassName: 'nopadding'};
const EngagementPage = (props: any) => {
    const { height, width } = useWindowDimensions();
    const competitionId = props.match.params.id;
    const saisieResultat = props.match.url.includes('engagementresultats');
    const dg = useRef(null);
    const [, setNotification] = useContext(NotificationContext);
    const [selectedRow, selectRow] = useState<RaceRow>();
    const [open, openDialog] = React.useState(false);
    const [showSablier,setShowSablier] = React.useState(false);
    const [showFilters,setShowFilters] = React.useState(false);
    const [downloadMenuAnchorEl, setDownloadMenuAnchorEl] = useState(null)

    const FILTERABLE = {filter: showFilters, filterMatchMode: 'contains'};
    const closeDialog = () => {
        openDialog(false);
    };

    const classes = style({});

    const exportCSV = async () => {
        dg && dg.current && dg.current.exportCSV();
    }

    return <CompetitionLayout history={props.history} competitionId={competitionId} displayType={'engagements'}>
        {
            ({competition, currentRace, rows, fetchRows, fetchCompetition}) => {

                const deleteAction = (row: RaceRow, column: any) => {
                    if (saisieResultat) {
                        if (column.rowIndex + 1 === rows.length) {
                            return (<Delete fontSize={'small'} onClick={() => {
                                selectRow(row);
                                openDialog(true);
                            }}/>);
                        } else {
                            return null
                        }
                    } else {
                        return (<Delete fontSize={'small'} onClick={() => {
                            selectRow(row);
                            openDialog(true);
                        }}/>)
                    }
                };

                const handleOk = async (fetchRows: any) => {
                    closeDialog();
                    try {
                        setShowSablier(true)
                        await apiRaces.deleteRace({id: String(selectedRow.id)});
                        await fetchRows();
                    } catch (ex) {
                        setNotification({
                            message: `Le coureur ${selectedRow.name} n'a pas pu être supprimé`,
                            type: 'error',
                            open: true
                        });
                        throw ex;
                    }
                    finally {
                        setShowSablier(false)
                    }
                    setNotification({
                        message: `Le coureur ${selectedRow.name} a été supprimé de la compétition`,
                        type: 'info',
                        open: true
                    });
                };

                const columns: ColumnProps[] = [
                    {
                        header:<IconButton style={{height:20,padding:0}} onClick={() => {setShowFilters((prevState => !prevState))}}>
                            {<SearchIcon height={20} style={{padding:0}} htmlColor={'#333333'}/>}
                        </IconButton>,
                        style: {
                            width: 50,
                            textAlign: 'center',
                            paddingLeft: 5,
                            paddingRight: 5,
                            cursor: 'pointer'
                        },
                        bodyClassName: 'nopadding',
                        body: (rowdata:RaceRow, column:any) => {
                            if (rowdata.comment==null && rowdata.rankingScratch == null)
                                return deleteAction(rowdata,column)
                            else return 'Classé'
                        }
                    },
                    ...(saisieResultat ? [{
                        header:'Clt',
                        body: (rowdata: RaceRow, column: any) => column.rowIndex + 1, ...SHORT
                    }]:[]),
                    {field: 'riderNumber', header: 'Dossard', ...FILTERABLE, ...SHORT, body:(row:RaceRow)=>displayDossard(row.riderNumber.toString()),sortable:true},
                    {field: 'name', header: 'Coureur', ...FILTERABLE, bodyClassName: 'nopadding',body: (rowdata: RaceRow, column: any) =>
                        (rowdata.comment==null && rowdata.rankingScratch == null)?<Link to={"/licence/"+rowdata.licenceId+"#engagement_"+rowdata.competitionId}>{rowdata.name}</Link>:rowdata.name}
                        ,
                    {field: 'club', header: 'Club', ...FILTERABLE, bodyClassName: 'nopadding',sortable:true},
                    {field: 'gender', header: 'H/F', ...FILTERABLE, ...SHORT},
                    {field: 'dept', header: 'Dept', ...FILTERABLE,  style: {width: 90,textAlign: 'center'},bodyClassName: 'nopadding',sortable:true},
                    {field: 'birthYear', header: 'Année', ...FILTERABLE, ...SHORT,sortable:true},
                    {field: 'catea', header: 'Caté. A.', ...FILTERABLE, ...SHORT,sortable:true},
                    {
                        field: 'catev', header: 'Caté. V.', ...FILTERABLE, ...SHORT,sortable:true,
                        body: (row: RaceRow) => <span>
                            {row.catev}
                            {surclassed(row) && <span title="surclassé ou catégorie supérieure"
                                                      className={classes.surclassed}><Warning/></span>}
                        </span>
                    },
                    {field: 'fede', header: 'Fédé.', ...FILTERABLE, ...SHORT,sortable:true},
                ];
                const existResults = rows.length>0

                const exportPDF = async () => {
                    let rowstoDisplay : any[][] = [];
                    const lrows = filterByRace(rows, currentRace);
                    const filename = 'Engagement_' + competition.name.replace(/\s/g, '') + '_cate_' + currentRace + '.pdf'
                    _.orderBy(lrows, ['riderNumber'], ['asc']).forEach((r:RaceRow,index:number)=>{
                        if (index===0) {
                            rowstoDisplay.push(['',
                                lrows.length + ' coureurs engagés',
                                _.uniqBy(lrows, 'club').length + ' clubs représentés','',
                                _.uniqBy(lrows, 'dept').length,'',
                                _.uniqBy(lrows, 'catea').length,
                                _.uniqBy(lrows, 'catev').length,_.uniqBy(lrows, 'fede').length])
                        }
                        rowstoDisplay.push([displayDossard(r.riderNumber.toString()),r.name,r.club,r.gender,_.padStart(r.dept.toString(), 2, '0'),r.birthYear,r.catea,r.catev,r.fede])
                    })
                    let doc = new jsPDF("p","mm","a4");
                    // @ts-ignore
                    var totalPagesExp = '{total_pages_count_string}'
                    // @ts-ignore
                    doc.autoTable({head: [['Doss', 'Coureur', 'Club','H/F','Dept','Année','Cat.A','Cat.V','Fédé.']],
                        bodyStyles: {
                            minCellHeight:3,
                            cellHeight:3,
                            cellPadding:0.5
                        },
                        columnStyles: {
                            0: {cellWidth: 10,fillColor:[253,238,115],halign: 'center',fontStyle:'bold'},
                            1: {cellWidth: 55},
                            2: {cellWidth: 55},
                            3: {cellWidth: 10},
                            4: {cellWidth: 10},
                            5: {cellWidth: 12},
                            6: {cellWidth: 10},
                            7: {cellWidth: 10},
                            8: {cellWidth: 12},
                        },body: rowstoDisplay,
                        didParseCell: function(data:any) {
                            if (data && data.row.index === 0) {
                                data.cell.styles.fontStyle = 'bold';
                            }
                        },
                        didDrawPage: (data:any) => {
                            // Header
                            doc.setFontSize(14)
                            doc.setTextColor(40)
                            doc.setFontStyle('normal')
                            if (competition.fede==='FSGT') {
                                doc.addImage("data:image/png;base64,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", 'JPEG', data.settings.margin.left, 0, 20, 13)
                            }
                            doc.setFontSize(10)
                            doc.text('Listing Engagés : ' + competition.name, data.settings.margin.left + 25, 5);
                            doc.text('Date : ' + capitalizeFirstLetter(moment(competition.eventDate).locale('fr').format('dddd DD MMM YYYY')), data.settings.margin.left + 25, 9);
                            doc.text('Catégorie(s) : ' + currentRace, data.settings.margin.left + 25, 13);

                            // Footer
                            var str = 'Page ' + doc.internal.getNumberOfPages() + '/' + totalPagesExp
                            doc.setFontSize(8)

                            // jsPDF 1.4+ uses getWidth, <1.4 uses .width
                            var pageSize = doc.internal.pageSize
                            var pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
                            doc.text(str, data.settings.margin.left, pageHeight - 10)
                            doc.text("Fichier : " + filename + " Imprimé à : " + moment().format("HH:mm:ss"), 40, pageHeight - 5)
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

                const controleDossards = () => {
                    const lrows = filterByRace(rows, currentRace);
                    const groupByCatev = _.groupBy(lrows, (item: RaceRow) => item.catev);
                    let shouldExit = false;
                    Object.keys(groupByCatev).map(item => {
                        const diffMaxMin = _.maxBy(groupByCatev[item], (c)=>c.riderNumber).riderNumber - _.minBy(groupByCatev[item], (c)=>c.riderNumber).riderNumber + 1;
                        if (groupByCatev[item].length != diffMaxMin) {
                            setNotification({
                                message: `Attention la catégorie ${item} n'est pas continue`,
                                type: 'error',
                                open: true
                            });
                            shouldExit = true
                            return;
                        }
                    });
                    if (shouldExit) return;
                    setNotification({
                        message: `Controle des dossards OK`,
                        type: 'success',
                        open: true
                    });
                }

                const canReorganise = (rows:RaceRow[]) =>  {
                    const alreadyRanked = !(rows.filter((rr:RaceRow)=>(rr.rankingScratch!=null || rr.comment!=null)).length===0)
                    const groupByNumber = _.groupBy(rows, row=>row.riderNumber);
                    const sameNumberInDifferentCates = Object.keys(groupByNumber).filter(key=>groupByNumber[key].length>1).length>0
                    if (alreadyRanked) return 'Réorganisation de la course impossible car des coureurs ont déjà été classés'
                    else if (sameNumberInDifferentCates) return 'Réorganisation de la course impossible car la même séquence de dossard a été affectée à plusieurs catégories'
                    return true;
                }
                const canReorg = canReorganise(rows)
                return (
                    <Box position="relative" padding={0}>
                        {showSablier && <div style={{position:'fixed',display:'block',width:'100%',height:'100%',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',zIndex:10000,cursor:'pointer'}}>
                            <div style={{position:'absolute',top:'40%',left:'40%'}}>
                                <CircularProgress color="primary" />
                            </div>
                        </div>}
                        <div style={{display:'flex',flexDirection:'row',backgroundColor:'#3333330d', justifyContent:'space-between', padding:'5px'}}>
                            <div style={{display:'flex',flexDirection:'row'}}>
                                <Reorganizer tooltip={canReorg===true?'Fusionner ou scinder des départs':canReorg.toString()} disabled={canReorg!=true} competition={competition} rows={rows} onSuccess={() => {
                                    fetchRows();
                                    fetchCompetition();
                                }}/>
                                <ActionButton
                                    title="Télécharger"
                                    color="primary"
                                    aria-controls={'download-menu'}
                                    aria-haspopup="true"
                                    onClick={(evt:React.MouseEvent)=> setDownloadMenuAnchorEl(evt.currentTarget)}
                                >
                                    <span style={{color:'white'}}> Télécharger <ExpandMore style={{verticalAlign:'middle'}}/></span>
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
                                    <DropdownMenuItem title={'Télécharger les engagement en PDF'} onClick={() => {exportPDF(); setDownloadMenuAnchorEl(null)}}>
                                        <PictureAsPdf style={{verticalAlign:'middle'}}/> Engagements PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem title={'Télécharger les engagement en CSV'} onClick={() => {exportCSV(); setDownloadMenuAnchorEl(null)}}>
                                        <CloudDownload style={{verticalAlign:'middle'}}/> Engagements CSV
                                    </DropdownMenuItem>

                                </DropdownMenu>
                            </div>
                            {existResults && <div style={{display:'flex',flexDirection:'row'}}>
                                <Fab
                                style={{borderRadius:4,fontSize:'12px',margin:'5px',paddingLeft:10,fontWeight:'bold',paddingRight:10,paddingBottom:5,paddingTop:5,backgroundColor:cadtheme.palette.primary.dark}}
                                variant="extended" size='small'><Link style={{ color: '#FFF' }} to={"/competition/" + competition?.id + "/results/edit"+props.history.location.hash}>
                                <FormatListNumberedIcon style={{verticalAlign:'middle'}}/>
                                Accéder aux classements</Link></Fab></div>}
                        </div>
                        <Grid container={true}>
                            <ConfirmDialog question={'Êtes-vous sûr de vouloir désengager le coureur ' + (selectedRow ? selectedRow.name : null)} title={'Désengager un coureur'} open={open}
                                           confirmMessage={'Oui'}
                                           cancelMessage={'Non'}
                                           handleClose={closeDialog}
                                           handleOk={() => handleOk(fetchRows)}/>
                            <CreationForm competition={competition}
                                          race={currentRace}
                                          onSuccess={fetchRows}
                                          saisieResultat={saisieResultat}
                                          rows={rows}
                            />
                        </Grid>

                        <DataTable ref={dg} value={saisieResultat?filterByRace(rows, currentRace).reverse():filterByRace(rows, currentRace)}
                                   scrollHeight={(height-300)+'px'}
                                   scrollable={true}
                                   emptyMessage="Aucun coureur encore engagé sur cette épreuve ou aucun coureur ne correspond à votre filtre de recherche"
                                   responsive={true}
                                   columnResizeMode='expand'
                                   reorderableColumns
                                   onColReorder={e=> {
                                       console.log("Col Reorder dragIndex=" + e.dragIndex,"dropIndex="+e.dropIndex + " columns=" + e.columns)
                                   }}
                                   resizableColumns
                                   exportFilename={'Engagements_'+(competition&&competition.name) + '_CAT_' + currentRace}
                        >
                            {columns.map((column, i) => <Column key={i} columnKey={(i++).toString()} {...column}/>)}
                        </DataTable>
                    </Box>
                );
            }
        }

    </CompetitionLayout>;

};

export default withStyles(styles as any, {withTheme: true})(EngagementPage as any);
