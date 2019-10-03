import moment from 'moment';

export const toMMDDYYYY = (thedate: Date): string => {
    return moment(thedate).format('DD/MM/YYYY h:mm:ss');
};

