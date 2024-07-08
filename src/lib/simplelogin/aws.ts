import * as aws from '@pulumi/aws';
import { all, Output } from '@pulumi/pulumi';

import { createAccessKey } from '../aws/iam/key';
import { createAWSUser } from '../aws/iam/user';
import { createS3Bucket } from '../aws/storage/bucket';
import { awsDefaultRegion, commonLabels, globalName } from '../configuration';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the SimpleLogin AWS resources.
 */
export const createAWSResources = (): void => {
  const region = aws.config.region ?? awsDefaultRegion;
  const bucket = createBucket();
  const key = bucket.arn.apply((arn) => createUser(arn));

  writeToVault(
    'simplelogin-aws',
    all([bucket.bucket, key.id, key.secret]).apply(
      ([bucketName, keyId, keySecret]) =>
        JSON.stringify({
          bucket: bucketName,
          access_key_id: keyId,
          secret_access_key: keySecret,
          region: region,
        }),
    ),
    `kubernetes-${globalName}-cluster`,
  );
};

/**
 * Creates the SimpleLogin AWS bucket.
 *
 * @returns {aws.s3.Bucket} the bucket
 */
const createBucket = (): aws.s3.Bucket => createS3Bucket('simplelogin');

/**
 * Creates the SimpleLogin AWS user.
 *
 * @param {string} bucketArn the ARN of the bucket to allow access to
 * @returns {Output<aws.iam.AccessKey>} the access key
 */
const createUser = (bucketArn: string): Output<aws.iam.AccessKey> => {
  const user = createAWSUser('simplelogin', {
    policies: [
      new aws.iam.Policy(
        'aws-policy-simplelogin',
        {
          policy: aws.iam
            .getPolicyDocument({
              statements: [
                {
                  effect: 'Allow',
                  actions: ['s3:*'],
                  resources: [bucketArn + '/*'],
                },
              ],
            })
            .then((doc) => doc.json),
          tags: commonLabels,
        },
        {},
      ),
    ],
  });

  return user.name.apply((name) => createAccessKey(name, user));
};
