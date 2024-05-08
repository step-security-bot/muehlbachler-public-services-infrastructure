/**
 * Defines network configuration.
 */
export interface NetworkConfig {
  readonly nameservers: readonly string[];
  readonly domain: string;
  readonly externalDomain: NetworkExternalDomainConfig;
  readonly ipv4: NetworkIPConfig;
  readonly ipv6: NetworkIPConfig;
}

/**
 * Defines IPv network configuration.
 */
export interface NetworkIPConfig {
  readonly enabled: boolean;
  readonly cidrMask: string;
  readonly gateway: string;
  readonly external: string;
}

/**
 * Defines external domain configuration.
 */
export interface NetworkExternalDomainConfig {
  readonly domain: string;
  readonly zoneId: string;
}
