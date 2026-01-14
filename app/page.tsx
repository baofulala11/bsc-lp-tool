'use client';

import { useState } from 'react';
import { Loader2, Search, AlertCircle, ExternalLink, Activity, ShieldCheck, Zap, TrendingUp } from 'lucide-react';

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

// 格式化价格，增加容错
const formatPrice = (price: number | undefined | null) => {
  if (!price || isNaN(price) || price === 0) return '0.00';
  if (price < 0.000001) return price.toFixed(10).replace(/\.?0+$/, '');
  if (price < 0.01) return price.toFixed(8).replace(/\.?0+$/, '');
  return price.toFixed(4);
};

// 计算做市范围，增加容错
const calculateRanges = (price: number | undefined | null) => {
  const p = price || 0;
  if (p === 0) return [];
  
  return [
    { label: '激进 (Aggressive)', desc: '高收益 / 高风险', range: '±10%', min: p * 0.90, max: p * 1.10, color: 'text-red-600', border: 'border-red-600', bg: 'bg-white/80', icon: Zap },
    { label: '稳健 (Balanced)', desc: '平衡策略', range: '±20%', min: p * 0.80, max: p * 1.20, color: 'text-blue-600', border: 'border-blue-600', bg: 'bg-white/80', icon: Activity },
    { label: '保守 (Conservative)', desc: '低风险 / 长期持有', range: '±50%', min: p * 0.50, max: p * 1.50, color: 'text-green-600', border: 'border-green-600', bg: 'bg-white/80', icon: ShieldCheck },
  ];
};

export default function LiquidityAnalyzer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setPools([]);
    setSearched(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress: input.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '查询失败，请检查合约地址是否正确');
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('未找到该代币的流动性池数据');
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
    <div className="container mx-auto max-w-6xl p-6 space-y-12 min-h-screen relative z-10">
      {/* 头部区域 */}
      <div className="flex flex-col gap-6 text-center py-12 relative items-center">
        {/* LOGO: Satoshi */}
        <div className="w-32 h-32 md:w-40 md:h-40 relative animate-bounce-slow">
           <img 
             src="https://img.icons8.com/color/480/satoshi-nakamoto.png" 
             alt="Satoshi Logo" 
             className="w-full h-full object-cover rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white"
           />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight glow-text text-white drop-shadow-lg uppercase" style={{ fontFamily: '"Courier New", monospace' }}>
          SATOSHI LP TOOL
        </h1>
        <p className="text-black bg-white font-bold text-xl md:text-2xl max-w-2xl mx-auto px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          DeFi 流动性透视镜 · 智能做市助手
        </p>
        
        <div className="flex gap-3 max-w-2xl w-full mx-auto mt-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-4 h-6 w-6 text-black transition-colors" />
            <input
              type="text"
              placeholder="输入代币合约地址 (例如 0x...)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="w-full pl-14 pr-4 py-4 rounded-none tech-input text-xl font-bold"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input}
            className="px-8 py-3 comic-btn rounded-none text-xl flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "SCAN NOW!"}
          </button>
        </div>
        
        {error && (
          <div className="mx-auto p-4 bg-red-100 border-2 border-red-600 text-red-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
            <AlertCircle className="w-6 h-6" />
            {error}
          </div>
        )}
      </div>

      {/* 结果列表 */}
      <div className="grid gap-8 pb-20">
        {searched && !loading && pools.length === 0 && !error && (
            <div className="text-center text-black bg-white border-2 border-black p-8 font-bold text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                暂无数据，请尝试其他合约地址
            </div>
        )}

        {pools.map((pool, idx) => {
          const ranges = calculateRanges(pool.priceUsd);
          
          return (
            <div 
              key={pool.address} 
              className="glass-card p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* 左侧：核心信息 */}
                <div className="space-y-6 lg:w-[35%] border-b lg:border-b-0 lg:border-r border-black/20 pb-6 lg:pb-0 lg:pr-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-black text-white font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        #{idx + 1}
                      </div>
                      <h3 className="text-2xl font-black flex items-center gap-2 text-black">
                        {pool.platform.toUpperCase()}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-black tracking-wide border-2 border-black ${
                        pool.version === 'V3' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {pool.version}
                      </span>
                    </div>
                    <a 
                      href={pool.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors text-black"
                      title="在 DexScreener 查看"
                    >
                      <ExternalLink className="w-6 h-6" />
                    </a>
                  </div>
                  
                  <div className="font-mono text-xl text-black flex items-center gap-2 font-bold">
                    <span className="bg-yellow-300 px-1">{pool.baseToken.symbol}</span>
                    <span className="text-gray-500">/</span>
                    <span className="bg-gray-200 px-1">{pool.quoteToken.symbol}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">24h Volume</div>
                      <div className="font-mono font-bold text-lg text-black">
                        ${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Liquidity</div>
                      <div className="font-mono font-bold text-lg text-green-600">
                        ${pool.liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-xs text-black mb-2 font-black uppercase">Current Price (USD)</div>
                    <div className="font-mono text-3xl md:text-4xl font-black text-black tracking-tight break-all bg-yellow-100 border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      ${formatPrice(pool.priceUsd)}
                    </div>
                  </div>
                </div>

                {/* 右侧：智能 LP 策略 */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-6 h-6 text-black" />
                    <h4 className="font-black text-black text-xl uppercase">Smart LP Strategy</h4>
                  </div>

                  {ranges.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4">
                      {ranges.map((range, i) => (
                        <div key={i} className={`relative group p-4 border-2 ${range.border} ${range.bg} transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]`}>
                          <div className="flex items-center gap-2 mb-3">
                            <range.icon className={`w-5 h-5 ${range.color}`} />
                            <span className={`font-black text-sm ${range.color} uppercase`}>{range.label}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-bold">Min Price</div>
                              <div className="font-mono text-sm text-black font-bold bg-white/50 px-1">{formatPrice(range.min)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-bold">Max Price</div>
                              <div className="font-mono text-sm text-black font-bold bg-white/50 px-1">{formatPrice(range.max)}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-black/10 flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-600">{range.desc}</span>
                            <span className="font-mono bg-black text-white px-2 py-1">{range.range}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 italic bg-gray-100 p-4 border-2 border-gray-300">Price data unavailable for strategy calculation</div>
                  )}
                  
                  <div className="text-xs text-black mt-4 bg-white p-4 border-2 border-black font-medium leading-relaxed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-black text-black text-sm block mb-1">💡 SATOSHI SAYS:</span>
                    "Narrow ranges multiply fees but risk divergence loss. Choose your strategy based on volatility expectations."
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
