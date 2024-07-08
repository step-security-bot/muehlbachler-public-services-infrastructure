import { Output } from '@pulumi/pulumi';

import { globalName, mailConfig } from '../configuration';
import { writeToVault } from '../util/vault/secret';

import { createAWSResources } from './aws';
import { createDKIMKey } from './dkim';
import { createFlaskSecret } from './flask';
import { createDNSRecords } from './record';

/**
 * Creates the SimpleLogin resources.
 *
 * @returns {Output<string>} the dkim public key
 */
export const createSimpleloginResources = (): Output<string> => {
  createFlaskSecret();

  createAWSResources();

  const dkimKey = createDKIMKey();
  createDNSRecords(dkimKey);

  writeToVault(
    'mail-relay-postfix-server',
    Output.create(JSON.stringify({ ipv4: mailConfig.server.ipv4Address })),
    `kubernetes-${globalName}-cluster`,
  );

  return dkimKey;
};
