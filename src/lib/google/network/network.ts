import * as gcp from '@pulumi/gcp';

import { NetworkData } from '../../../model/network';
import {
  commonLabels,
  environment,
  globalName,
  networkConfig,
} from '../../configuration';

import { createDefaultFirewalls } from './firewall';

/**
 * Creates the networks.
 *
 * @returns {NetworkData} the generated network
 */
export const createNetwork = (): NetworkData => {
  const networkTier = new gcp.compute.ProjectDefaultNetworkTier(
    'gcp-project-default-network-tier',
    {
      networkTier: networkConfig.tier,
    },
    {},
  );

  const network = new gcp.compute.Network(
    'gcp-network',
    {
      name: `${globalName}-${environment}`,
      description: `${globalName}/${environment}: network`,
      mtu: 1500,
      autoCreateSubnetworks: false,
      routingMode: 'REGIONAL',
    },
    {
      dependsOn: [networkTier],
    },
  );

  const subnets = Object.fromEntries(
    Object.entries(networkConfig.subnet).map(([name, config]) => [
      name,
      new gcp.compute.Subnetwork(
        `gcp-subnetwork-${name}`,
        {
          name: `${globalName}-${name}-${environment}`,
          description: `${globalName}/${environment}: subnetwork ${name}`,
          region: config.region,
          ipCidrRange: config.cidr,
          ipv6AccessType: 'EXTERNAL',
          network: network.id,
          privateIpGoogleAccess: true,
          privateIpv6GoogleAccess: 'ENABLE_OUTBOUND_VM_ACCESS_TO_GOOGLE',
          purpose: 'PRIVATE',
          role: 'ACTIVE',
          stackType: 'IPV4_IPV6',
        },
        {
          dependsOn: [networkTier],
          ignoreChanges: ['secondaryIpRanges'],
        },
      ),
    ]),
  );

  const externalIPs = Object.fromEntries(
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

  const networkData = {
    resource: network,
    subnets: subnets,
    externalIPs: externalIPs,
  };

  createDefaultFirewalls(networkData);

  return networkData;
};
