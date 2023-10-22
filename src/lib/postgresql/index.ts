import * as pg from '@pulumi/postgresql';

import { globalName, postgresqlConfig } from '../configuration';
import { writeToDoppler } from '../util/doppler';

import { createDatabases } from './database';
import { createUsers } from './user';

/**
 * Creates the Postgresql databases and users.
 */
export const createPostgresql = () => {
  const pgProvider = new pg.Provider(
    'postgresql',
    {
      host: postgresqlConfig.address,
      port: postgresqlConfig.port,
      username: postgresqlConfig.username,
      password: postgresqlConfig.password,
      superuser: false,
    },
    {},
  );

  writeToDoppler(
    'PUBLIC_SERVICES_CLUSTER_POSTGRESQL_HOST',
    postgresqlConfig.address,
    `${globalName}-cluster-database`,
  );

  writeToDoppler(
    'PUBLIC_SERVICES_CLUSTER_POSTGRESQL_PORT',
    postgresqlConfig.port.apply((port) => port.toString()),
    `${globalName}-cluster-database`,
  );

  createUsers(pgProvider);
  createDatabases(pgProvider);
};
