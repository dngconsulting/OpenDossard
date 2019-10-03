import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import * as React from "react";
import {makeStyles} from "@material-ui/core";

export interface IRaceStat {[code:string] : number}

interface IRaceTabs {
    tabs: IRaceStat
    value: string,
    onChange: (value:string) => void
}

const useStyle = makeStyles(theme => ({
    tab: {
        display: 'inline-block',
    },
    button: {
        background: theme.palette.common.white,
        paddingLeft: 50, paddingRight: 20,
        paddingTop: 20, paddingBottom: 20,
    },
    selected: {
        background: theme.palette.primary.main,
        height: 3
    },
    notselected: {
        height: 3
    },
    tooltip: {
        color: theme.palette.common.white,
        background: theme.palette.primary.main,
        height: 20,
        minWidth: 20,
        borderRadius: 10,
        display: 'inline-block',
        marginLeft: 20,
        lineHeight: '20px',
        paddingLeft: 5,
        paddingRight: 5,
    }
}));

const RaceTab = ({code, n, selected, onClick} : {
    code: string,
    n:number,
    selected: boolean,
    onClick: (race: string) => void
}) => {
    const classes = useStyle({});

    return <div className={classes.tab}>
        <Button onClick={() => onClick(code)} className={classes.button} title={`${n} coureurs inscrits en catégorie ${code}`}>
            <span>{code}</span>
            <div className={classes.tooltip}>{n}</div>
        </Button>
        <div className={selected ? classes.selected: classes.notselected}/>
    </div>
}

const RaceTabs = ({tabs, value, onChange}: IRaceTabs) => (
    <Paper square={true}>
        {
            Object.keys(tabs).sort().map(code => <RaceTab
                key={code}
                code={code}
                n={tabs[code]}
                onClick={onChange} selected={code === value}/>
            )
        }
    </Paper>
)

export default RaceTabs
