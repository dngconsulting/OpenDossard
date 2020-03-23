// TODO: all those entities can be shared between front & back
export const CATEV = [
    {label: 'Cadet', value: 'C'},
    {label: 'Minimes', value: 'M'},
    {label: 'Féminine', value: 'F'},
    {label: '1', value: '1'},
    {label: '2', value: '2'},
    {label: '3', value: '3'}];

export const CATEA : Array<{label:string,value:string}> = [
    {label: 'Jeune', value: 'J'},
    {label: 'Féminine minime', value: 'FM'},
    {label: 'Féminine vétéran', value: 'FV'},
    {label: 'Féminine sénior', value: 'FS'},
    {label: 'Féminine jeune', value: 'FJ'},
    {label: 'Féminine cadet', value: 'FC'},
    {label: 'Féminine super vétéran', value: 'FSV'},
    {label: 'Féminine espoir', value: 'FE'},
    {label: 'Sénior', value: 'S'},
    {label: 'Vétéran', value: 'V'},
    {label: 'Super Vétéran', value: 'SV'},
    {label: 'Ancien', value: 'A'},
    {label: 'Cadet', value: 'C'},
    {label: 'Minimes', value: 'M'},
    {label: 'Espoir', value: 'E'},
    {label: 'NC', value: 'NC'}];

export const FEDERATIONS = {
    FSGT: {
        name: {label: 'FSGT', value: 'FSGT'},
        catev: [...CATEV, {label: '4', value: '4'}, {label: '5', value: '5'}],
        catea:CATEA
    },
    UFOLEP: {
        name: {label: 'UFOLEP', value: 'UFOLEP'},
        catev: [ {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'}, {label: 'GSa', value: 'GSA'},{label: 'GSb', value: 'GSB'},{label: 'Jeune', value: 'JEUNE'},{label: 'Féminine', value: 'FEM'}],
        catea:[...CATEA,{label:'FNC', value:'FNC'},{label:'FFS', value:'FFS'}]
    },
    FFC: {
        name: {label: 'FFC', value: 'FFC'},
        catev : [...CATEV],
        catea:CATEA
    },
    NL:{
        name:{label: 'Non Licencié', value: 'NL'},
        catev: [...CATEV, {label: '4', value: '4'}, {label: '5', value: '5'}],
        catea:CATEA
    }
};
