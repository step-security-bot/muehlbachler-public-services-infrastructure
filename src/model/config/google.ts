/**
 * Defines Google encryption key configuration.
 */
export type GoogleEncryptionKeyConfig = {
  readonly location: string;
  readonly keyringId: string;
  readonly cryptoKeyId: string;
};
