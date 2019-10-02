import React, {useState} from 'react'

import AsyncSelect from 'react-select/async';
import {apiLicences} from "../util/api";


const filterLicences = async (inputValue: string) => {
    const licences = await apiLicences.getLicencesLike(inputValue.toUpperCase());
    const strings = licences.slice(0, 9).map(i => {
        return {
            ...i,

            label: <table>
                    <tbody>
                        <tr>
                            <td>{i.name}</td>
                            <td>{i.firstName}</td>
                            <td>{i.licenceNumber ? i.licenceNumber : 'NR'}</td>
                            <td>{i.club}</td>
                            <td>{i.fede}</td>
                            <td>{i.catea}</td>
                            <td>{i.catev}</td>
                        </tr>
                    </tbody>
                   </table>
        };
    });

    console.log(strings);

    return strings;
};

const promiseOptions = async (inputValue: any) =>
    new Promise(resolve => {
        resolve(filterLicences(inputValue))
    })

export default function AutocompleteInput() {

    const [selection, setSelection] = useState(null);

    return (
        <div>
            <p> Coureur sélectionné : {selection ? selection.name : ''}
            </p>
            <AsyncSelect
                value={selection}
                onChange={(i:any) => setSelection(i)}
                isClearable={true}
                defaultOptions={false}
                loadOptions={promiseOptions}
            />
        </div>
    );
}
