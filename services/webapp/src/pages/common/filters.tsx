import {FedeEnum, LicenceEntity as Licence,CompetitionEntityCompetitionTypeEnum} from '../../sdk';
import {apiLicences} from '../../util/api';
import * as React from 'react';
export const filterLicences = async (inputValue: string,competitionType :CompetitionEntityCompetitionTypeEnum, preferredFede?:FedeEnum) => {
    const licences: Licence[] = await apiLicences.getLicencesLike({param:inputValue.toUpperCase(),competitionType:competitionType});
    const hightlightNC = (field:string) => {
        if (field === '' || field === null || field == undefined ) return <span style={{color:'red'}}>NC</span>
        return field;
    }
    const strings = licences.map((licence: Licence) => {
        const textToDisplay = licence.name + ' ' + licence.firstName ;
        const activeColor = licence.saison?((licence.saison && licence.saison.includes(new Date().getFullYear().toString()))?'darkgreen':'red'):'grey';
        const isPreferredFede = preferredFede && licence.fede===preferredFede;
        return {
            ...licence,
            label:
                <div style={{lineHeight: "normal", position:"relative", width: '470px'}}>
                   <div
                         dangerouslySetInnerHTML={{__html: textToDisplay.toUpperCase().replace(inputValue.toUpperCase(),"<b>"+inputValue.toUpperCase()+"</b>")}}
                         style={{fontSize: "medium"}}></div>
                    <span style={{fontSize: "small"}}>{licence.club}</span>
                    <div style={{position: "absolute", right:20, bottom:0,...(isPreferredFede?{fontWeight:"bolder"}:{fontWeight:"normal"})}}>
                        {licence.catev} {licence.catea} {licence.fede}
                    </div>
                    <div style={{position: "absolute", right:5, bottom:5,backgroundColor:activeColor,clipPath: 'circle(50%)',width:'10px',height:'10px'}}></div>
                    <div style={{fontSize: "small"}}> Lic. N°: {hightlightNC(licence.licenceNumber)} Année : {hightlightNC(licence.birthYear)} Dept : {hightlightNC(licence.dept)} Genre : {hightlightNC(licence.gender)}</div>
                </div>
        };
    });

    return strings;
};
