import * as gcp from '@pulumi/gcp';
import * as kubernetes from '@pulumi/kubernetes';

import { ClusterData } from '../../model/cluster';
import { commonLabels } from '../configuration';
import { createWorkloadIdentityUserBinding } from '../google/iam/workload_identity_user';

/**
 * Creates all resources for a workload identity user.
 * This contains the namespace, service account, and bindings in Google.
 *
 * @param {string} namespaceName the namespace name
 * @param {string} serviceAccountName the service account name
 * @param {gcp.serviceaccount.Account} serviceAccount the service account to bind to
 * @param {ClusterData} cluster the cluster
 * @param {kubernetes.Provider} kubernetesProvider the Kubernetes provider
 * @param {kubernetes.core.v1.Namespace} existingNamespace the namespace object
 */
export const createWorkloadIdentity = (
  namespaceName: string,
  serviceAccountName: string,
  serviceAccount: gcp.serviceaccount.Account,
  cluster: ClusterData,
  kubernetesProvider: kubernetes.Provider,
  {
    existingNamespace,
  }: {
    readonly existingNamespace?: kubernetes.core.v1.Namespace;
  },
) => {
  const k8sNamespace =
    existingNamespace ??
    new kubernetes.core.v1.Namespace(
      `k8s-namespace-${namespaceName}`,
      {
        metadata: {
          name: namespaceName,
          labels: commonLabels,
        },
      },
      {
        provider: kubernetesProvider,
        dependsOn: [cluster.resource],
      },
    );
  const k8sServiceAccount = new kubernetes.core.v1.ServiceAccount(
    `k8s-serviceaccount-${namespaceName}-${serviceAccountName}`,
    {
      metadata: {
        name: serviceAccountName,
        namespace: k8sNamespace.metadata.name,
        annotations: {
          'iam.gke.io/gcp-service-account': serviceAccount.email,
        },
        labels: commonLabels,
      },
    },
    {
      provider: kubernetesProvider,
      dependsOn: [k8sNamespace, cluster.resource],
    },
  );

  createWorkloadIdentityUserBinding(
    serviceAccount.id,
    k8sNamespace.metadata.name,
    k8sServiceAccount.metadata.name,
  );
};
