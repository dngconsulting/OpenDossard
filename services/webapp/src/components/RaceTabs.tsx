import Button from "@material-ui/core/Button";
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
        width: 200
    },
    button: {
        background: theme.palette.grey[300],
        paddingLeft: 50, paddingRight: 20,
        paddingTop: 15, paddingBottom: 10,
        width: '100%',
        display: 'inline-block',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    buttonselected: {
        background: theme.palette.common.white,
    },
    tooltip: {
        color: theme.palette.common.white,
        background: theme.palette.secondary.main,
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
        <Button onClick={() => onClick(code)} className={`${classes.button} ${selected && classes.buttonselected}`}
                title={`${n} coureurs inscrits en catégorie ${code}`}>
            <span>{code}</span>
            <div className={classes.tooltip}>{n}</div>
        </Button>
    </div>
}

const RaceTabs = ({tabs, value, onChange}: IRaceTabs) => (
    <div style={{textAlign: 'center'}}>
        {
            Object.keys(tabs).sort().map(code => <RaceTab
                key={code}
                code={code}
                n={tabs[code]}
                onClick={onChange} selected={code === value}/>
            )
        }
    </div>
)

export default RaceTabs
