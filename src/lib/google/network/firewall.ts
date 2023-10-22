import * as gcp from '@pulumi/gcp';

import { NetworkData } from '../../../model/network';
import { environment, globalName, ingressConfig } from '../../configuration';
import { getOrDefault } from '../../util/get_or_default';
import { CLUSTER_NAME } from '../cluster/create';
import { INSTANCE_NAME } from '../edge/instance';

/**
 * Creates the default firewalls.
 *
 * @param {NetworkData} network the network
 */
export const createDefaultFirewalls = (network: NetworkData) => {
  new gcp.compute.Firewall(
    'gcp-firewall-egress-default',
    {
      name: `${globalName}-egress-default-${environment}`,
      description: `${globalName}/${environment}: default egress rules`,
      direction: 'EGRESS',
      network: network.resource.id,
      allows: [
        {
          protocol: 'all',
        },
      ],
    },
    {},
  );

  new gcp.compute.Firewall(
    'gcp-firewall-ingress-deny-ipv4',
    {
      name: `${globalName}-ingress-deny-ipv4-${environment}`,
      description: `${globalName}/${environment}: IPv4 deny ingress rules`,
      direction: 'INGRESS',
      network: network.resource.id,
      priority: 65535,
      sourceRanges: ['0.0.0.0/0'],
      denies: [
        {
          protocol: 'all',
        },
      ],
    },
    {},
  );

  new gcp.compute.Firewall(
    'gcp-firewall-ingress-deny-ipv6',
    {
      name: `${globalName}-ingress-deny-ipv6-${environment}`,
      description: `${globalName}/${environment}: IPv6 deny ingress rules`,
      direction: 'INGRESS',
      network: network.resource.id,
      priority: 65535,
      sourceRanges: ['::/0'],
      denies: [
        {
          protocol: 'all',
        },
      ],
    },
    {},
  );
};

/**
 * Creates the edge instance firewalls.
 *
 * @param {NetworkData} network the network
 */
export const createEdgeInstanceFirewalls = (network: NetworkData) => {
  Object.entries(ingressConfig.service)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, config]) => getOrDefault(config.exposed, true))
    .forEach(([name, config]) => {
      new gcp.compute.Firewall(
        `gcp-firewall-ingress-edge-instance-${name}-ipv4`,
        {
          name: `${globalName}-ingress-edge-instance-${name}-ipv4-${environment}`,
          description: `${globalName}/${environment}: ${name} IPv4 edge ingress rules`,
          direction: 'INGRESS',
          network: network.resource.id,
          sourceRanges: ['0.0.0.0/0'],
          targetTags: [INSTANCE_NAME],
          allows: [
            {
              protocol: 'tcp',
              ports: [config.port.toString()],
            },
          ],
        },
        {},
      );

      new gcp.compute.Firewall(
        `gcp-firewall-ingress-edge-instance-${name}-ipv6`,
        {
          name: `${globalName}-ingress-edge-instance-${name}-ipv6-${environment}`,
          description: `${globalName}/${environment}: ${name} IPv6 edge ingress rules`,
          direction: 'INGRESS',
          network: network.resource.id,
          sourceRanges: ['::/0'],
          targetTags: [INSTANCE_NAME],
          allows: [
            {
              protocol: 'tcp',
              ports: [config.port.toString()],
            },
          ],
        },
        {},
      );
    });

  Object.entries(ingressConfig.service)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, config]) => config.target != undefined)
    .forEach(
      ([name, config]) =>
        new gcp.compute.Firewall(
          `gcp-firewall-ingress-edge-instance-${name}-target`,
          {
            name: `${globalName}-ingress-edge-instance-${name}-target-${environment}`,
            description: `${globalName}/${environment}: ${name} target edge ingress rules`,
            direction: 'INGRESS',
            network: network.resource.id,
            sourceTags: [INSTANCE_NAME],
            targetTags: [CLUSTER_NAME],
            allows: [
              {
                protocol: 'tcp',
                ports: [config.target?.port?.toString() ?? ''],
              },
            ],
          },
          {},
        ),
    );
};

/**
 * Creates the Kubernetes node firewalls.
 *
 * @param {NetworkData} network the network
 */
export const createKubernetesNodeFirewalls = (network: NetworkData) => {
  new gcp.compute.Firewall(
    `gcp-firewall-ingress-argocd-ipv4`,
    {
      name: `${globalName}-ingress-argocd-ipv4-${environment}`,
      description: `${globalName}/${environment}: ArgoCD IPv4 ingress rules`,
      direction: 'INGRESS',
      network: network.resource.id,
      sourceRanges: ['0.0.0.0/0'],
      targetTags: [CLUSTER_NAME],
      allows: [
        {
          protocol: 'tcp',
          ports: ['30443'],
        },
      ],
    },
    {},
  );
};
