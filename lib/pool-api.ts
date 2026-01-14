import { GraphQLClient, gql } from 'graphql-request';
import Decimal from 'decimal.js';

export interface PoolData {
  address: string;
  platform: string;
  pair: string;
  feeTier: number;
  token0: { symbol: string; decimals: number; address: string };
  token1: { symbol: string; decimals: number; address: string };
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
}

export interface LPPosition {
  id: string;
  owner: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  minPrice: string;
  maxPrice: string;
  inRange: boolean;
  collectedFeesToken0: number;
  collectedFeesToken1: number;
}

const SUBGRAPHS: Record<string, string> = {
  pancakeswap: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
  uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-bsc',
  sushiswap: 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-bsc',
};

export async function fetchTokenPools(tokenAddress: string): Promise<PoolData[]> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
  const data = await res.json();
  
  if (!data.pairs) return [];

  return data.pairs
    .filter((p: any) => p.labels?.includes('v3'))
    .map((p: any) => ({
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
    .sort((a: any, b: any) => b.liquidityUsd - a.liquidityUsd)
    .slice(0, 5);
}

export async function fetchTopPositions(pool: PoolData): Promise<LPPosition[]> {
  const endpoint = SUBGRAPHS[pool.platform];
  if (!endpoint) return [];

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
    const data: any = await client.request(query, { poolAddr: pool.address.toLowerCase() });
    if (!data.pool) return [];

    const currentTick = Number(data.pool.tick);
    const decimal0 = Number(data.pool.token0.decimals);
    const decimal1 = Number(data.pool.token1.decimals);
    
    return data.positions.map((pos: any) => {
      const tickLower = Number(pos.tickLower.tickIdx);
      const tickUpper = Number(pos.tickUpper.tickIdx);
      
      const getPrice = (tick: number) => {
        return new Decimal(1.0001).pow(tick)
          .mul(new Decimal(10).pow(decimal0 - decimal1))
          .toDecimalPlaces(6)
          .toString();
      };

      return {
        id: pos.id,
        owner: pos.owner,
        tickLower,
        tickUpper,
        liquidity: pos.liquidity,
        minPrice: getPrice(tickLower),
        maxPrice: getPrice(tickUpper),
        inRange: currentTick >= tickLower && currentTick <= tickUpper,
        collectedFeesToken0: parseFloat(pos.collectedFeesToken0),
        collectedFeesToken1: parseFloat(pos.collectedFeesToken1),
      };
    });
  } catch (e) {
    console.error(`Failed to fetch positions for ${pool.address}`, e);
    return [];
  }
}
