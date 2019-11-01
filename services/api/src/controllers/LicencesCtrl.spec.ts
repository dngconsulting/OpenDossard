import {Test} from '@nestjs/testing';
import {LicencesCtrl} from './LicencesCtrl';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Licence} from '../entity/Licence';

/**
 * Ceci est un exemple de test unitaire avec NestJS, la couverture est minimaliste
 */
describe('LicencesController', () => {
    let licencesCtrl: LicencesCtrl;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [TypeOrmModule.forRoot(), TypeOrmModule.forFeature([Licence])],
            controllers: [LicencesCtrl],
        }).compile();

        licencesCtrl = module.get<LicencesCtrl>(LicencesCtrl);
    });

    describe('findAllLicence', () => {
        it('should return an array of licences', async () => {
            const licences: Licence[] = [];
            const createLicence = (id, firstName, catea, catev, name, gender, club, dept, fede) => {
                const licence = new Licence();
                licence.id = id;
                licence.name = name;
                licence.gender = name;
                licence.catea = catea;
                licence.catev = catev;
                licence.fede = fede;
                return licence;
            }
            licences.push(createLicence(1, 'sami', 'jaber', 'V', '4', 'H', 'My Great Club', '31', 'FSGT'));
            licences.push(createLicence(1, 'test', 'user', 'V', '4', 'H', 'Test club', '31', 'FSGT'));

            const findAllResult = await licencesCtrl.getAllLicences();
            expect(findAllResult).toBe(licences);
        });
    });
});
