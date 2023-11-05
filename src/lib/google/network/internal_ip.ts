import * as gcp from '@pulumi/gcp';

import { StringMap } from '../../../model/map';
import { NetworkIPData } from '../../../model/network';
import {
  commonLabels,
  environment,
  globalName,
  networkConfig,
} from '../../configuration';

/**
 * Creates the internal IP addresses.
 *
 * @param {StringMap<gcp.compute.Subnetwork>} subnets the subnetworks
 * @returns {StringMap<NetworkIPData>} the internal IP addresses
 */
export const createInternalIPs = (
  subnets: StringMap<gcp.compute.Subnetwork>,
): StringMap<NetworkIPData> =>
  Object.fromEntries(
    Object.entries(networkConfig.internalIp).map(([name, config]) => [
      name,
      {
        ipv4: new gcp.compute.Address(
          `gcp-address-internal-ipv4-${name}`,
          {
            name: `${globalName}-${name}-internal-ipv4-${environment}`,
            description: `${globalName}/${environment}: ${name} Internal IPv4 address`,
            region: networkConfig.subnet[config.subnet].region,
            addressType: 'INTERNAL',
            subnetwork: subnets[config.subnet].id,
            purpose: 'GCE_ENDPOINT',
            labels: commonLabels,
          },
          {
            dependsOn: [subnets[config.subnet]],
            ignoreChanges: ['users'],
          },
        ),
        ipv6: config.ipv6
          ? new gcp.compute.Address(
              `gcp-address-internal-ipv6-${name}`,
              {
                name: `${globalName}-${name}-internal-ipv6-${environment}`,
                description: `${globalName}/${environment}: ${name} Internal IPv6 address`,
                region: networkConfig.subnet[config.subnet].region,
                addressType: 'INTERNAL',
                ipVersion: 'IPV6',
                ipv6EndpointType: 'VM',
                subnetwork: subnets[config.subnet].id,
                purpose: 'GCE_ENDPOINT',
                labels: commonLabels,
              },
              {
                dependsOn: [subnets[config.subnet]],
                ignoreChanges: ['users'],
              },
            )
          : undefined,
      },
    ]),
  );
