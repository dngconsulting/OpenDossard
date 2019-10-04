import React from 'react'

import AsyncSelect from 'react-select/async';
import {apiLicences} from '../util/api';
import {Licence} from "../sdk";


const filterLicences = async (inputValue: string) => {
    const licences: Licence[] = await apiLicences.getLicencesLike(inputValue.toUpperCase());
    const strings = licences.slice(0, 9).map((i: any) => {
        return {
            ...i,

            label:
                <div style={{lineHeight: "normal", position:"relative", width: '350px'}}>
                    <div style={{fontSize: "medium"}}>{i.name} {i.firstName} {i.licenceNumber && `${i.licenceNumber}`}</div>
                    <span style={{fontSize: "small"}}>{i.club}</span>
                    <div style={{position: "absolute", right:0, bottom:0}}>{i.catev} {i.catea} {i.fede}</div>
                </div>
        };
    });

    return strings;
};

const promiseOptions = async (inputValue: any) =>
    new Promise(resolve => {
        resolve(filterLicences(inputValue))
    })

export default function AutocompleteInput({selection, onChangeSelection, style}: any) {

    return (
        <div style={style}>
            <AsyncSelect
                value={selection}
                onChange={onChangeSelection}
                isClearable={true}
                defaultOptions={false}
                placeholder="Coureur (nom, numéro de licence...)"
                loadOptions={promiseOptions}
            />
        </div>
    );
}
