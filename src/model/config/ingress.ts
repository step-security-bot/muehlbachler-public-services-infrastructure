import { StringMap } from '../map';

/**
 * Defines ingress configuration.
 */
export type IngressConfig = {
  readonly service: StringMap<IngressServiceConfig>;
};

/**
 * Defines ingress service configuration.
 */
export type IngressServiceConfig = {
  readonly port: number;
  readonly exposed?: boolean;
  readonly target?: IngressServiceTargetConfig;
};

/**
 * Defines ingress service target configuration.
 */
export type IngressServiceTargetConfig = {
  readonly port: number;
  readonly service: string;
};
