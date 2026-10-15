import { Federation } from '../common/enums';
import { CompetitionEntity } from '../competitions/entities/competition.entity';
import { LicenceEntity } from './entities/licence.entity';
import { getLicenceEligibility, LicenceEligibility } from './licence-eligibility';

// Les colonnes `opened_*` sont nullable en base : le test doit pouvoir passer null.
type CompetitionOverrides = { openedToOtherFede?: boolean | null; openedNL?: boolean | null };

function competition(overrides: CompetitionOverrides = {}): CompetitionEntity {
  return {
    fede: Federation.FSGT,
    openedToOtherFede: false,
    openedNL: false,
    ...overrides,
  } as CompetitionEntity;
}

function licence(fede: Federation | null): LicenceEntity {
  return { fede } as LicenceEntity;
}

describe('getLicenceEligibility', () => {
  it('accepte une licence de la fédé organisatrice, même sur une épreuve fermée', () => {
    expect(getLicenceEligibility(licence(Federation.FSGT), competition(), false)).toBe(
      LicenceEligibility.OK,
    );
  });

  describe('non licencié', () => {
    it('refuse un NL si openedNL est false', () => {
      expect(getLicenceEligibility(licence(Federation.NL), competition(), false)).toBe(
        LicenceEligibility.NL_NOT_ALLOWED,
      );
    });

    it('refuse un NL si openedNL est null', () => {
      expect(
        getLicenceEligibility(licence(Federation.NL), competition({ openedNL: null }), false),
      ).toBe(LicenceEligibility.NL_NOT_ALLOWED);
    });

    it('refuse un NL sur une épreuve ouverte aux autres fédés si openedNL est false', () => {
      expect(
        getLicenceEligibility(
          licence(Federation.NL),
          competition({ openedToOtherFede: true }),
          false,
        ),
      ).toBe(LicenceEligibility.NL_NOT_ALLOWED);
    });

    it('accepte un NL si openedNL est true, même épreuve fermée aux autres fédés', () => {
      expect(
        getLicenceEligibility(licence(Federation.NL), competition({ openedNL: true }), false),
      ).toBe(LicenceEligibility.OK);
    });
  });

  describe('autre fédé', () => {
    it.each([Federation.UFOLEP, Federation.FFC, Federation.FFVELO, Federation.FFTRI, null])(
      'refuse %s sur une épreuve FSGT fermée',
      fede => {
        expect(getLicenceEligibility(licence(fede), competition(), false)).toBe(
          LicenceEligibility.FEDE_NOT_ALLOWED,
        );
      },
    );

    it('refuse une autre fédé si openedToOtherFede est null', () => {
      expect(
        getLicenceEligibility(
          licence(Federation.UFOLEP),
          competition({ openedToOtherFede: null }),
          false,
        ),
      ).toBe(LicenceEligibility.FEDE_NOT_ALLOWED);
    });

    it('accepte une autre fédé sur une épreuve ouverte si le coureur n’a pas de licence organisatrice', () => {
      expect(
        getLicenceEligibility(
          licence(Federation.UFOLEP),
          competition({ openedToOtherFede: true }),
          false,
        ),
      ).toBe(LicenceEligibility.OK);
    });

    it('demande confirmation si le coureur a aussi une licence de la fédé organisatrice', () => {
      expect(
        getLicenceEligibility(
          licence(Federation.UFOLEP),
          competition({ openedToOtherFede: true }),
          true,
        ),
      ).toBe(LicenceEligibility.CONFIRM_OTHER_FEDE);
    });
  });
});
