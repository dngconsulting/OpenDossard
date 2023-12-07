import { CompetitionEntityCompetitionTypeEnum, FedeEnum, LicenceEntity as Licence } from '../../sdk';
import { apiLicences } from '../../util/api';
import * as React from 'react';
import _ from 'lodash';

export const filterLicences = async (
  inputValue: string,
  competitionType: CompetitionEntityCompetitionTypeEnum,
  preferredFede?: FedeEnum
) => {
  const licences: Licence[] = await apiLicences.getLicencesLike({
    param: inputValue.toUpperCase(),
    competitionType: competitionType
  });
  const hightlightNC = (field: string) => {
    if (field === '' || field === null || field == undefined) return <span style={{ color: 'red' }}>NC</span>;
    return field;
  };
  const strings = licences.map((licence: Licence) => {
    const textToDisplay = licence.name + ' ' + licence.firstName;
    const activeColor = licence.saison
      ? licence.saison && licence.saison.includes(new Date().getFullYear().toString())
        ? 'darkgreen'
        : 'red'
      : 'grey';
    const commentColor = _.isEmpty(licence.comment) ? 'transparent' : 'red';
    const isPreferredFede = preferredFede && licence.fede === preferredFede;
    return {
      ...licence,
      label: (
        <div style={{ lineHeight: 'normal', position: 'relative', width: '600px' }}>
          <div
            dangerouslySetInnerHTML={{
              __html: textToDisplay
                .toUpperCase()
                .replace(inputValue.toUpperCase(), '<b>' + inputValue.toUpperCase() + '</b>')
            }}
            style={{ fontSize: 'medium' }}
          ></div>
          <span style={{ fontSize: 'small' }}>{licence.club}</span>
          <div
            style={{
              position: 'absolute',
              right: 50,
              bottom: 0,
              ...(isPreferredFede ? { fontWeight: 'bolder' } : { fontWeight: 'normal' })
            }}
          >
            {hightlightNC(licence.catev)} {hightlightNC(licence.catea)} {hightlightNC(licence.fede)}
          </div>
          <div
            style={{
              position: 'absolute',
              right: 25,
              bottom: 5,
              backgroundColor: activeColor,
              clipPath: 'circle(50%)',
              width: '10px',
              height: '10px'
            }}
          ></div>
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 5,
              backgroundColor: commentColor,
              clipPath: 'circle(50%)',
              width: '10px',
              height: '10px'
            }}
          />
          <div style={{ fontSize: 'small' }}>
            {' '}
            Lic. N°: {hightlightNC(licence.licenceNumber)},Année : {hightlightNC(licence.birthYear)},Dept :{' '}
            {hightlightNC(licence.dept)},Genre : {hightlightNC(licence.gender)},Saison : {hightlightNC(licence.saison)}
          </div>
        </div>
      )
    };
  });

  return strings;
};
