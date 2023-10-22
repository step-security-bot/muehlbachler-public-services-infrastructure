import * as kubernetes from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';

import { ClusterData } from '../../model/cluster';
import { clusterConfig } from '../configuration';
import { createIAMMember } from '../google/iam/member';
import { createServiceAccount } from '../google/iam/service_account';
import { createWorkloadIdentity } from '../kubernetes/workload_identity';
import { getProject } from '../util/google';

/**
 * Creates the external-dns resources.
 *
 * @param {ClusterData} cluster the cluster
 * @param {kubernetes.Provider} kubernetesProvider the Kubernetes provider
 */
export const createExternalDNSResources = (
  cluster: ClusterData,
  kubernetesProvider: kubernetes.Provider,
) => {
  const roles = ['roles/dns.admin'];

  const serviceAccount = createServiceAccount('external-dns', {});

  [getProject()]
    .concat(clusterConfig.accessConfiguration.projects ?? [])
    .forEach((project) =>
      createIAMMember(
        'external-dns',
        interpolate`serviceAccount:${serviceAccount.email}`,
        roles,
        {
          project: project,
        },
      ),
    );

  createWorkloadIdentity(
    'external-dns',
    'external-dns',
    serviceAccount,
    cluster,
    kubernetesProvider,
    {},
  );
};
