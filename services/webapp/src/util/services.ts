import {RaceRow} from '../sdk';

export const filterByRace = (rows : RaceRow[] , race : string) : RaceRow[] => {
    return rows.filter((coureur) => coureur.raceCode === race)
}
