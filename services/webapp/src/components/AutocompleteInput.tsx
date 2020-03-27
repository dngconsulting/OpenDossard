import React from 'react'

import AsyncSelect from 'react-select/async';

/**
 *
 * @param selection
 * @param onChangeSelection
 * @param style permit to define style of autocompleteInput component
 * @param feedDataAndRenderer function that takes inputValues in params and need to return an array of object wich contain label property
 * @constructor
 */
export default function AutocompleteInput({selectBox,selection, onChangeSelection, style, placeholder, feedDataAndRenderer}: any) {

    const promiseOptions = async (inputValue: any) =>
        new Promise(resolve => {
            resolve(feedDataAndRenderer(inputValue))
        })

    return (
        <div style={style}>
            <AsyncSelect
                ref={selectBox}
                autoFocus={true}
                noOptionsMessage={()=>'Veuillez saisir un coureur'}
                loadingMessage={()=>'Chargement ...'}
                value={selection}
                onChange={onChangeSelection}
                isClearable={true}
                defaultOptions={false}
                placeholder={placeholder}
                loadOptions={promiseOptions}
            />
        </div>
    );
}
