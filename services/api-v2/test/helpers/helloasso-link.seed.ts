import { DataSource, In } from 'typeorm';

import { HelloAssoDetailsEntity } from '../../src/helloasso/entities/helloasso-details.entity';
import { HelloAssoOrganizationEntity } from '../../src/helloasso/entities/helloasso-organization.entity';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SeedHelloAssoLinkOptions {
  clubId: number;
  /** Slug de l'orga ; réutilisée si elle existe déjà (2e club sur la même orga). */
  organizationSlug: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  isCashInCompliant?: boolean | null;
  linkedAt?: Date;
}

/**
 * Lie un club à une orga HelloAsso directement en base (orga créée si besoin,
 * puis rattachement du club). Valeurs factices par défaut : tokens jamais
 * déchiffrés, refresh token valide 20 jours, conformité `true`.
 */
export async function seedHelloAssoLink(
  dataSource: DataSource,
  opts: SeedHelloAssoLinkOptions,
): Promise<{ organization: HelloAssoOrganizationEntity; link: HelloAssoDetailsEntity }> {
  const orgs = dataSource.getRepository(HelloAssoOrganizationEntity);
  const organization =
    (await orgs.findOne({ where: { organizationSlug: opts.organizationSlug } })) ??
    (await orgs.save({
      organizationSlug: opts.organizationSlug,
      accessTokenEncrypted: opts.accessTokenEncrypted ?? 'iv.tag.ct',
      refreshTokenEncrypted: opts.refreshTokenEncrypted ?? 'iv.tag.ct',
      accessTokenExpiresAt: opts.accessTokenExpiresAt ?? new Date(Date.now() + 30 * 60 * 1000),
      refreshTokenExpiresAt: opts.refreshTokenExpiresAt ?? new Date(Date.now() + 20 * DAY_MS),
      lastRefreshedAt: null,
      isCashInCompliant: opts.isCashInCompliant === undefined ? true : opts.isCashInCompliant,
    }));
  const link = await dataSource.getRepository(HelloAssoDetailsEntity).save({
    clubId: opts.clubId,
    organizationId: organization.id,
    linkedByUserId: null,
    linkedAt: opts.linkedAt ?? new Date(),
  });
  return { organization, link };
}

/**
 * Supprime les rattachements de ces clubs, puis les orgas qui n'ont plus aucun
 * club. La base testcontainer est partagée entre fichiers : jamais de nettoyage
 * global.
 */
export async function cleanHelloAssoLinks(
  dataSource: DataSource,
  clubIds: number[],
): Promise<void> {
  if (clubIds.length === 0) return;
  const links = dataSource.getRepository(HelloAssoDetailsEntity);
  const rows = await links.find({ where: { clubId: In(clubIds) } });
  if (rows.length === 0) return;
  await links.delete({ clubId: In(clubIds) });
  const orgIds = [...new Set(rows.map(r => r.organizationId))];
  await dataSource.query(
    `DELETE FROM helloasso_organization o
     WHERE o.id = ANY($1)
       AND NOT EXISTS (SELECT 1 FROM helloasso_details d WHERE d.organization_id = o.id)`,
    [orgIds],
  );
}
