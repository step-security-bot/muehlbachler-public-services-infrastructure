import * as kubernetes from '@pulumi/kubernetes';

import { createArgoResources } from './lib/argocd';
import { createCertManagerResources } from './lib/cert_manager';
import { edgeInstanceConfig } from './lib/configuration';
import { createExternalDNSResources } from './lib/external_dns';
import { createCluster } from './lib/google/cluster/create';
import { createEdgeResources } from './lib/google/edge';
import { createNetwork } from './lib/google/network/network';
import { createPostgresql } from './lib/postgresql';
import { createDir } from './lib/util/create_dir';
import { writeFilePulumiAndUploadToS3 } from './lib/util/storage';

export = async () => {
  createDir('outputs');

  // network
  const network = createNetwork();

  // database
  createPostgresql();

  // cluster
  const cluster = createCluster(network);
  writeFilePulumiAndUploadToS3('admin.conf', cluster.kubeconfig, {});
  const kubernetesProvider = new kubernetes.Provider(
    'gke-cluster',
    {
      kubeconfig: cluster.kubeconfig,
    },
    {
      dependsOn: [cluster.resource],
    },
  );

  // cluster resources
  createExternalDNSResources(cluster, kubernetesProvider);
  createCertManagerResources(cluster, kubernetesProvider);
  const argocdPassword = await createArgoResources(cluster, kubernetesProvider);

  // edge instance
  createEdgeResources(network);

  return {
    cluster: {
      configuration: {
        endpoint: cluster.resource.endpoint,
        certificateAuthority: cluster.resource.masterAuth.clusterCaCertificate,
        kubeconfig: cluster.kubeconfig,
      },
      argocd: {
        password: argocdPassword.password,
      },
    },
    edge: {
      ip: {
        ipv4: network.externalIPs[edgeInstanceConfig.network.externalIp].ipv4
          .address,
        ipv6: network.externalIPs[edgeInstanceConfig.network.externalIp].ipv6
          ?.address,
      },
    },
  };
};
