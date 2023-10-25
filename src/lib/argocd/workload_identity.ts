import * as gcp from '@pulumi/gcp';
import * as kubernetes from '@pulumi/kubernetes';

import { ClusterData } from '../../model/cluster';
import { clusterConfig } from '../configuration';
import { createCryptoKeyIAMMember } from '../google/crypto_key/member';
import { createServiceAccount } from '../google/iam/service_account';
import { createWorkloadIdentity } from '../kubernetes/workload_identity';

/**
 * Creates the ArgoCD service account and workload identity.
 *
 * @param {kubernetes.core.v1.Namespace} namespace the namespace
 * @param {ClusterData} cluster the cluster
 * @param {kubernetes.Provider} kubernetesProvider the Kubernetes provider
 * @returns {gcp.serviceaccount.Account} the service account
 */
export const createArgoWorkloadIdentity = (
  namespace: kubernetes.core.v1.Namespace,
  cluster: ClusterData,
  kubernetesProvider: kubernetes.Provider,
): gcp.serviceaccount.Account => {
  const serviceAccount = createServiceAccount('ksops', {});

  serviceAccount.email.apply((email) =>
    createCryptoKeyIAMMember(
      `${clusterConfig.accessConfiguration.encryptionKey.location}/${clusterConfig.accessConfiguration.encryptionKey.keyringId}/${clusterConfig.accessConfiguration.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      ['roles/cloudkms.cryptoKeyEncrypterDecrypter'],
      {},
    ),
  );

  createWorkloadIdentity(
    'argocd',
    'argocd',
    serviceAccount,
    cluster,
    kubernetesProvider,
    {
      existingNamespace: namespace,
    },
  );

  return serviceAccount;
};
