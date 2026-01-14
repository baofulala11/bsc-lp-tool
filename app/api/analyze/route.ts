import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import Decimal from 'decimal.js';

// PancakeSwap V3 NFT Manager Address (BSC)
const NFT_MANAGER_ADDRESS = '0x46A15B0b27311cedF172AB29E4f4766fbe7f4364';
const RPC_URL = 'https://bsc-dataseed.binance.org/';

const NFT_ABI = [
  'function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'function tokenURI(uint256 tokenId) view returns (string memory)'
];

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

async function fetchTokenPools(tokenAddress: string) {
  // DexScreener Logic (保持不变)
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
  const data = await res.json();
  if (!data.pairs) return [];
  
  return data.pairs
    .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
    .slice(0, 5)
    .map((p: any) => ({
      address: p.pairAddress,
      platform: p.dexId,
      pair: `${p.baseToken.symbol}/${p.quoteToken.symbol}`,
      version: p.labels?.includes('v3') ? 'V3' : 'V2',
      priceUsd: parseFloat(p.priceUsd),
      volume24h: p.volume?.h24 || 0,
      liquidityUsd: p.liquidity?.usd || 0,
      url: p.url,
      baseToken: p.baseToken,
      quoteToken: p.quoteToken
    }));
}

async function fetchPositionDetails(tokenId: string) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const nftManager = new ethers.Contract(NFT_MANAGER_ADDRESS, NFT_ABI, provider);
    
    // 1. 查询头寸基础信息
    const pos = await nftManager.positions(tokenId);
    
    // 2. 查询代币精度 (为了计算真实价格)
    const token0Contract = new ethers.Contract(pos.token0, ERC20_ABI, provider);
    const token1Contract = new ethers.Contract(pos.token1, ERC20_ABI, provider);
    
    const [decimals0, decimals1, symbol0, symbol1] = await Promise.all([
      token0Contract.decimals(),
      token1Contract.decimals(),
      token0Contract.symbol(),
      token1Contract.symbol()
    ]);

    // 3. 计算价格
    const getPrice = (tick: number) => {
      return new Decimal(1.0001).pow(tick)
        .mul(new Decimal(10).pow(decimals0 - decimals1))
        .toDecimalPlaces(6)
        .toString();
    };

    return {
      tokenId,
      token0: { address: pos.token0, symbol: symbol0, decimals: decimals0 },
      token1: { address: pos.token1, symbol: symbol1, decimals: decimals1 },
      feeTier: pos.fee,
      tickLower: pos.tickLower,
      tickUpper: pos.tickUpper,
      liquidity: pos.liquidity.toString(),
      minPrice: getPrice(pos.tickLower),
      maxPrice: getPrice(pos.tickUpper),
      // 这里的 tokensOwed 是未领取的，不包含还在流动性里的
      fees0: ethers.utils.formatUnits(pos.tokensOwed0, decimals0),
      fees1: ethers.utils.formatUnits(pos.tokensOwed1, decimals1),
    };
  } catch (error: any) {
    console.error('Position fetch error:', error);
    throw new Error('无法查询该 Token ID，请确认它是 BSC 上的 PancakeSwap V3 头寸');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 模式 1: 查询头寸详情
    if (body.action === 'position') {
      if (!body.tokenId) return NextResponse.json({ error: 'Missing Token ID' }, { status: 400 });
      const position = await fetchPositionDetails(body.tokenId);
      return NextResponse.json(position);
    }

    // 模式 2: 查询代币池子 (默认)
    if (!body.tokenAddress) {
      return NextResponse.json({ error: 'Token address required' }, { status: 400 });
    }
    const pools = await fetchTokenPools(body.tokenAddress);
    return NextResponse.json(pools);

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
