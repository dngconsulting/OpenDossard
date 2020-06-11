import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {Grid, Paper, TextField, Theme, withStyles} from '@material-ui/core';
import * as Highcharts from 'highcharts';
import {RaceRow} from '../sdk';
import _ from 'lodash';
import {apiRaces} from '../util/api';
import HighchartsReact from 'highcharts-react-official';
import {CATEA_FSGT,CATEA_UFOLEP} from '../pages/common/shared-entities'
import moment from "moment";
import Box from '@material-ui/core/Box';

interface IDashboardProps {
    classes?: any;
}

const cateLabelFrom = (cate : string) => {
    const catea = CATEA_FSGT.concat(CATEA_UFOLEP).filter(item=> item.value.toUpperCase()===cate.toUpperCase())[0]
    return catea===undefined?cate:catea.label
}
const HomePage = (props: IDashboardProps) => {
    const {classes} = props;
    const [optionNbRidersChartClub, setOptionNbRidersChartClub] = useState<Highcharts.Options>();
    const [optionNbRidersChartRiders, setOptionNbRidersChartRiders] = useState<Highcharts.Options>();
    const [optionNbLicencesChartRiders, setOptionNbLicencesChartRiders] = useState<Highcharts.Options>();
    const [optionParCateA, setOptionParCateA] = useState<Highcharts.Options>();
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const fillRiderByCateaChart = (rows: RaceRow[]) => {
        const options: Highcharts.Options = {
            title: {
                text: 'Répartition par catégorie d\'age',
            },
            xAxis: {
                categories: [],
            },
            series: [{
                type: 'pie',
                name: 'Taux',
            }]
        };
        const groupByNbRidersByCatea = _.groupBy(rows, (item: RaceRow) => item.catea);
        const cateaNb = Object.keys(groupByNbRidersByCatea).map(item => {
            return {
                name: cateLabelFrom(groupByNbRidersByCatea[item][0].catea),
                y: groupByNbRidersByCatea[item].length
            };
        });
        // @ts-ignore
        options.series[0].data = cateaNb;
        // @ts-ignore
        setOptionParCateA(options);
    };

    const fillRiderParticipationChart = (rows: RaceRow[]) => {
        const options: Highcharts.Options = {
            title: {
                text: 'Nombre de coureurs par course',
            },
            xAxis: {
                categories: [],
            },
            yAxis: {
                title: {
                    text: 'nb coureurs'
                }
            },
            series: [{
                type: 'column',
                name: 'Nombre de coureurs'
            }]
        };
        const nbRidersByCourse = _.groupBy(rows, (item: RaceRow) => item.competitionId);
        // @ts-ignore
        options.series[0].data = Object.keys(nbRidersByCourse).map(item => nbRidersByCourse[item].length);
        // @ts-ignore
        options.xAxis.categories = Object.keys(nbRidersByCourse).map(item => nbRidersByCourse[item][0].name);
        setOptionNbRidersChartRiders(options);
    };
    const fillRiderOnlyParticipationChart = (rows: RaceRow[]) => {
        const options: Highcharts.Options = {
            title: {
                text: 'Coureurs les plus assidus',
            },
            xAxis: {
                categories: [],
                max:19
            },
            yAxis: {
                title: {
                    text: 'nb participations'
                }
            },
            series: [{
                type: 'column',
                name: 'Participations'
            }]
        };
        const groupByLicenceNumber = _.groupBy(rows, (item: RaceRow) => item.riderName);
        const licenceAndNbPart = Object.keys(groupByLicenceNumber).map(item => {
            return {
                riderName: groupByLicenceNumber[item][0].riderName,
                nb: groupByLicenceNumber[item].length
            };
        });
        const licenceAndNbOrdered = _.orderBy(licenceAndNbPart, ['nb'], ['desc']);
        // @ts-ignore
        options.series[0].data = licenceAndNbOrdered.map(item => item.nb);
        // @ts-ignore
        options.xAxis.categories = licenceAndNbOrdered.map(item => item.riderName);
        setOptionNbLicencesChartRiders(options);
    };

    const fillClubParticipationChart = (rows: RaceRow[]) => {
        const options: Highcharts.Options = {
            title: {
                text: 'Participation des clubs',
            },
            xAxis: {
                categories: [],
                max:10
            },
            yAxis: {
                title: {
                    text: 'nb de participations'
                }
            },
            series: [{
                type: 'column',
                name: 'Nombre de participations par club'
            }]
        };
        const riders = _.groupBy(rows, (item: RaceRow) => item.club);
        const clubAndNb = Object.keys(riders).map(item => {
            return {club: riders[item][0].club, nb: riders[item].length};
        });
        const clubAndNbOrdered = _.orderBy(clubAndNb, ['nb'], ['desc']);
        // @ts-ignore
        options.series[0].data = clubAndNbOrdered.map(item => item.nb);
        // @ts-ignore
        options.xAxis.categories = clubAndNbOrdered.map(item => item.club);
        setOptionNbRidersChartClub(options);
    };
    const startDate = (startDateRef && startDateRef.current)?startDateRef.current.value:"2018-05-24";
    const endDate = (endDateRef && endDateRef.current)?endDateRef.current.value:moment().locale('fr').format('YYYY-MM-DD');
    const getRaces = async () => {
        const d1 = moment(startDateRef.current.value,moment.HTML5_FMT.DATE).locale('fr').format('MM/DD/YYYY');
        const d2 = moment(endDateRef.current.value,moment.HTML5_FMT.DATE).locale('fr').format('MM/DD/YYYY');
        if (d1.includes('Invalid date') || d2.includes('Invalid date')) return;
        const rows = await apiRaces.getRaces({
            competitionFilter:{
                displayFuture:true,
                displayPast:true,
                startDate:d1,
                endDate:d2,
            }});
        fillRiderParticipationChart(rows);
        fillClubParticipationChart(rows);
        fillRiderOnlyParticipationChart(rows);
        fillRiderByCateaChart(rows);
    };
    useEffect(() => {
            getRaces();
        }
        , []);


    return (
        <div className={classes.root}>
            <Box padding={1} display="flex" flexDirection="row" justifyContent={"center"} alignItems="center">
            <TextField
                inputRef={startDateRef}
                id="date"
                label="Date de début"
                type="date"
                onChange={()=>getRaces()}
                defaultValue={startDate}
                className={classes.textField}
                InputLabelProps={{
                    shrink: true,
                }}
            />
            <TextField
                inputRef={endDateRef}
                id="date"
                label="Date de fin"
                type="date"
                defaultValue={endDate}
                onChange={()=>getRaces()}
                className={classes.textField}
                InputLabelProps={{
                    shrink: true,
                }}
            />
            </Box>
            <Grid container={true}> {
                [optionNbRidersChartRiders, optionNbRidersChartClub, optionParCateA, optionNbLicencesChartRiders].map((item, index) =>
                    <Grid key={index} style={{padding: 5}} item={true} xs={12} md={6}>
                        <Paper className={classes.paper}>
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={item}
                            />
                        </Paper>
                    </Grid>
                )
            }
            </Grid>
        </div>
    );

};

const styles = (theme: Theme) => ({
    root: {
        flexGrow: 1,
        marginBottom: 24,
    },
    paper: {
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    headerTiles: {
        overflowX: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRight: `5px solid ${theme.palette.secondary.main}`,
    },
    headerTileIcon: {
        fontSize: 40,
        color: theme.palette.primary.main,
        paddingRight: 5
    },
    tileText: {
        fontSize: 20,
        color: theme.palette.grey['400'],
    },
    sectionTitle: {
        paddingLeft: theme.spacing(2),
    },
    chart: {
        width: '100%'
    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 200,
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
    },
});

export default withStyles(styles as any)(HomePage as any) as any;
