import * as React from "react";
import Tabs from "@material-ui/core/Tabs";
import Badge from "@material-ui/core/Badge";
import Tab from "@material-ui/core/Tab";
import {createStyles, Theme} from "@material-ui/core";
import makeStyles from "@material-ui/core/styles/makeStyles";

export interface IRaceStat {[code:string] : number}

interface IRaceTabs {
    tabs: IRaceStat,
    selected:string,
    value: string,
    onChange: (value:string) => void,
    ranking: any
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        tabs: {
            minHeight: 0,
            color : 'black',
            '& button': {
                marginRight:5,
                color: 'white',
                fontSize:'20px',
                fontWeight : 'bolder',
                minHeight: 0,
                paddingBottom: 3,
                paddingTop: 13,
                paddingLeft:5,
                paddingRight:5,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                backgroundColor: theme.palette.grey[300],
                '&[aria-selected="true"]': {
                    backgroundColor: theme.palette.secondary.light,
                    color: 'white',
                    fontSize:'20px',
                    fontWeight : 'bolder'
                }
            }
        },
        badge: {
            padding: theme.spacing(0, 2),
        },
    }),
);

const RaceTabs = ({tabs, value, onChange, selected, ranking}: IRaceTabs) => {
    const classes = useStyles({});

    return (
        <Tabs value={value || Object.keys(tabs)[0] }
              onChange={(e, v) => onChange(v)}
              className={classes.tabs}
              centered={true}
              TabIndicatorProps={{style: {height:0}}} >
            {
                Object.keys(tabs).sort().map((code,index) => (
                        <Tab selected={code===selected} key={code}
                             value={code}
                             label={
                            <Badge badgeContent={`${ranking.get(code) ? ranking.get(code) + "/" : ""}${tabs[code]}`}
                                   max={999}
                                   className={classes.badge}
                                   color="secondary">
                                {code}
                            </Badge>
                        }/>
                    )
                )
            }
        </Tabs>
    );
}

export default RaceTabs
