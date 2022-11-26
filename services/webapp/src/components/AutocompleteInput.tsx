import React from 'react';

import AsyncSelect from 'react-select/async';

/**
 *
 * @param selection
 * @param onChangeSelection
 * @param style permit to define style of autocompleteInput component
 * @param feedDataAndRenderer function that takes inputValues in params and need to return an array of object wich contain label property
 * @constructor
 */
export default function AutocompleteInput({
  selectBox,
  selection,
  onChangeSelection,
  style,
  placeholder,
  feedDataAndRenderer
}: any) {
  const promiseOptions = async (inputValue: any) => {
    return new Promise(resolve => {
      resolve(feedDataAndRenderer(inputValue));
    });
  };

  const SingleValue = ({
    cx,
    getStyles,
    selectProps,
    data,
    isDisabled,
    className,
    ...props
  }: any) => {
    return (
      <div>
        <div>{data.name + " " + data.firstName}</div>
      </div>
    );
  };

  const customStyles = {
    control: (base: any) => ({
      ...base,
      height: 60,
      minHeight: 35,
      lineHeight: 3,
      padding: 0
    }),
    input: (base: any) => ({
      fontSize: 20
    })
  };
  return (
    <div style={style}>
      <AsyncSelect
        ref={selectBox}
        autoFocus={true}
        styles={customStyles}
        noOptionsMessage={() =>
          "Aucun coureur ne correspond à votre recherche "
        }
        loadingMessage={() => "Chargement ..."}
        value={selection}
        //components={{ SingleValue }}
        onChange={onChangeSelection}
        isClearable={true}
        defaultOptions={false}
        placeholder={placeholder}
        loadOptions={promiseOptions}
      />
    </div>
  );
}
