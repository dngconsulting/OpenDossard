import {AppState} from '../state/AppState';
import {createSelector} from 'reselect';
import * as _ from 'lodash';
import moment from 'moment';

const randomColor = require('randomcolor');
const materialItemsSelector = (state: AppState) => state.materials.items;
const mailSelector = (state: AppState) => state.mail;

export const getMaterialChartItems = createSelector(materialItemsSelector, (items: any[]) => {
    const categories = _.groupBy(items, x => x.category);
    const data = _.keys(categories).map(category => ({ name: category, value: categories[category].length, fill: randomColor() }));

    return data;
});

export const getMailitems = createSelector(mailSelector, (mail: any) => {
    return _.sortBy(mail.items.map((item: any) =>
    _.assign({}, item, {createdAt: moment(item.createdAt)}), (i: any) => i.createdAt));
});

export const getEvents = () => {
    fetch('http://localhost:8080/api/calendars/2/events')
        .then(response => response.json())
        .then(data =>
           {console.log("DATA=" + JSON.stringify(data))})
        .catch(error => console.log(error));
}
