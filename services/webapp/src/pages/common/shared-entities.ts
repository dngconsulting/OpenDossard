// TODO: all those entities can be shared between front & back
export const CATEV = [
    {label: 'Non Licencié', value: 'NL'},
    {label: 'Cadet', value: 'C'},
    {label: 'Minimes', value: 'M'},
    {label: 'Féminine', value: 'F'},
    {label: '1', value: '1'},
    {label: '2', value: '2'},
    {label: '3', value: '3'}];

export const CATEA : Array<{label:string,value:string}> = [
    {label: 'Jeune', value: 'j'},
    {label: 'Espoir', value: 'e'},
    {label: 'Féminine minime', value: 'fm'},
    {label: 'Féminine vétéran', value: 'fv'},
    {label: 'Féminine sénior', value: 'fs'},
    {label: 'Féminine jeune', value: 'fj'},
    {label: 'Féminine cadet', value: 'fc'},
    {label: 'Féminine super vétéran', value: 'fsv'},
    {label: 'Féminine espoir', value: 'fe'},
    {label: 'Sénior', value: 's'},
    {label: 'Vétéran', value: 'v'},
    {label: 'Super Vétéran', value: 'sv'},
    {label: 'Ancien', value: 'a'},
    {label: 'Cadet', value: 'c'},
    {label: 'Minimes', value: 'm'},
    {label: 'Espoir', value: 'e'},
    {label: 'NC', value: 'nc'}];

export const FEDERATIONS = {
    FSGT: {
        name: {label: 'FSGT', value: 'FSGT'},
        catev: [...CATEV, {label: '4', value: '4'}, {label: '5', value: '5'}]
    },
    UFOLEP: {
        name: {label: 'UFOLEP', value: 'UFOLEP'},
        catev: [...CATEV, {label: 'GSa', value: 'GSA'},{label: 'GSb', value: 'GSB'},{label: 'Jeune', value: 'J'}]
    },
    FFC: {
        name: {label: 'FFC', value: 'FFC'},
        catev : [...CATEV]
    },
    NL:{
        name:{label: 'Non Licencié', value: 'NL'},
        catev: [...CATEV, {label: '4', value: '4'}, {label: '5', value: '5'}]
    }
};
