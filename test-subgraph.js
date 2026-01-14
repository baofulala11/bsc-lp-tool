const { request, gql } = require('graphql-request');

const ENDPOINTS = [
  'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
  'https://api.thegraph.com/subgraphs/name/messari/pancakeswap-v3-bsc',
  'https://api.studio.thegraph.com/query/45376/exchange-v3-bsc/version/latest',
  'https://graph-query.sandbox.exchange/subgraphs/name/pancakeswap/exchange-v3-bsc',
];

const query = gql`
  {
    pools(first: 1) {
      id
    }
  }
`;

async function checkEndpoints() {
  for (const url of ENDPOINTS) {
    try {
      console.log(`Testing: ${url}`);
      await request(url, query);
      console.log(`✅ Success: ${url}`);
      return url;
    } catch (e) {
      console.log(`❌ Failed: ${url} - ${e.message.slice(0, 50)}...`);
    }
  }
  return null;
}

checkEndpoints();
