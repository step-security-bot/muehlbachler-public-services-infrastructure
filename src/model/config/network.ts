import { StringMap } from '../map';

/**
 * Defines network configuration.
 */
export type NetworkConfig = {
  readonly subnet: StringMap<SubnetworkConfig>;
  readonly externalIp: StringMap<ExternalIpConfig>;
  readonly internalIp: StringMap<InternalIpConfig>;
  readonly tier: string;
};

/**
 * Defines subnetwork configuration.
 */
export type SubnetworkConfig = {
  readonly region: string;
  readonly cidr: string;
};

/**
 * Defines external IP address configuration.
 */
export type ExternalIpConfig = {
  readonly subnet: string;
  readonly tier?: string;
  readonly ipv6?: boolean;
};

/**
 * Defines internal IP address configuration.
 */
export type InternalIpConfig = {
  readonly subnet: string;
  readonly ipv6?: boolean;
};
