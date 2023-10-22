import * as gcp from '@pulumi/gcp';
import { Output } from '@pulumi/pulumi';

/**
 * Defines a cluster.
 */
export type ClusterData = {
  readonly resource: gcp.container.Cluster;
  readonly kubeconfig: Output<string>;
};
