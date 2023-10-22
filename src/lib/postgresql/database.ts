import * as pg from '@pulumi/postgresql';

import { databaseConfig, globalName } from '../configuration';
import { writeToDoppler } from '../util/doppler';

/**
 * Creates the databases.
 *
 * @param {pg.Provider} provider the database provider
 */
export const createDatabases = (provider: pg.Provider) => {
  Object.entries(databaseConfig.database).map(([db, owner]) => {
    const pgDb = new pg.Database(
      `pg-db-${db}`,
      {
        name: db,
        owner: owner,
      },
      { provider: provider },
    );
    writeToDoppler(
      'PUBLIC_SERVICES_CLUSTER_POSTGRESQL_DATABASE_' + db.toUpperCase(),
      pgDb.name,
      `${globalName}-cluster-database`,
    );
  });
};
