import * as kubernetes from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';

import { ClusterData } from '../../model/cluster';
import { clusterConfig } from '../configuration';
import { createIAMMember } from '../google/iam/member';
import { createServiceAccount } from '../google/iam/service_account';
import { createWorkloadIdentity } from '../kubernetes/workload_identity';
import { getProject } from '../util/google';

/**
 * Creates the cert-manager resources.
 *
 * @param {ClusterData} cluster the cluster
 * @param {kubernetes.Provider} kubernetesProvider the Kubernetes provider
 */
export const createCertManagerResources = (
  cluster: ClusterData,
  kubernetesProvider: kubernetes.Provider,
) => {
  const roles = ['roles/dns.admin'];

  const serviceAccount = createServiceAccount('cert-manager', {});

  [getProject()]
    .concat(clusterConfig.accessConfiguration.projects ?? [])
    .forEach((project) =>
      createIAMMember(
        'cert-manager',
        interpolate`serviceAccount:${serviceAccount.email}`,
        roles,
        {
          project: project,
        },
      ),
    );

  createWorkloadIdentity(
    'cert-manager',
    'cert-manager',
    serviceAccount,
    cluster,
    kubernetesProvider,
    {},
  );
};
