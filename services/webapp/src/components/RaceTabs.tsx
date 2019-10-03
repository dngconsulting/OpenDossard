import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import * as React from "react";

export interface IRaceStat {[code:string] : number}

interface IRaceTabs {
    tabs: IRaceStat
    value: string,
    onChange: (value:string) => void
}

const RaceTab = ({code, n, selected, onClick} : {
    code: string,
    n:number,
    selected: boolean,
    onClick: (race: string) => void
}) => {
    return <span>
        <Button onClick={() => onClick(code)}>
    <span>{code}</span>
    <span>({n})</span>
    </Button>
    </span>
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
