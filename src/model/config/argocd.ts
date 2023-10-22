/**
 * Defines ArgoCD configuration.
 */
export type ArgocdConfig = {
  readonly applicationsRepository: ArgocdRepositoryConfig;
  readonly appsChartVersion: string;
  readonly appsAutosync?: boolean;
};

/**
 * Defines ArgoCD repository configuration.
 */
export type ArgocdRepositoryConfig = {
  readonly repository: string;
  readonly branch: string;
};
