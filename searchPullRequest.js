const { Octokit } = require('@octokit/rest');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const argv = yargs(hideBin(process.argv))
  .option('ownerRepo', {
    alias: 'o',
    type: 'string',
    description: 'Repository owner and repo',
    demandOption: true
  })
  .option('commit', {
    alias: 'c',
    type: 'string',
    description: 'Commit SHA',
    demandOption: true
  })
  .option('full', {
    alias: 'f',
    type: 'boolean',
    description: 'Print full result'
  })
  .argv;

async function searchPullRequestWithCommit(ownerRepo, commitSha) {
  try {
    const result = await octokit.rest.search.issuesAndPullRequests({
      q: `${commitSha} type:pr is:open repo:${ownerRepo}`,
    });

    return result.data.items.map(item => ({ number: item.number, title: item.title, updated_at: item.updated_at }));
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

function findMostRecent(items) {
  return items.reduce((mostRecentItem, currentItem) => {
    const mostRecentDate = new Date(mostRecentItem.updated_at);
    const currentDate = new Date(currentItem.updated_at);

    return currentDate > mostRecentDate ? currentItem : mostRecentItem;
  }).number; 
}

searchPullRequestWithCommit(argv.ownerRepo, argv.commit)
  .then(items => {
    if (argv.full) {
      console.log(items); // Print full result if --full switch is present
    } else {
      const mostRecentNumber = findMostRecent(items);
      console.log(mostRecentNumber);
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });

// $ node searchPullRequest.js --ownerRepo=land-of-apps/rails-7-app --commit=9e4e7eb0a980fb9c5eb24721c5aefd72aed9014e --full
// [
//   {
//     number: 18,
//     title: 'Test 2 PRs with the same commit',
//     updated_at: '2023-12-13T17:23:19Z'
//   },
//   {
//     number: 14,
//     title: 'Fix N+1 query with builds on CircleCI',
//     updated_at: '2023-12-11T17:48:58Z'
//   }
// ]

// $ node searchPullRequest.js --ownerRepo=land-of-apps/rails-7-app --commit=9e4e7eb0a980fb9c5eb24721c5aefd72aed9014e
// 18