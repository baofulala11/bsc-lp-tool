'use client';

import { useState } from 'react';
import { Loader2, Search, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';

interface PoolData {
  address: string;
  platform: string;
  pair: string;
  version: string;
  priceUsd: number;
  volume24h: number;
  liquidityUsd: number;
  url: string;
  baseToken: { symbol: string; address: string };
  quoteToken: { symbol: string; address: string };
}

export default function LiquidityAnalyzer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setPools([]);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: input.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '查询失败');
      }

      setPools(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '查询出错，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-8 min-h-screen">
      <div className="flex flex-col gap-6 text-center py-10">
        <h1 className="text-4xl font-bold tracking-tight">DeFi 流动性透视镜</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          输入代币合约地址，一键透视全网流动性分布。实时追踪价格、TVL 与交易热度。
        </p>
        
        <div className="flex gap-2 max-w-2xl w-full mx-auto relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="输入代币合约地址 (例如 0x...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-md active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : "透视分析"}
          </button>
        </div>
        
        {error && (
          <div className="mx-auto p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {pools.map((pool, idx) => (
          <div 
            key={pool.address} 
            className="group relative border rounded-xl bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/20"
          >
            <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
              
              {/* 左侧：核心信息 */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {pool.platform.charAt(0).toUpperCase() + pool.platform.slice(1)}
                    <span className="text-muted-foreground font-normal text-base">/</span>
                    <span className="font-mono">{pool.pair}</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    pool.version === 'V3' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                  }`}>
                    {pool.version}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded select-all hover:bg-muted transition-colors cursor-pointer" title="点击复制">
                    {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <a 
                    href={pool.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    DexScreener <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 右侧：数据卡片 */}
              <div className="grid grid-cols-3 gap-4 md:gap-12 w-full md:w-auto">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">当前价格</div>
                  <div className="font-mono font-bold text-lg tabular-nums">
                    ${pool.priceUsd < 0.01 ? pool.priceUsd.toExponential(4) : pool.priceUsd.toFixed(4)}
                  </div>
                </div>
                <div className="text-right border-l pl-4 md:pl-12 border-border/50">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">24h 交易量</div>
                  <div className="font-mono font-medium text-lg tabular-nums">
                    ${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="text-right border-l pl-4 md:pl-12 border-border/50">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">总流动性 (TVL)</div>
                  <div className="font-mono font-bold text-lg tabular-nums text-green-600 dark:text-green-400">
                    ${pool.liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
