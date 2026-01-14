import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { tokenAddress } = await request.json();
    if (!tokenAddress) {
      return NextResponse.json({ error: 'Token address required' }, { status: 400 });
    }

    // 1. 获取 DexScreener 数据
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await res.json();
    
    if (!data.pairs || data.pairs.length === 0) {
      return NextResponse.json({ error: 'No pools found for this token' }, { status: 404 });
    }

    // 2. 优先返回 V3 池子，如果没有则返回所有热门池子
    const pools = data.pairs
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)) // 按流动性排序
      .slice(0, 10)
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

    return NextResponse.json(pools);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
