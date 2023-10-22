import { local } from '@pulumi/command';
import * as gcp from '@pulumi/gcp';
import * as kubernetes from '@pulumi/kubernetes';
import { Resource } from '@pulumi/pulumi';

import { ClusterData } from '../../model/cluster';
import { argocdConfig, environment } from '../configuration';
import { writeFileContents } from '../util/file';
import { getGitHubRepository } from '../util/github';
import { renderTemplate } from '../util/template';

/**
 * Deploys ArgoCD.
 *
 * @param {string} argocdAdminPassword the argocd admin password
 * @param {gcp.serviceaccount.Account} serviceAccount the service account
 * @param {ClusterData} cluster the cluster
 * @param {kubernetes.Provider} provider the kubernetes provider
 */
export const deployArgo = async (
  argocdAdminPassword: string,
  serviceAccount: gcp.serviceaccount.Account,
  cluster: ClusterData,
  provider: kubernetes.Provider,
) => {
  writeFileContents(
    'outputs/values-argocd.yml',
    renderTemplate('assets/helm/argocd.yml.j2', {
      environment: environment,
      argocdAdminPassword: argocdAdminPassword,
    }),
    {},
  );
  const helmInstall = new local.Command(
    'helm-argocd',
    {
      create: './assets/helm/install.sh',
      environment: {
        DEPLOYMENT_ID: 'argocd',
        DEPLOYMENT_ENV: environment,
        DEPLOYMENT_NAMESPACE: 'argocd',
        HELM_REPO: 'https://argoproj.github.io/argo-helm',
        HELM_CHART_NAME: 'argo-cd',
      },
    },
    {
      dependsOn: [serviceAccount, cluster.resource],
    },
  );

  deployAppOfApps(helmInstall, cluster, provider);
};

/**
 * Deploys the ArgoCD app-of-apps.
 *
 * @param {Resource} helmInstall the helm install resource
 * @param {ClusterData} cluster the cluster
 * @param {kubernetes.Provider} provider the kubernetes provider
 */
const deployAppOfApps = async (
  helmInstall: Resource,
  cluster: ClusterData,
  provider: kubernetes.Provider,
) => {
  const applicationsRepository = (
    await getGitHubRepository(argocdConfig.applicationsRepository.repository)
  ).httpCloneUrl;
  new kubernetes.helm.v3.Release(
    'argocd-cluster-applications',
    {
      chart: 'argocd-apps',
      namespace: 'argocd',
      name: 'argocd-cluster-applications',
      repositoryOpts: {
        repo: 'https://argoproj.github.io/argo-helm',
      },
      version: argocdConfig.appsChartVersion,
      cleanupOnFail: false,
      dependencyUpdate: false,
      values: {
        applications: [
          {
            name: 'cluster-applications',
            namespace: 'argocd',
            project: 'default',
            additionalLabels: {},
            additionalAnnotations: {},
            revisionHistoryLimit: 1,
            finalizers: ['resources-finalizer.argocd.argoproj.io'],
            destination: {
              namespace: 'argocd',
              server: 'https://kubernetes.default.svc',
            },
            sources: [
              {
                repoURL: applicationsRepository,
                targetRevision: argocdConfig.applicationsRepository.branch,
                path: 'library/charts/applications',
                helm: {
                  valueFiles: [
                    '/app-of-apps/values.yaml',
                    '/app-of-apps/values-' + environment + '.yaml',
                  ],
                },
              },
            ],
            syncPolicy: {
              automated: argocdConfig.appsAutosync
                ? {
                    prune: false,
                    selfHeal: true,
                    allowEmpty: false,
                  }
                : {},
              syncOptions: [
                'CreateNamespace=false',
                'FailOnSharedResource=true',
              ],
            },
          },
        ],
      },
    },
    {
      provider: provider,
      dependsOn: [helmInstall, cluster.resource],
    },
  );
};
