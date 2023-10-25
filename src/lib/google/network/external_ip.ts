import * as gcp from '@pulumi/gcp';

import { StringMap } from '../../../model/map';
import { ExternalIPData } from '../../../model/network';
import {
  commonLabels,
  environment,
  globalName,
  networkConfig,
} from '../../configuration';

/**
 * Creates the external IP addresses.
 *
 * @param {StringMap<gcp.compute.Subnetwork>} subnets the subnetworks
 * @param {gcp.compute.ProjectDefaultNetworkTier} networkTier the network tier
 * @returns {StringMap<ExternalIPData>} the external IP addresses
 */
export const createExternalIPs = (
  subnets: StringMap<gcp.compute.Subnetwork>,
  networkTier: gcp.compute.ProjectDefaultNetworkTier,
): StringMap<ExternalIPData> =>
  Object.fromEntries(
    Object.entries(networkConfig.externalIp).map(([name, config]) => [
      name,
      {
        ipv4: new gcp.compute.Address(
          `gcp-address-ipv4-${name}`,
          {
            name: `${globalName}-${name}-ipv4-${environment}`,
            description: `${globalName}/${environment}: ${name} IPv4 address`,
            region: networkConfig.subnet[config.subnet].region,
            addressType: 'EXTERNAL',
            networkTier: config.tier ?? 'STANDARD',
            labels: commonLabels,
          },
          {
            dependsOn: [subnets[config.subnet], networkTier],
            ignoreChanges: ['users'],
          },
        ),
        ipv6: config.ipv6
          ? new gcp.compute.Address(
              `gcp-address-ipv6-${name}`,
              {
                name: `${globalName}-${name}-ipv6-${environment}`,
                description: `${globalName}/${environment}: ${name} IPv6 address`,
                region: networkConfig.subnet[config.subnet].region,
                addressType: 'EXTERNAL',
                ipVersion: 'IPV6',
                ipv6EndpointType: 'VM',
                networkTier: config.tier ?? 'STANDARD',
                subnetwork: subnets[config.subnet].id,
                labels: commonLabels,
              },
              {
                dependsOn: [subnets[config.subnet], networkTier],
                ignoreChanges: ['users'],
              },
            )
          : undefined,
      },
    ]),
  );
