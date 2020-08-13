import {FedeEnum, LicenceEntity as Licence} from '../../sdk';
import {apiLicences} from '../../util/api';
import * as React from 'react';
export const filterLicences = async (inputValue: string,preferredFede?:FedeEnum) => {
    const licences: Licence[] = await apiLicences.getLicencesLike({param:inputValue.toUpperCase()});
    const strings = licences.map((licence: Licence) => {
        const textToDisplay = licence.name + ' ' + licence.firstName + ' ' +  (licence.licenceNumber?licence.licenceNumber:'' + licence.saison)
        const activeColor = licence.saison?((licence.saison && licence.saison.includes(new Date().getFullYear().toString()))?'darkgreen':'red'):'grey';
        const isPreferredFede = preferredFede && licence.fede===preferredFede;
        return {
            ...licence,
            label:
                <div style={{lineHeight: "normal", position:"relative", width: '450px'}}>
                    <div
                         dangerouslySetInnerHTML={{__html: textToDisplay.toUpperCase().replace(inputValue.toUpperCase(),"<b>"+inputValue.toUpperCase()+"</b>")}}
                         style={{fontSize: "medium"}}></div>
                    <span style={{fontSize: "small"}}>{licence.club}</span>
                    <div style={{position: "absolute", right:0, bottom:0,...(isPreferredFede?{fontWeight:"bolder"}:{fontWeight:"normal"})}}>
                        {licence.catev} {licence.catea} {licence.fede}</div><div style={{position: "absolute", right:-20, bottom:5,backgroundColor:activeColor,clipPath: 'circle(50%)',width:'10px',height:'10px'}}></div>
                </div>
        };
    });

    return strings;
};
