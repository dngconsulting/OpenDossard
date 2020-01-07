import {Test} from '@nestjs/testing';
import {LicenceController} from '../src/controllers/licence.controller';
import {getRepositoryToken} from '@nestjs/typeorm';
import {LicenceEntity} from '../src/entity/licence.entity';
import {Apiv2Module} from '../src/apiv2.module';
import {EntityManager, getManager, Repository} from 'typeorm';
import {AppModule} from '../src/app.module';
import {ClubController} from '../src/controllers/club.controller';
import {ClubEntity} from '../src/entity/club.entity';
import {CompetitionFilter} from "../src/dto/model.dto";
import {CompetitionController} from "../src/controllers/competition.controller";
import {CompetitionEntity} from "../src/entity/competition.entity";

/**
 * It is also possible to use directly HTTP to test status code, body messages, ...
 * But we prefer to stick to E2E controller only
 *
 */
describe('E2E_Licences', () => {
    let licencesCtrl: LicenceController;
    let competitionsCtrl: CompetitionController;
    let clubCtrl: ClubController;
    let clubRepo: Repository<ClubEntity>;
    let competRepo: Repository<CompetitionEntity>;
    let licencesRepo: Repository<LicenceEntity>;
    let entityManager: EntityManager;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [
                AppModule,
                Apiv2Module],
        }).compile();

        // Entity manager init, its just a sample, the entity manager could not be shared between multiple tests
        entityManager = getManager();

        // repositories init
        //licencesRepo = module.get<Repository<LicenceEntity>>(getRepositoryToken(LicenceEntity));
        competRepo = module.get<Repository<CompetitionEntity>>(getRepositoryToken(CompetitionEntity));
        //clubRepo = module.get<Repository<ClubEntity>>(getRepositoryToken(ClubEntity));

        // controllers init
        //clubCtrl = new ClubController(clubRepo, entityManager);
        competitionsCtrl = new CompetitionController(competRepo, entityManager);
        //licencesCtrl = new LicenceController(licencesRepo, entityManager);
    });
    /**
     * Utility function used by unit tests
     * @param firstName
     * @param name
     * @param catea
     * @param catev
     * @param gender
     * @param club
     * @param dept
     * @param fede
     */
    const createLicence = (firstName, name, catea, catev, gender, club, dept, fede): LicenceEntity => {
        const licence = new LicenceEntity();
        licence.firstName = firstName;
        licence.name = name;
        licence.gender = gender;
        licence.catea = catea;
        licence.catev = catev;
        licence.fede = fede;
        licence.club = club;
        licence.dept = dept;
        return licence;
    };

    /**
     * E2E Tests, we test here the end point controllers by hitting the DB
     */

    /*describe('createLicence', () => {
        it('create a licence and check it is inserted', async () => {
            const inseredLicence: LicenceEntity = createLicence('roger', 'dupont', 'V', '4', 'H', 'My Great Club', '31', 'FSGT');
            await licencesCtrl.create(inseredLicence);
            const allLicences = await licencesCtrl.getAllLicences();
            // @ts-ignore
            expect(allLicences[allLicences.length - 1].name).toBe('dupont');
        });
    });*/

    describe('findByFilter', () => {
        it('competitions', async () => {
            let result=null;
            /*const competitionFilterWithCompetitionTypes : CompetitionFilter = {
                competitionTypes: new Set<string>(['CX']),
                fedes: new Set<string>(['UFOLEP','FSGT']),
                depts: ['31','24'],
                openedFilter:true,
                openedToOtherFede: true,
                openedNL: true,
                displayFuture: true,
                displayPast: true,
                displaySince: 24,
            }
             result = await competitionsCtrl.getCompetitionsByFilter(competitionFilterWithCompetitionTypes);
            if (result) result.forEach((compet,index)=>expect(compet.competitionType).toBe('CX'))
            const competitionFilterWithFedes : CompetitionFilter = {
                fedes: new Set<string>(['FSGT','UFOLEP']),
                displayFuture: true,
                displayPast: true,
            }
            result = await competitionsCtrl.getCompetitionsByFilter(competitionFilterWithFedes);
            if (result) result.forEach((compet,index)=>expect(['FSGT','UFOLEP']).toContain(compet.fede))*/
            const competitionFilterWithBooleansAndDates : CompetitionFilter = {
                displayFuture: false,
                displayPast: false,
                displaySince:150
            }
            result = await competitionsCtrl.getCompetitionsByFilter(competitionFilterWithBooleansAndDates);
            if (result) result.forEach((compet,index)=>console.log('name ' + compet.name + ' ' + compet.eventDate))

        });
    });

});
