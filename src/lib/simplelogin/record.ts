import { interpolate, Output } from '@pulumi/pulumi';

import { mailConfig } from '../configuration';
import { createRecord } from '../google/dns/record';

/**
 * Creates the base DNS records.
 *
 * @param {Output<string>} dkimPublicKey the public DKIM key
 */
export const createDNSRecords = (dkimPublicKey: Output<string>) => {
  createRecord(
    `dkim._domainkey.${mailConfig.domain}`,
    mailConfig.zoneId,
    'TXT',
    [
      interpolate`v=DKIM1; k=rsa; t=s; s=email; p=${dkimPublicKey}`.apply(
        (entry) => splitByLength(entry, 'TXT'),
      ),
    ],
    {},
  );
  createRecord(
    `dkim02._domainkey.${mailConfig.domain}`,
    mailConfig.zoneId,
    'TXT',
    [
      interpolate`v=DKIM1; k=rsa; t=s; s=email; p=${dkimPublicKey}`.apply(
        (entry) => splitByLength(entry, 'TXT'),
      ),
    ],
    {},
  );
  createRecord(
    `dkim03._domainkey.${mailConfig.domain}`,
    mailConfig.zoneId,
    'TXT',
    [
      interpolate`v=DKIM1; k=rsa; t=s; s=email; p=${dkimPublicKey}`.apply(
        (entry) => splitByLength(entry, 'TXT'),
      ),
    ],
    {},
  );
};

/**
 * Splits the value by the allowed maximum length.
 *
 * @param {string} value the value
 * @param {string} type the entry type
 * @returns
 */
const splitByLength = (value: string, type: string) => {
  const split = value.split(/(.{200})/).filter((x) => x.length > 0);

  return split.length > 1 || type == 'TXT'
    ? `"${split.join('" "')}"`
    : split.join();
};
