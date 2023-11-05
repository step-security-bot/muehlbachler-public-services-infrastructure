import * as gcp from '@pulumi/gcp';

import { NetworkData } from '../../../model/network';
import { environment, globalName, networkConfig } from '../../configuration';

import { createExternalIPs } from './external_ip';
import { createDefaultFirewalls } from './firewall';
import { createInternalIPs } from './internal_ip';

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

  const externalIPs = createExternalIPs(subnets, networkTier);
  const internalIPs = createInternalIPs(subnets);

  const networkData = {
    resource: network,
    subnets: subnets,
    externalIPs: externalIPs,
    internalIPs: internalIPs,
  };

  createDefaultFirewalls(networkData);

  return networkData;
};
