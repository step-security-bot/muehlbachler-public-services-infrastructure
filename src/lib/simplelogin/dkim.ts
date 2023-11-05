import { Output } from '@pulumi/pulumi';

import { globalName } from '../configuration';
import { writeToDoppler } from '../util/doppler';
import { createRSAkey } from '../util/rsa_key';

/**
 * Creates the SimpleLogin DKIM key.
 *
 * @returns {Output<string>} the DKIM key
 */
export const createDKIMKey = (): Output<string> => {
  const dkimKey = createRSAkey('dkim-mail-relay', { rsaBits: 2048 });

  writeToDoppler(
    'PUBLIC_SERVICES_MAIL_RELAY_DKIM_PRIVATE_KEY',
    dkimKey.privateKeyPem,
    `${globalName}-cluster-mail-relay`,
  );
  writeToDoppler(
    'PUBLIC_SERVICES_MAIL_RELAY_DKIM_PUBLIC_KEY',
    dkimKey.publicKeyPem,
    `${globalName}-cluster-mail-relay`,
  );

  return dkimKey.publicKeyPem.apply((key) =>
    key
      .replace('-----BEGIN PUBLIC KEY-----\n', '')
      .replace('-----END PUBLIC KEY-----', '')
      .trim()
      .split('\n')
      .join(''),
  );
};
