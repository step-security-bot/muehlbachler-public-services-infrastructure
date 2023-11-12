import * as gcp from '@pulumi/gcp';

import { clusterConfig, commonLabels } from '../../configuration';
import { getOrDefault } from '../../util/get_or_default';

import { CLUSTER_NAME } from './create';

const CONTAINER_IMAGE = 'COS_CONTAINERD'; // COS_CONTAINERD, UBUNTU_CONTAINERD

/**
 * Creates the node pools.
 *
 * @param {gcp.container.Cluster} cluster the cluster
 */
export const createNodePools = (cluster: gcp.container.Cluster) => {
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
            ignoreChanges: ['nodeConfig.effectiveTaints'],
          },
        ),
    );
};
