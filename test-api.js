const { GraphQLClient, gql } = require('graphql-request');
const Decimal = require('decimal.js');

const SUBGRAPHS = {
  pancakeswap: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
  uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-bsc',
  sushiswap: 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-bsc',
};

async function fetchTokenPools(tokenAddress) {
  console.log(`Fetching pools for ${tokenAddress}...`);
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
  const data = await res.json();
  
  if (!data.pairs) {
    console.log('No pairs found in DexScreener response');
    return [];
  }

  console.log(`Found ${data.pairs.length} pairs total.`);
  
  const v3Pairs = data.pairs.filter(p => p.labels && p.labels.includes('v3'));
  console.log(`Found ${v3Pairs.length} V3 pairs.`);

  if (v3Pairs.length > 0) {
    console.log('Sample pair data:', JSON.stringify(v3Pairs[0], null, 2));
  }

  return v3Pairs
    .map(p => ({
      address: p.pairAddress,
      platform: p.dexId,
      pair: `${p.baseToken.symbol}/${p.quoteToken.symbol}`,
      feeTier: 0,
      token0: p.baseToken,
      token1: p.quoteToken,
      priceUsd: parseFloat(p.priceUsd),
      volume24h: p.volume?.h24 || 0,
      liquidityUsd: p.liquidity?.usd || 0,
    }))
    .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
    .slice(0, 5);
}

async function fetchTopPositions(pool) {
  console.log(`Fetching positions for pool ${pool.address} (${pool.platform})...`);
  const endpoint = SUBGRAPHS[pool.platform];
  if (!endpoint) {
    console.log(`Skipping unsupported platform: ${pool.platform}`);
    return [];
  }

  const client = new GraphQLClient(endpoint);
  const query = gql`
    query ($poolAddr: String!) {
      pool(id: $poolAddr) {
        tick
        token0 { symbol decimals } 
        token1 { symbol decimals }
        feeTier
      }
      positions(
        first: 10
        where: { pool: $poolAddr, liquidity_gt: 0 }
        orderBy: liquidity
        orderDirection: desc
      ) {
        id
        owner
        tickLower { tickIdx }
        tickUpper { tickIdx }
        liquidity
        collectedFeesToken0
        collectedFeesToken1
      }
    }
  `;

  try {
    const data = await client.request(query, { poolAddr: pool.address.toLowerCase() });
    if (!data.pool) {
      console.log('Pool not found in Subgraph');
      return [];
    }
    console.log(`Found ${data.positions.length} positions.`);
    return data.positions;
  } catch (e) {
    console.error(`Failed to fetch positions:`, e.message);
    return [];
  }
}

async function run() {
  // USDT Address
  const pools = await fetchTokenPools('0x55d398326f99059fF775485246999027B3197955');
  
  for (const pool of pools) {
    await fetchTopPositions(pool);
  }
}

run();
