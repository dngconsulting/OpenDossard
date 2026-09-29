import { rankRiders, withoutRank } from './challenge-ranking.utils';
import { fromArchiveEntities, toArchiveEntities } from './challenge-archive.mapper';
import { ChallengeRiderDto } from './dto/challenge-ranking.dto';

/** Normalise comme le fait la sérialisation HTTP (undefined supprimé, Date → ISO). */
const asJson = (v: unknown): unknown => JSON.parse(JSON.stringify(v));

const live: ChallengeRiderDto[] = [
  {
    licenceId: 42 as unknown as string, // à l'exécution, le live renvoie un nombre (colonne int)
    name: 'DUPONT',
    firstName: 'Jean',
    gender: 'H',
    currentLicenceCatev: '2',
    currentLicenceCatea: 'S',
    currentClub: 'VC Toulouse',
    sprintchallenge: null as unknown as boolean,
    ptsAllRaces: 12.5,
    explanation: 'Assiduité de 1.2, total pts 12 => 15.0/1.2',
    challengeRaceRows: [
      {
        licenceId: 42 as unknown as string,
        competitionId: 7,
        competitionName: 'GP Test',
        eventDate: new Date('2025-06-01T09:00:00Z'),
        catev: '2',
        rankingScratch: 3,
        nbParticipants: 18,
        comment: null as unknown as string,
        sprintchallenge: true,
        ptsRace: 15,
        explanation: 'nb part. épreuve => 18',
      },
      {
        licenceId: 42 as unknown as string,
        competitionId: 8,
        competitionName: 'GP Test 2',
        eventDate: new Date('2025-06-08T09:00:00Z'),
        catev: '2',
        rankingScratch: null as unknown as number,
        nbParticipants: 12,
        comment: 'DNF',
        sprintchallenge: false,
        ptsRace: 0,
      },
    ],
  },
  {
    licenceId: 43 as unknown as string,
    name: 'MARTIN',
    firstName: 'Paul',
    gender: 'H',
    currentLicenceCatev: '2',
    currentLicenceCatea: 'S',
    currentClub: 'VC Auch',
    sprintchallenge: false,
    ptsAllRaces: 0,
    challengeRaceRows: [],
  },
];

describe('challenge-archive.mapper', () => {
  it('aller-retour live → archive → DTO identique', () => {
    const ranked = rankRiders(live);
    const entities = toArchiveEntities(99, ranked);
    expect(asJson(fromArchiveEntities(entities))).toEqual(asJson(withoutRank(ranked)));
  });

  it('écrit le rang, la catégorie de clôture et le challenge', () => {
    const [first] = toArchiveEntities(99, rankRiders(live));
    expect(first).toMatchObject({ challengeId: 99, licenceId: 42, catev: '2', rank: 1 });
    expect(first.raceRows).toHaveLength(2);
    expect(first.raceRows[1]).toMatchObject({ rankingScratch: null, comment: 'DNF' });
  });

  it('n’expose pas le rang dans le DTO relu', () => {
    const out = fromArchiveEntities(toArchiveEntities(99, rankRiders(live)));
    expect(out[0]).not.toHaveProperty('rank');
  });
});
