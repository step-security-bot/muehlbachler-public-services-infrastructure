import { Output } from '@pulumi/pulumi';

import { ExternalIPData } from '../../model/network';
import { globalName } from '../configuration';
import { writeToDoppler } from '../util/doppler';

import { createAWSResources } from './aws';
import { createDKIMKey } from './dkim';
import { createFlaskSecret } from './flask';
import { createDNSRecords } from './record';

/**
 * Creates the SimpleLogin resources.
 *
 * @param {ExternalIPData} externalIp the external IP of the server
 * @returns {Output<string>} the dkim public key
 */
export const createSimpleloginResources = (
  externalIp: ExternalIPData,
): Output<string> => {
  createFlaskSecret();

  createAWSResources();

  const dkimKey = createDKIMKey();
  createDNSRecords(externalIp, dkimKey);

  writeToDoppler(
    'PUBLIC_SERVICES_MAIL_RELAY_POSTFIX_SERVER',
    externalIp.ipv4.address,
    `${globalName}-cluster-mail-relay`,
  );

  return dkimKey;
};
