import {Licence} from '../../sdk';
import {apiLicences} from '../../util/api';
import * as React from 'react';

export const filterLicences = async (inputValue: string) => {
    const licences: Licence[] = await apiLicences.getLicencesLike(inputValue.toUpperCase());
    const strings = licences.slice(0, 9).map((i: any) => {
        return {
            ...i,

            label:
                <div style={{lineHeight: "normal", position:"relative", width: '400px'}}>
                    <div style={{fontSize: "medium"}}>{i.name} {i.firstName} {i.licenceNumber && `${i.licenceNumber}`}</div>
                    <span style={{fontSize: "small"}}>{i.club}</span>
                    <div style={{position: "absolute", right:0, bottom:0}}>{i.catev} {i.catea} {i.fede}</div>
                </div>
        };
    });

    return strings;
};
