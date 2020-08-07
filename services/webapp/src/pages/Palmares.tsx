import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {VerticalTimeline, VerticalTimelineElement} from 'react-vertical-timeline-component';
import AutocompleteInput from "../components/AutocompleteInput";
import {filterLicences} from "./common/filters";
import {LicenceEntity as Licence, RaceRow} from "../sdk/models";
import 'react-vertical-timeline-component/style.min.css';
import EmojiEventsIcon from "@material-ui/icons/EmojiEvents";
import './palmares.css';
import {apiRaces} from "../util/api";
import _ from 'lodash';
import moment from "moment";
import {useContext} from "react";
import {NotificationContext} from "../components/CadSnackbar";

interface IStatsPageProps {
    items: any[];
    classes: any;
}

const PalmaresPage = (props: IStatsPageProps) => {
    const selectRef = useRef(null);
    const [licence, setLicence] = useState<Licence>(null)
    const [rows, setRows] = useState<Array<RaceRow>>(null);
    const [, setNotification] = useContext(NotificationContext);
    const onRiderChange = async (licence: Licence) => {
        setLicence(licence)
        const lraceRows: RaceRow[] = await apiRaces.getPalmares({id: licence.id});
        if (lraceRows.length===0)  setNotification({
            message: `Aucun palmarès disponible pour ce coureur`,
            type: 'error',
            open: true
        });
        setRows(_.orderBy(lraceRows, ['competitionDate'], ['desc']));
    };

    const getClassement = (rr:RaceRow) => {
        if (rr.rankingScratch!=null) {
            return rr.rankingScratch
        }
        else if (rr.comment !== null) {
            return rr.comment
        } else return 'NC'
    }
    const getIeme = (rr:RaceRow) => {
        if (rr.rankingScratch) {
            if (rr.rankingScratch > 1) return 'ème'
            else return 'er'
        }
        return ''
    }

    return (
        <div style={{flex: 1, padding: 10, zIndex: 20}}>
            <div style={{display: "flex", alignItems: 'center', verticalAlign: 'center', justifyContent: 'center'}}>
                <span style={{marginRight: 10}}>Coureur :</span>
                <AutocompleteInput selectBox={selectRef} style={{width: '550px'}} selection={licence}
                                   onChangeSelection={onRiderChange}
                                   placeholder="Nom Prénom Fede NuméroLicence"
                                   feedDataAndRenderer={filterLicences}/>
            </div>
            <div>
                {rows && rows.map((raceRow) =>
                    <VerticalTimeline className={"width500"} layout={"1-column"}>
                        <VerticalTimelineElement style={{width: 530, height: 120}}
                                                 className="vertical-timeline-element--education"
                                                 contentArrowStyle={{borderRight: '15px solid white'}}
                                                 date={moment(raceRow.competitionDate).locale('fr').format('dddd DD MMM YYYY')}
                                                 iconStyle={{background: 'rgb(33, 150, 243)', color: '#fff'}}
                                                 icon={<EmojiEventsIcon/>}
                        >
                            <h3 className="vertical-timeline-element-title">{raceRow.name}</h3>
                            <h5 className="vertical-timeline-element-subtitle">Course {raceRow.raceCode}</h5>
                            <p style={{margin: 0}}>
                                Classement scratch : <strong>{getClassement(raceRow)+getIeme(raceRow)}</strong>
                            </p>
                        </VerticalTimelineElement>
                    </VerticalTimeline>
                )
                }
            </div>
        </div>
    );

};

export default PalmaresPage;
