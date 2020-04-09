// TODO: all those entities can be shared between front & back
export const CATEV = [
    {label: 'Cadet', value: 'C'},
    {label: 'Minimes', value: 'M'},
    {label: 'Féminine', value: 'F'},
    {label: '1', value: '1'},
    {label: '2', value: '2'},
    {label: '3', value: '3'}];

export const CATEA_FSGT : Array<{label:string,value:string,gender:string}> = [
    {label: 'Ancien', value: 'A', gender:'H'},
    {label: 'Super Vétéran', value: 'SV',gender:'H'},
    {label: 'Vétéran', value: 'V',gender:'H'},
    {label: 'Sénior', value: 'S',gender:'H'},
    {label: 'Junior', value: 'J',gender:'H'},
    {label: 'Espoir', value: 'E',gender:'H'},
    {label: 'Cadet', value: 'C',gender:'H'},
    {label: 'Minime', value: 'M',gender:'H'},
    {label: 'Benjamin', value: 'B',gender:'H'},
    {label: 'Pupille', value: 'PU',gender:'H'},
    {label: 'Poussin', value: 'PO',gender:'H'},
    {label: 'Moustic', value: 'MO',gender:'H'},
    {label: 'NC', value: 'NC',gender:'H'},
    {label: 'Féminine ancien', value: 'FA',gender:'F'},
    {label: 'Féminine super vétéran', value: 'FSV',gender:'F'},
    {label: 'Féminine vétéran', value: 'FV',gender:'F'},
    {label: 'Féminine sénior', value: 'FS',gender:'F'},
    {label: 'Féminine junior', value: 'FJ',gender:'F'},
    {label: 'Féminine espoir', value: 'FE',gender:'F'},
    {label: 'Féminine cadet', value: 'FC',gender:'F'},
    {label: 'Féminine minime', value: 'FM',gender:'F'},
    {label: 'Féminine benjamin', value: 'FB',gender:'F'},
    {label: 'Féminine pupille', value: 'FPU',gender:'F'},
    {label: 'Féminine poussin', value: 'FPO',gender:'F'},
    {label: 'Féminine moustic', value: 'FMO',gender:'F'},
    {label: 'NC', value: 'NC',gender:'F'}];

export const CATEA_UFOLEP : Array<{label:string,value:string,gender:string}> = [

    {label: 'Féminine ancien', value: 'FA',gender:'F'},
    {label: 'Féminine super vétéran', value: 'FSV',gender:'F'},
    {label: 'Féminine vétéran', value: 'FV',gender:'F'},
    {label: 'Féminine sénior', value: 'FS',gender:'F'},
    {label: 'Féminine espoir', value: 'FE',gender:'F'},
    {label: 'Féminine jeune', value: 'FJ',gender:'F'},
    {label: 'Féminine cadet', value: 'FC',gender:'F'},
    {label: 'Féminine minime', value: 'FM',gender:'F'},

    {label: 'Ancien', value: 'A',gender:'H'},
    {label: 'Sénior', value: 'S',gender:'H'},
    {label: 'Vétéran', value: 'V',gender:'H'},
    {label: 'Super Vétéran', value: 'SV',gender:'H'},
    {label: 'Ancien', value: 'A',gender:'H'},
    {label: 'Cadet', value: 'C',gender:'H'},
    {label: 'Minimes', value: 'M',gender:'H'},
    {label: 'Espoir', value: 'E',gender:'H'},
    {label: 'Jeune', value: 'J',gender:'H'},

    {label: 'NC', value: 'NC',gender:'F'},
    {label: 'NC', value: 'NC',gender:'H'}
    ];

export const FEDERATIONS = {
    FSGT: {
        name: {label: 'FSGT', value: 'FSGT'},
        catev: [...CATEV, {label: '4', value: '4'}, {label: '5', value: '5'}],
        catea:CATEA_FSGT
    },
    UFOLEP: {
        name: {label: 'UFOLEP', value: 'UFOLEP'},
        catev: [ {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'}, {label: 'GSa', value: 'GSA'},{label: 'GSb', value: 'GSB'},{label: 'Jeune', value: 'JEUNE'},{label: 'Féminine', value: 'FEM'}],
        catea:[...CATEA_UFOLEP,{label:'FNC', value:'FNC'},{label:'FFS', value:'FFS'}]
    },
    FFC: {
        name: {label: 'FFC', value: 'FFC'},
        catev : [...CATEV],
        catea:CATEA_FSGT
    },
    NL:{
        name:{label: 'Non Licencié', value: 'NL'},
        catev: [...CATEV, {label: '4', value: '4'}, {label: '5', value: '5'}],
        catea:CATEA_FSGT
    }
};
