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
