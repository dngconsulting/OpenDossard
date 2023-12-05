import moment from 'moment';

export const toMMDDYYYY = (thedate: Date): string => {
  return moment(thedate).format('DD/MM/YYYY');
};

export const toTime = (thedate: Date): string => {
  return moment(thedate).format('hh:mm');
};
