import { Module, Scope } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LicenceEntity } from "./entity/licence.entity";
import { CompetitionEntity } from "./entity/competition.entity";
import { ClubEntity } from "./entity/club.entity";
import { RaceEntity } from "./entity/race.entity";
import { LicenceController } from "./controllers/licence.controller";
import { UsersService } from "./services/users.service";
import { AuthService } from "./services/auth.service";
import { LocalStrategy } from "./services/local.strategy";
import { PassportModule } from "@nestjs/passport";
import { AuthenticationController } from "./controllers/authentication.controller";
import { RacesCtrl } from "./controllers/race.controller";
import { FactoryProvider } from "@nestjs/common/interfaces";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { RlogInterceptor } from "./interceptors/rlog.interceptor";
import { CompetitionController } from "./controllers/competition.controller";
import { ClubController } from "./controllers/club.controller";
import { UserEntity } from "./entity/user.entity";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "./util/constants";
import { JwtStrategy } from "./services/jwt.strategy";
import config from "./config";
import { CompetitionService } from "./services/competition.service";

const RLog: FactoryProvider = {
  provide: APP_INTERCEPTOR,
  scope: Scope.REQUEST,
  useFactory: () => {
    return new RlogInterceptor("custom");
  }
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LicenceEntity,
      ClubEntity,
      CompetitionEntity,
      RaceEntity,
      UserEntity
    ]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: config.app.jwtExpires + "s" }
    })
  ],
  providers: [
    UsersService,
    AuthService,
    LocalStrategy,
    CompetitionService,
    JwtStrategy,
    RLog
  ],
  exports: [UsersService],
  controllers: [
    LicenceController,
    AuthenticationController,
    RacesCtrl,
    CompetitionController,
    ClubController
  ]
})
export class Apiv2Module {}
