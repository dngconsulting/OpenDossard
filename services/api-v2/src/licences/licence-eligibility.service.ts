import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Federation } from '../common/enums';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceSearchResultDto } from './dto';
import { LicenceEntity } from './entities/licence.entity';
import { getLicenceEligibility } from './licence-eligibility';
import { sameRiderCondition } from './same-rider.sql';

@Injectable()
export class LicenceEligibilityService {
  constructor(
    @InjectRepository(LicenceEntity)
    private readonly licenceRepository: Repository<LicenceEntity>,
    @InjectRepository(CompetitionEntity)
    private readonly competitionRepository: Repository<CompetitionEntity>,
  ) {}

  /**
   * Ajoute `eligibility` à chaque licence pour l'épreuve donnée. Aucune licence
   * n'est retirée : l'app grise celles qui sont refusées.
   */
  async annotate(
    licences: LicenceEntity[],
    competitionId: number,
  ): Promise<LicenceSearchResultDto[]> {
    const competition = await this.competitionRepository.findOne({
      where: { id: competitionId },
      select: ['id', 'fede', 'openedToOtherFede', 'openedNL'],
    });
    if (!competition) {
      throw new NotFoundException(`Compétition #${competitionId} introuvable`);
    }

    // La recherche « même coureur » ne sert qu'aux licences d'une autre fédé
    // sur une épreuve ouverte : on l'évite dans tous les autres cas.
    const otherFedeIds = competition.openedToOtherFede
      ? licences.filter(l => l.fede !== competition.fede && l.fede !== Federation.NL).map(l => l.id)
      : [];
    const withOrganizerFede = await this.findIdsWithLicenceInFede(otherFedeIds, competition.fede);

    return licences.map(licence => ({
      ...licence,
      eligibility: getLicenceEligibility(licence, competition, withOrganizerFede.has(licence.id)),
    }));
  }

  /**
   * Parmi `ids`, les licences dont le coureur possède aussi une licence dans `fede`.
   */
  private async findIdsWithLicenceInFede(ids: number[], fede: Federation): Promise<Set<number>> {
    if (ids.length === 0) {
      return new Set();
    }
    const rows: { id: number }[] = await this.licenceRepository.query(
      `SELECT l.id FROM licence l
        WHERE l.id = ANY($1)
          AND EXISTS (
            SELECT 1 FROM licence o
             WHERE o.fede::text = $2
               AND o.id <> l.id
               AND ${sameRiderCondition('l', 'o')}
          )`,
      [ids, fede],
    );
    return new Set(rows.map(r => r.id));
  }
}
