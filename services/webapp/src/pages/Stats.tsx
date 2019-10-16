import * as React from 'react';

import {Typography} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import HighchartsTest from "./HighchartsTest";
import * as Highcharts from "highcharts";
import {useEffect, useState} from "react";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import AutocompleteInput from "../components/AutocompleteInput";
import {apiRaces} from "../util/api";
import {RaceNbRider} from "../sdk";

interface IStatsPageProps {
    items: any[];
    classes: any;
}

// const useStyles = makeStyles((theme: Theme) =>
//     createStyles({
//         formControl: {
//             minWidth: 167,
//         },
//         button: {
//             margin: theme.spacing(1),
//         }
//     }),
// );

const getNbRiderPerRace = async () => {
    const raceNbRiders : RaceNbRider[] = await apiRaces.getNumberRider();
    return raceNbRiders;
}

const StatsPage = (props: IStatsPageProps) => {

    const [selectValue, setSelectValue] = useState<string>('column')
    const [options, setOptions] = useState<Highcharts.Options>({
        title: {
            text: 'Nombre de participants par course'
        },
        series: [{
            type: 'column',
            data: [],
            name: 'test1'
        }, {
            type: 'column',
            name: 'test2',
            data: []
        }]
    });

    useEffect(() => {

        getNbRiderPerRace()
            .then(array => {

                console.log(array);
                const tabTemp : Array<{type: any, data : number[], name: string}> = [{type: '', data: [], name: ''}];

                array.forEach( x => {
                    if(tabTemp.length === 1 && tabTemp[tabTemp.length-1].name === ''){
                        tabTemp[tabTemp.length-1].type = options.series[0].type;
                        tabTemp[tabTemp.length-1].data.push(+x.count);
                        tabTemp[tabTemp.length-1].name = x.name;
                    } else if(x.name !== tabTemp[tabTemp.length-1].name) {
                        tabTemp.push({
                            type: options.series[0].type,
                            data: [+x.count],
                            name: x.name
                        })
                    } else {
                        tabTemp[tabTemp.length-1].data.push(+x.count);
                    }
                });

                setOptions(oldValues => ({
                    ...oldValues,
                    series: tabTemp
                }))
            })
            .catch(error => {
                console.error(error)
            });
    }, []);


    const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {

        const map: any = options.series.map(serie => ({
                ...serie,
                type: event.target.value
        }));
        console.log(options)
        setOptions(oldValues => ({
            ...oldValues,
            series: map
        }));
        setSelectValue(event.target.value as string);
    }

    return (

        <div>

            <Grid container={true} spacing={3}>
                <Grid item={true} xs={12}>
                    <Typography noWrap={false}>Statistique</Typography>
                </Grid>

                <Grid item={true} xs={5}>
                        <Select
                            value={selectValue}
                            onChange={handleChange}
                            inputProps={{
                                name: 'Diagramme',
                                id: 'diagramme',
                            }}
                        >
                            <MenuItem value={'line'}>Diagramme ligne</MenuItem>
                            <MenuItem value={'column'}>Diagramme bâton</MenuItem>
                        </Select>
                </Grid>

            </Grid>

            <AutocompleteInput style={{width: '450px'}}/>

            <HighchartsTest options={options}/>
        </div>
    );

}

export default StatsPage;
