import { BadRequestException } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardChartFiltersDto } from './dto/dashboard-chart-filters.dto';

/**
 * Tests unitaires du clamp de `limit` sur GET /dashboard/charts/top-riders.
 * La route est ouverte au rôle MOBILE : le contrôleur doit borner le limit
 * à 200 pour qu'un token mobile ne puisse pas aspirer tout l'effectif licencié.
 * `?limit=abc` arrive en NaN après la ValidationPipe (enableImplicitConversion)
 * et doit retomber sur 50, pas propager NaN au service.
 */
describe('DashboardController.getTopRiders — clamp du limit', () => {
  const FILTERS = {} as DashboardChartFiltersDto;

  let dashboardService: { getTopRiders: jest.Mock };
  let controller: DashboardController;

  beforeEach(() => {
    dashboardService = { getTopRiders: jest.fn().mockResolvedValue([]) };
    controller = new DashboardController(dashboardService as unknown as DashboardService);
  });

  it('should default to 50 when limit is absent', async () => {
    await controller.getTopRiders(FILTERS);

    expect(dashboardService.getTopRiders).toHaveBeenCalledWith(FILTERS, 50);
  });

  it('should cap limit at 200 when the client requests more', async () => {
    await controller.getTopRiders(FILTERS, 999999);

    expect(dashboardService.getTopRiders).toHaveBeenCalledWith(FILTERS, 200);
  });

  it('should fall back to 50 when limit is NaN (ex: ?limit=abc)', async () => {
    await controller.getTopRiders(FILTERS, Number('abc'));

    expect(dashboardService.getTopRiders).toHaveBeenCalledWith(FILTERS, 50);
  });
});

/**
 * Tests unitaires du garde-fou « exactement un club » sur
 * GET /dashboard/charts/club-performances.
 * La route est ouverte au rôle MOBILE et sa requête recalcule les rangs de tous
 * les partants des départs retenus : sans club, elle balaierait toute la table
 * `race`. Le contrôleur doit refuser avant d'atteindre le service.
 */
describe('DashboardController.getClubPerformances — garde-fou du club', () => {
  let dashboardService: { getClubPerformances: jest.Mock };
  let controller: DashboardController;

  beforeEach(() => {
    dashboardService = { getClubPerformances: jest.fn().mockResolvedValue([]) };
    controller = new DashboardController(dashboardService as unknown as DashboardService);
  });

  it('should reject when no club is provided', async () => {
    const filters = {} as DashboardChartFiltersDto;

    await expect(controller.getClubPerformances(filters)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dashboardService.getClubPerformances).not.toHaveBeenCalled();
  });

  it('should reject when the clubs filter is empty', async () => {
    const filters = { clubs: [] } as DashboardChartFiltersDto;

    await expect(controller.getClubPerformances(filters)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dashboardService.getClubPerformances).not.toHaveBeenCalled();
  });

  it('should reject when several clubs are requested', async () => {
    const filters = { clubs: ['VC Toulouse', 'AS Muret'] } as DashboardChartFiltersDto;

    await expect(controller.getClubPerformances(filters)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dashboardService.getClubPerformances).not.toHaveBeenCalled();
  });

  it('should forward the single club and the filters to the service', async () => {
    const filters = {
      clubs: ['VC Toulouse'],
      startDate: '2026-03-01',
    } as DashboardChartFiltersDto;

    await controller.getClubPerformances(filters);

    expect(dashboardService.getClubPerformances).toHaveBeenCalledWith('VC Toulouse', filters);
  });
});
