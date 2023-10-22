import * as gcp from '@pulumi/gcp';

import { StringMap } from './map';

/**
 * Defines a network.
 */
export type NetworkData = {
  readonly resource: gcp.compute.Network;
  readonly subnets: StringMap<gcp.compute.Subnetwork>;
  readonly externalIPs: StringMap<ExternalIPData>;
};

/**
 * Defines an external IP.
 */
export type ExternalIPData = {
  readonly ipv4: gcp.compute.Address;
  readonly ipv6?: gcp.compute.Address;
};
