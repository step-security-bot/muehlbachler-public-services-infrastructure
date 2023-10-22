import { StringMap } from '../map';

/**
 * Defines database configuration.
 */
export type DatabaseConfig = {
  readonly users: readonly string[];
  readonly database: StringMap<string>;
};
