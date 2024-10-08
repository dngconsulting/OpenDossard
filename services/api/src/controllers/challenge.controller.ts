import { EntityManager, Repository } from "typeorm";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ChallengeDTO } from "../dto/model.dto";
import { RolesGuard } from "../guards/roles.guard";
import { ChallengeEntity } from "../entity/challenge.entity";

@Controller("/api/challenge")
@ApiTags("ChallengeAPI")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class ChallengeController {
  constructor(
    @InjectRepository(ChallengeEntity)
    private readonly repository: Repository<ChallengeEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager
  ) {}

  @ApiOperation({
    operationId: "getAllChallenges",
    summary: "Rechercher tous les challenges",
    description: "Renvoie la liste de tous les challenges"
  })
  @ApiResponse({
    status: 200,
    type: ChallengeDTO,
    isArray: true,
    description: "Liste des challenges"
  })
  @Get("/all")
  public async getAllChallenges(): Promise<ChallengeDTO[]> {
    return this.repository.find();
  }

  @ApiOperation({
    operationId: "getChallengeById",
    summary: "Rechercher un challenge par son id",
    description: "Renvoie un challenge par son id"
  })
  @ApiResponse({
    status: 200,
    type: ChallengeDTO,
    description: "le challenge correspondant à l'id"
  })
  @Get(":id")
  public async getChallengeById(
    @Param("id") id: number
  ): Promise<ChallengeDTO> {
    return this.repository.findOne({ where: { id } });
  }
}
