import {Test} from '@nestjs/testing';
import {LicenceController} from './licence.controller';
import {getRepositoryToken} from '@nestjs/typeorm';
import {LicenceEntity} from '../entity/licence.entity';
import {Apiv2Module} from '../apiv2.module';
import {getManager, Repository} from 'typeorm';
import {AppModule} from '../app.module';
import {FederationEntity} from '../entity/federation.entity';

/**
 * Les tests unitaires des controlleurs
 */
describe('LicencesController', () => {
    let licencesCtrl: LicenceController;
    let licencesRepo: Repository<LicenceEntity>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            imports: [
                AppModule,
                Apiv2Module],
        }).compile();

        licencesRepo = module.get<Repository<LicenceEntity>>(getRepositoryToken(LicenceEntity));
        licencesCtrl = new LicenceController(licencesRepo, getManager());
    });

    describe('findAll', () => {
        it('renvoie toutes les licences', async () => {
            const result: LicenceEntity[] = [{
                id: 1,
                licenceNumber: '11111',
                name: 'nom',
                firstName: 'prenom',
                dept: '81',
                fede: FederationEntity.FSGT,
                gender: 'M',
                birthYear: '1900',
                catea: 'S',
                club: 'club',
                catev: '3',
            }];
            jest.spyOn(licencesRepo, 'find').mockImplementation(() => Promise.resolve(result));
            expect(await licencesCtrl.getAllLicences()).toBe(result);
        });
    });


});
