'use client';

import { useState } from 'react';
import { Loader2, Search, AlertCircle, ExternalLink, Activity, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

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

// 格式化价格，不使用科学计数法
const formatPrice = (price: number) => {
  if (price === 0) return '0';
  if (price < 0.000001) return price.toFixed(10).replace(/\.?0+$/, '');
  if (price < 0.01) return price.toFixed(8).replace(/\.?0+$/, '');
  return price.toFixed(4);
};

// 计算做市范围
const calculateRanges = (price: number) => {
  return [
    { label: '激进 (Aggressive)', desc: '高收益 / 高风险', range: '±10%', min: price * 0.90, max: price * 1.10, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', icon: Zap },
    { label: '稳健 (Balanced)', desc: '平衡策略', range: '±20%', min: price * 0.80, max: price * 1.20, color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10', icon: Activity },
    { label: '保守 (Conservative)', desc: '低风险 / 长期持有', range: '±50%', min: price * 0.50, max: price * 1.50, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', icon: ShieldCheck },
  ];
};

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
    <div className="container mx-auto max-w-6xl p-6 space-y-12 min-h-screen">
      {/* 头部区域 */}
      <div className="flex flex-col gap-8 text-center py-16 relative">
        {/* 背景光效 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight glow-text text-white relative z-10">
          DeFi 流动性透视镜
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto relative z-10">
          输入代币合约地址，一键透视全网流动性分布。
          <br />实时追踪价格、TVL 与智能做市范围推荐。
        </p>
        
        <div className="flex gap-3 max-w-2xl w-full mx-auto relative z-10 mt-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="输入代币合约地址 (例如 0x...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="w-full pl-12 pr-4 py-4 rounded-xl tech-input shadow-lg text-lg"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : "开始扫描"}
          </button>
        </div>
        
        {error && (
          <div className="mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* 结果列表 */}
      <div className="grid gap-8">
        {pools.map((pool, idx) => {
          const ranges = calculateRanges(pool.priceUsd);
          
          return (
            <div 
              key={pool.address} 
              className="glass-card rounded-2xl p-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="bg-slate-950/40 p-6 md:p-8 rounded-xl backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row gap-8">
                  
                  {/* 左侧：核心信息 */}
                  <div className="space-y-6 lg:w-[35%] border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold text-sm border border-primary/20">
                          #{idx + 1}
                        </div>
                        <h3 className="text-2xl font-bold flex items-center gap-2 text-white">
                          {pool.platform.charAt(0).toUpperCase() + pool.platform.slice(1)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          pool.version === 'V3' 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}>
                          {pool.version}
                        </span>
                      </div>
                      <a 
                        href={pool.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                        title="在 DexScreener 查看"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                    
                    <div className="font-mono text-lg text-slate-300 flex items-center gap-2">
                      <span className="text-primary">{pool.baseToken.symbol}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-white">{pool.quoteToken.symbol}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">24h Volume</div>
                        <div className="font-mono font-medium text-lg text-slate-200">
                          ${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Total Liquidity</div>
                        <div className="font-mono font-medium text-lg text-emerald-400">
                          ${pool.liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="text-xs text-slate-500 mb-2">当前价格 (USD)</div>
                      <div className="font-mono text-3xl font-bold text-white tracking-tight glow-text break-all">
                        ${formatPrice(pool.priceUsd)}
                      </div>
                    </div>
                  </div>

                  {/* 右侧：智能 LP 策略 */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-white text-lg">智能 LP 价格范围推荐</h4>
                      <span className="text-xs text-slate-500 ml-auto">基于当前价格计算</span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      {ranges.map((range, i) => (
                        <div key={i} className={`relative group p-4 rounded-xl border ${range.border} ${range.bg} transition-all hover:scale-[1.02]`}>
                          <div className="flex items-center gap-2 mb-3">
                            <range.icon className={`w-4 h-4 ${range.color}`} />
                            <span className={`font-bold text-sm ${range.color}`}>{range.label}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Min Price</div>
                              <div className="font-mono text-sm text-white font-medium">{formatPrice(range.min)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Max Price</div>
                              <div className="font-mono text-sm text-white font-medium">{formatPrice(range.max)}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                            <span className="text-slate-400">{range.desc}</span>
                            <span className="font-mono bg-black/20 px-1.5 py-0.5 rounded">{range.range}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-slate-500 mt-4 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                      <span className="font-bold text-slate-400">💡 提示：</span>
                      价格范围越窄，赚取的费率倍数越高，但更容易超出区间停止收益（无常损失风险更大）。建议根据您对币价波动的预期选择策略。
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
