import { Output } from '@pulumi/pulumi';

import { NetworkData } from '../../../model/network';
import { environment, globalName, ingressConfig } from '../../configuration';
import { createRandomPassword } from '../../util/random';
import { writeFilePulumiAndUploadToS3 } from '../../util/storage';
import { renderTemplate } from '../../util/template';
import { createEdgeInstanceFirewalls } from '../network/firewall';

import { createEdgeInstance } from './instance';

/**
 * Creates an edge resources.
 *
 * @param {NetworkData} network the network
 */
export const createEdgeResources = (network: NetworkData) => {
  const haproxyConfig = writeFilePulumiAndUploadToS3(
    'haproxy.cfg',
    Output.create(
      renderTemplate('./assets/edge/haproxy.cfg.j2', {
        proxies: Object.entries(ingressConfig.service)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, config]) => config.target != undefined)
          .map(([name, config]) => ({
            name: name,
            port: config.port,
            target: `${config.target?.service}.svc.${environment}.${globalName}.cluster:${config.target?.port}`,
          })),
      }),
    ),
    {
      s3SubPath: 'haproxy/',
    },
  );

  const statsPassword = createRandomPassword('haproxy-stats-password', {
    special: false,
  });
  createEdgeInstance(network, statsPassword.password, haproxyConfig);
  createEdgeInstanceFirewalls(network);
};
