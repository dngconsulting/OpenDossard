import {LicenceEntity as Licence} from '../../sdk';
import {apiLicences} from '../../util/api';
import * as React from 'react';

export const filterLicences = async (inputValue: string) => {
    const licences: Licence[] = await apiLicences.getLicencesLike({param:inputValue.toUpperCase()});
    const strings = licences.map((i: Licence) => {
        const textToDisplay = i.name + ' ' + i.firstName + ' ' +  (i.licenceNumber?i.licenceNumber:'')
        return {
            ...i,
            label:
                <div style={{lineHeight: "normal", position:"relative", width: '450px'}}>
                    <div dangerouslySetInnerHTML={{__html: textToDisplay.toUpperCase().replace(inputValue.toUpperCase(),"<b>"+inputValue.toUpperCase()+"</b>")}} style={{fontSize: "medium"}}></div>
                    <span style={{fontSize: "small"}}>{i.club}</span>
                    <div style={{position: "absolute", right:0, bottom:0}}>{i.catev} {i.catea} {i.fede}</div>
                </div>
        };
    });

    return strings;
};
