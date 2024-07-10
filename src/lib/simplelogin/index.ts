import { all, Output } from '@pulumi/pulumi';

import { StringMap } from '../../model/map';
import { PostgresqlUserData } from '../../model/postgresql';
import { globalName, mailConfig, postgresqlConfig } from '../configuration';
import { writeToVault } from '../util/vault/secret';

import { createAWSResources } from './aws';
import { createDKIMKey } from './dkim';
import { createFlaskSecret } from './flask';
import { createDNSRecords } from './record';

/**
 * Creates the SimpleLogin resources.
 *
 * @param {StringMap<PostgresqlUserData>} postgresqlUsers a map containing users and their passwords
 * @returns {Output<string>} the dkim public key
 */
export const createSimpleloginResources = (
  postgresqlUsers: StringMap<PostgresqlUserData>,
): Output<string> => {
  createFlaskSecret();

  createAWSResources();

  const dkimKey = createDKIMKey();
  createDNSRecords(dkimKey);

  all([
    postgresqlUsers['simplelogin'].password,
    postgresqlConfig.address,
    postgresqlConfig.port,
  ]).apply(([password, address, port]) => ({
    host: address,
    port: port,
    database: 'simplelogin',
    user: 'simplelogin',
    password: password,
  }));

  writeToVault(
    'mail-relay-postfix-server',
    Output.create(JSON.stringify({ ipv4: mailConfig.relayServer })),
    `kubernetes-${globalName}-cluster`,
  );

  return dkimKey;
};
