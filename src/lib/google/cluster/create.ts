import * as gcp from '@pulumi/gcp';
import { all, Resource } from '@pulumi/pulumi';

import { ClusterData } from '../../../model/cluster';
import { NetworkData } from '../../../model/network';
import {
  clusterConfig,
  commonLabels,
  environment,
  globalName,
} from '../../configuration';
import { getOrDefault } from '../../util/get_or_default';
import { renderTemplate } from '../../util/template';
import { createKubernetesNodeFirewalls } from '../network/firewall';

export const CLUSTER_NAME = `${globalName}-cluster-${environment}`;
const CONTAINER_IMAGE = 'COS_CONTAINERD'; // COS_CONTAINERD, UBUNTU_CONTAINERD

/**
 * Creates a cluster.
 *
 * @param {NetworkData} network the network
 * @returns {ClusterData} the cluster
 */
export const createCluster = (network: NetworkData): ClusterData => {
  const cluster = new gcp.container.Cluster(
    'gcp-cluster',
    {
      name: CLUSTER_NAME,
      description: `${globalName}/${environment}: cluster`,
      addonsConfig: {
        horizontalPodAutoscaling: {
          disabled: false,
        },
        gcePersistentDiskCsiDriverConfig: {
          enabled: true,
        },
        gcpFilestoreCsiDriverConfig: {
          enabled: true,
        },
        dnsCacheConfig: {
          enabled: false,
        },
        httpLoadBalancing: {
          disabled: false, // TODO: enableL4IlbSubsetting is not taken
        },
      },
      enableL4IlbSubsetting: true, // TODO: not applying - can't be set to false...
      binaryAuthorization: {
        evaluationMode: 'DISABLED',
      },
      clusterAutoscaling: {
        autoscalingProfile: 'OPTIMIZE_UTILIZATION',
      },
      serviceExternalIpsConfig: {
        enabled: true,
      },
      datapathProvider: 'ADVANCED_DATAPATH',
      dnsConfig: {
        clusterDns: 'CLOUD_DNS',
        clusterDnsScope: 'VPC_SCOPE',
        clusterDnsDomain: `${environment}.${globalName}.cluster`,
      },
      enableShieldedNodes: true,
      initialNodeCount: 1,
      removeDefaultNodePool: true,
      ipAllocationPolicy: {
        stackType: 'IPV4_IPV6',
      },
      location: clusterConfig.zone,
      loggingConfig: {
        enableComponents: [],
      },
      monitoringConfig: {
        enableComponents: ['SYSTEM_COMPONENTS'].concat(
          clusterConfig.monitoringComponents ?? [],
        ),
        managedPrometheus: {
          enabled: true,
        },
      },
      network: network.resource.id,
      subnetwork: network.subnets[clusterConfig.subnet].id,
      networkingMode: 'VPC_NATIVE',
      releaseChannel: {
        channel: clusterConfig.releaseChannel,
      },
      resourceLabels: {
        ...commonLabels,
        cluster: CLUSTER_NAME,
      },
      securityPostureConfig: clusterConfig.enableSecurityPosture
        ? {
            mode: 'BASIC',
            vulnerabilityMode: 'VULNERABILITY_DISABLED',
          }
        : undefined,
      workloadIdentityConfig: {
        workloadPool: `${gcp.config.project}.svc.id.goog`,
      },
    },
    {
      dependsOn: [network.resource as Resource].concat(
        Object.values(network.subnets),
      ),
      ignoreChanges: ['nodePools', 'nodeConfig'],
    },
  );

  Object.entries(clusterConfig.nodePools)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, config]) => getOrDefault(config.enabled, true))
    .forEach(
      ([name, config]) =>
        new gcp.container.NodePool(
          `gcp-cluster-node-pool-${name}`,
          {
            name: name,
            cluster: cluster.id,
            autoscaling: {
              locationPolicy: 'ANY',
              totalMinNodeCount: config.minCount,
              totalMaxNodeCount: config.maxCount,
            },
            initialNodeCount: config.initialNodeCount,
            location: clusterConfig.zone,
            management: {
              autoRepair: true,
              autoUpgrade: true,
            },
            nodeConfig: {
              diskSizeGb: config.diskSize,
              diskType: 'pd-standard',
              imageType: CONTAINER_IMAGE,
              machineType: config.machineType,
              oauthScopes: ['https://www.googleapis.com/auth/cloud-platform'],
              metadata: {
                'disable-legacy-endpoints': 'true',
              },
              shieldedInstanceConfig: {
                enableIntegrityMonitoring: true,
              },
              spot: config.spot,
              labels: {
                ...config.labels,
                pool: name,
              },
              tags: [CLUSTER_NAME],
              taints: config.taints?.map((taint) => taint),
              resourceLabels: {
                ...commonLabels,
                cluster: CLUSTER_NAME,
              },
              workloadMetadataConfig: {
                mode: 'GKE_METADATA',
              },
            },
            upgradeSettings: {
              strategy: 'SURGE',
              maxSurge: 1,
              maxUnavailable: 0,
            },
          },
          {
            dependsOn: [cluster],
          },
        ),
    );

  createKubernetesNodeFirewalls(network);

  return {
    resource: cluster,
    kubeconfig: all([
      cluster.endpoint,
      cluster.masterAuth.clusterCaCertificate,
    ]).apply(([endpoint, certificateAuthority]) =>
      renderTemplate('./assets/kubeconfig.j2', {
        name: CLUSTER_NAME,
        certificateAuthority: certificateAuthority,
        endpoint: endpoint,
      }),
    ),
  };
};
