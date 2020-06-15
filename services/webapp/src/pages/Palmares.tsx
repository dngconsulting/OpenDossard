import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {VerticalTimeline, VerticalTimelineElement} from 'react-vertical-timeline-component';
import AutocompleteInput from "../components/AutocompleteInput";
import {filterLicences} from "./common/filters";
import {LicenceEntity as Licence} from "../sdk/models";
import 'react-vertical-timeline-component/style.min.css';
import EmojiEventsIcon from "@material-ui/icons/EmojiEvents";
import './palmares.css';

interface IStatsPageProps {
    items: any[];
    classes: any;
}

const PalmaresPage = (props: IStatsPageProps) => {
    const selectRef = useRef(null);
    const [licence, setLicence] = useState<Licence>(null)
    useEffect(() => {

        }
        , []);

    const onRiderChange = (licence: Licence) => {
        setLicence(licence)
    };

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
                {licence && <VerticalTimeline className={"width500"} layout={"1-column"}>
                  <VerticalTimelineElement style={{width: 500}}
                                           className="vertical-timeline-element--education"
                                           contentArrowStyle={{borderRight: '15px solid white'}}
                                           date="Dimanche 4 Juin 2019"
                                           iconStyle={{background: 'rgb(33, 150, 243)', color: '#fff'}}
                                           icon={<EmojiEventsIcon/>}
                  >
                    <h3 className="vertical-timeline-element-title">Course de Noueille</h3>
                    <h5 className="vertical-timeline-element-subtitle">Course 2/3</h5>
                    <p>
                      Classement scratch : 10ème
                    </p>
                  </VerticalTimelineElement>
                  <VerticalTimelineElement style={{width: 500}}
                                           className="vertical-timeline-element--education"
                                           contentArrowStyle={{borderRight: '15px solid white'}}
                                           date="Dimanche 19 Juin 2019"
                                           iconStyle={{background: 'rgb(33, 150, 243)', color: '#fff'}}
                                           icon={<EmojiEventsIcon/>}
                  >
                    <h3 className="vertical-timeline-element-title">Course de Roquettes</h3>
                    <h5 className="vertical-timeline-element-subtitle">Course 2/3</h5>
                    <p>
                      Classement scratch : 3ème
                    </p>
                  </VerticalTimelineElement>
                  <VerticalTimelineElement style={{width: 500}}
                                           className="vertical-timeline-element--education"
                                           contentArrowStyle={{borderRight: '15px solid white'}}
                                           date="Dimanche 26 Juin 2019"
                                           iconStyle={{background: 'rgb(33, 150, 243)', color: '#fff'}}
                                           icon={<EmojiEventsIcon/>}
                  >
                    <h3 className="vertical-timeline-element-title">Course de Candie</h3>
                    <h5 className="vertical-timeline-element-subtitle">Course 2/3</h5>
                    <p>
                      Classement scratch : 45ème
                    </p>
                  </VerticalTimelineElement>
                </VerticalTimeline>}
            </div>
        </div>
    );

};

export default PalmaresPage;
