'use client';

import { useState } from 'react';
import { fetchTokenPools, fetchTopPositions, PoolData, LPPosition } from '@/lib/pool-api';
import { Loader2, Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function LiquidityAnalyzer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<{ pool: PoolData; positions: LPPosition[] }[]>([]);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setPools([]);

    try {
      const poolList = await fetchTokenPools(input.trim());
      
      if (poolList.length === 0) {
        setError('未找到该代币的 V3 流动性池。请确认合约地址正确且存在 V3 流动性。');
        setLoading(false);
        return;
      }

      const results = await Promise.all(
        poolList.map(async (pool) => {
          const positions = await fetchTopPositions(pool);
          return { pool, positions };
        })
      );

      setPools(results.filter(r => r.positions.length > 0));
    } catch (err) {
      console.error(err);
      setError('查询出错，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">V3 流动性透视镜</h1>
        <p className="text-muted-foreground">
          输入代币合约，一键查看各大 DEX 的 V3 流动性分布、大户持仓范围及累计收益。
        </p>
        
        <div className="flex gap-2 max-w-2xl">
          <input
            type="text"
            placeholder="输入代币合约地址 (例如 0x...)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 rounded-lg border bg-background"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
            开始分析
          </button>
        </div>
        
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {pools.map(({ pool, positions }) => (
          <div key={pool.address} className="border rounded-xl bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between mb-6 pb-4 border-b gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold">{pool.platform.toUpperCase()}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-muted font-mono">{pool.pair}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">V3</span>
                </div>
                <div className="text-sm text-muted-foreground font-mono">{pool.address}</div>
              </div>
              
              <div className="flex gap-6 text-sm">
                <div className="text-right">
                  <div className="text-muted-foreground">当前价格</div>
                  <div className="font-mono font-bold">${pool.priceUsd.toFixed(4)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">24h 交易量</div>
                  <div className="font-mono font-medium">${pool.volume24h.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">池子总流动性</div>
                  <div className="font-mono font-medium">${pool.liquidityUsd.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground bg-muted/30">
                  <tr>
                    <th className="p-3 text-left">排名</th>
                    <th className="p-3 text-left">LP 头寸范围 (Min - Max)</th>
                    <th className="p-3 text-center">状态</th>
                    <th className="p-3 text-right">流动性份额</th>
                    <th className="p-3 text-right">已赚取手续费 (累计)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {positions.map((pos, idx) => (
                    <tr key={pos.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-mono text-muted-foreground">#{idx + 1}</td>
                      <td className="p-3 font-mono">
                        {parseFloat(pos.minPrice).toPrecision(6)} - {parseFloat(pos.maxPrice).toPrecision(6)}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ID: {pos.id}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {pos.inRange ? (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" /> 激活中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs font-medium">
                            <XCircle className="w-3 h-3" /> 超出范围
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <div className="w-24 h-2 bg-muted rounded-full ml-auto overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${Math.min(100, (parseInt(pos.liquidity) / parseInt(positions[0].liquidity)) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono">
                        <div className="flex flex-col">
                          <span>{pos.collectedFeesToken0.toFixed(2)} {pool.token0.symbol}</span>
                          <span>+ {pos.collectedFeesToken1.toFixed(2)} {pool.token1.symbol}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
