import { Output, Resource } from '@pulumi/pulumi';

import { NetworkIPData } from '../../../model/network';
import { edgeInstanceConfig } from '../../configuration';
import { createRecord } from '../dns/record';

/**
 * Creates the edge DNS records.
 *
 * @param {NetworkIPData} externalIp the external IP of the mail server
 * @returns {Resource[]} the resources
 */
export const createEdgePtrRecord = (externalIp: NetworkIPData): Resource[] =>
  [
    createRecord(
      edgeInstanceConfig.hostname ?? '',
      edgeInstanceConfig.network.zoneId,
      'A',
      [externalIp.ipv4.address],
      {},
    ),
  ].concat(
    externalIp.ipv6 != undefined
      ? [
          createRecord(
            edgeInstanceConfig.hostname ?? '',
            edgeInstanceConfig.network.zoneId,
            'AAAA',
            [externalIp.ipv6?.address ?? Output.create('')],
            {},
          ),
        ]
      : [],
  );
