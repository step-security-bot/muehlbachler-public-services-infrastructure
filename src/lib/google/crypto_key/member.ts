import * as gcp from '@pulumi/gcp';
import { CustomResourceOptions } from '@pulumi/pulumi';

import { sanitizeText } from '../../util/string';

/**
 * Defines a new IAM member for a key.
 *
 * @param {string} cryptoKeyId the id of the key
 * @param {Output<string>| string} member the name of the member
 * @param {string[]} roles the roles
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 */
export const createCryptoKeyIAMMember = (
  cryptoKeyId: string,
  member: string,
  roles: readonly string[],
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  roles.forEach(
    (role) =>
      new gcp.kms.CryptoKeyIAMMember(
        `gcp-kms-iam-member-${sanitizeText(member)}-${sanitizeText(
          cryptoKeyId,
        )}-${sanitizeText(role)}`,
        {
          cryptoKeyId: cryptoKeyId,
          member: member,
          role: role,
        },
        pulumiOptions,
      ),
  );
};
