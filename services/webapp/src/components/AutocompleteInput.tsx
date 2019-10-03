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
                <div>
                    <p style={{lineHeight: "normal"}}>
                        <span style={{fontSize: "medium"}}>{i.name} {i.firstName}<br/></span>
                        <span style={{fontSize: "small"}}>{i.licenceNumber ? i.licenceNumber : 'NR'}<br/></span>
                        <span style={{fontSize: "small"}}>{i.club} {i.fede}<br/></span>
                        <span style={{fontSize: "medium"}}>{i.catev} {i.catea}<br/></span>
                    </p>
                </div>
        };
    });

    return strings;
};

const promiseOptions = async (inputValue: any) =>
    new Promise(resolve => {
        resolve(filterLicences(inputValue))
    })

export default function AutocompleteInput({selection, onChangeSelection}: any) {

    return (
        <div>
            <AsyncSelect
                value={selection}
                onChange={onChangeSelection}
                isClearable={true}
                defaultOptions={false}
                loadOptions={promiseOptions}
            />
        </div>
    );
}
