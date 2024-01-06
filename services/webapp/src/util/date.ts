import moment from 'moment';

export const toMMDDYYYY = (thedate: Date): string => {
  console.log('the date ' + JSON.stringify(thedate));
  return moment(thedate).format('DD/MM/YYYY');
};

export const toTime = (thedate: Date): string => {
  return moment(thedate).format('hh:mm');
};
