import * as github from '@pulumi/github';

/**
 * Gets the GitHub repository data.
 *
 * @param {string} repository the GitHub repository
 * @returns {Promise<github.GetRepositoryResult>} the repository
 */
export const getGitHubRepository = async (
  repository: string,
): Promise<github.GetRepositoryResult> =>
  await github.getRepository({
    fullName: repository,
  });
