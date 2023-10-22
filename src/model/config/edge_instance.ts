/**
 * Defines edge instance configuration.
 */
export type EdgeInstanceConfig = {
  readonly zone: string;
  readonly machineType: string;
  readonly sourceImage: string;
  readonly diskSize: number;
  readonly hostname?: string;
  readonly network: EdgeInstanceNetworkConfig;
};

/**
 * Defines edge instance configuration.
 */
export type EdgeInstanceNetworkConfig = {
  readonly subnet: string;
  readonly externalIp: string;
  readonly ptrRecords: boolean;
};
