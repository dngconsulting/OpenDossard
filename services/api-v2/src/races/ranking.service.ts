import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RaceEntity } from './entities/race.entity';
import { UpdateRankingDto, RemoveRankingDto, ReorderRankingItemDto } from './dto';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    @InjectRepository(RaceEntity)
    private readonly raceRepository: Repository<RaceEntity>,
  ) {}

  /**
   * Met à jour le classement d'un coureur
   */
  async updateRanking(dto: UpdateRankingDto, author?: string): Promise<RaceEntity> {
    const stampAuthor = author ? `${author}/Ranking` : undefined;
    // Trouver le coureur à classer
    const rider = await this.raceRepository.findOne({
      where: {
        riderNumber: dto.riderNumber,
        raceCode: dto.raceCode,
        competitionId: dto.competitionId,
      },
    });

    if (!rider) {
      throw new BadRequestException("Impossible de classer ce coureur, il n'existe pas");
    }

    // Vérifier qu'il n'est pas déjà classé
    if (rider.rankingScratch || rider.comment) {
      throw new BadRequestException(
        `Impossible de classer le coureur au dossard ${rider.riderNumber}, il existe déjà dans le classement`,
      );
    }

    // Si on attribue un classement, vérifier si quelqu'un l'a déjà
    if (dto.rankingScratch) {
      const existingRanked = await this.raceRepository.findOne({
        where: {
          rankingScratch: dto.rankingScratch,
          raceCode: dto.raceCode,
          competitionId: dto.competitionId,
        },
      });

      // Si un coureur a déjà ce classement, on le retire
      if (existingRanked && existingRanked.id !== rider.id) {
        this.logger.debug(
          `Removing rank ${dto.rankingScratch} from rider ${existingRanked.riderNumber}`,
        );
        existingRanked.rankingScratch = null;
        existingRanked.comment = null;
        this.stampAudit(existingRanked, stampAuthor);
        await this.raceRepository.save(existingRanked);
      }
    }

    // Mettre à jour le classement
    rider.rankingScratch = dto.rankingScratch || null;
    rider.comment = dto.comment || null;
    this.stampAudit(rider, stampAuthor);

    return this.raceRepository.save(rider);
  }

  /**
   * Retire un coureur du classement et réordonne les autres
   */
  async removeRanking(dto: RemoveRankingDto, author?: string): Promise<void> {
    const stampAuthor = author ? `${author}/Ranking` : undefined;
    const race = await this.raceRepository.findOne({
      where: { id: dto.id },
    });

    if (!race) {
      return;
    }

    // Retirer le classement ou le commentaire
    if (race.comment) {
      race.comment = null;
    } else {
      race.rankingScratch = null;
    }
    race.chrono = null;
    race.sprintchallenge = false;
    this.stampAudit(race, stampAuthor);

    await this.raceRepository.save(race);

    // Réordonner les classements de cette course pour combler les trous
    await this.reorderRankingsForRace(dto.competitionId, dto.raceCode, stampAuthor);
  }

  /**
   * Réordonne les classements pour une course donnée
   */
  async reorderRankingsForRace(
    competitionId: number,
    raceCode: string,
    stampAuthor?: string,
  ): Promise<void> {
    const races = await this.raceRepository.find({
      where: { competitionId, raceCode },
      order: { rankingScratch: 'ASC' },
    });

    const rankedRaces = races.filter(r => r.rankingScratch && !r.comment);

    const toSave: RaceEntity[] = [];
    let newRank = 1;
    for (const race of rankedRaces) {
      if (race.rankingScratch !== newRank) {
        race.rankingScratch = newRank;
        this.stampAudit(race, stampAuthor);
        toSave.push(race);
      }
      newRank++;
    }

    if (toSave.length > 0) {
      await this.raceRepository.save(toSave);
    }
  }

  /**
   * Réordonne manuellement une liste de classements
   */
  async reorderRankings(items: ReorderRankingItemDto[], author?: string): Promise<void> {
    const stampAuthor = author ? `${author}/Ranking` : undefined;
    // Filtrer les items avec un ID et sans commentaire (pas ABD/DSQ)
    const validItems = items.filter(item => item.id && !item.comment);

    if (validItems.length === 0) return;

    // Fetch all races in one query
    const ids = validItems.map(item => item.id);
    const races = await this.raceRepository.find({
      where: { id: In(ids) },
    });

    // Build a Map for O(1) lookup
    const raceMap = new Map<number, RaceEntity>();
    for (const race of races) {
      raceMap.set(race.id, race);
    }

    // Apply changes in memory
    const toSave: RaceEntity[] = [];
    for (let index = 0; index < validItems.length; index++) {
      const item = validItems[index];
      const newRank = index + 1;
      const race = raceMap.get(item.id);

      if (race && race.rankingScratch !== newRank && !race.comment) {
        race.rankingScratch = newRank;
        this.stampAudit(race, stampAuthor);
        this.logger.debug(`Update ranking of rider ${race.riderNumber} to rank ${newRank}`);
        toSave.push(race);
      }
    }

    // Batch save
    if (toSave.length > 0) {
      await this.raceRepository.save(toSave);
    }
  }

  /**
   * Écrase systématiquement `author` et `lastChanged` avant `.save()`. Ne fait
   * AUCUNE confiance aux valeurs entrantes : le body n'est jamais autoritatif
   * sur ces deux champs — la source de vérité est le JWT (ou `null` pour les
   * contextes sans utilisateur identifié).
   */
  private stampAudit<T extends { author?: string | null; lastChanged?: Date | null }>(
    entity: T,
    author: string | undefined,
  ): T {
    entity.author = author ?? null;
    entity.lastChanged = new Date();
    return entity;
  }
}
