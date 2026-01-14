'use client';

import { useState } from 'react';
import { Loader2, Search, AlertCircle, ExternalLink, Activity, ShieldCheck, Zap, TrendingUp, Calculator, Wallet } from 'lucide-react';

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
const formatPrice = (price: number | string | undefined | null) => {
  const p = Number(price);
  if (!p || isNaN(p) || p === 0) return '0.00';
  if (p < 0.000001) return p.toFixed(10).replace(/\.?0+$/, '');
  if (p < 0.01) return p.toFixed(8).replace(/\.?0+$/, '');
  return p.toFixed(4);
};

// 计算做市范围
const calculateRanges = (price: number | undefined | null) => {
  const p = price || 0;
  if (p === 0) return [];
  
  return [
    { label: '激进策略 (Narrow)', desc: '高收益 / 高风险', range: '±10%', min: p * 0.90, max: p * 1.10, color: 'text-red-600', border: 'border-red-600', bg: 'bg-white/80', icon: Zap },
    { label: '稳健策略 (Medium)', desc: '平衡收益与风险', range: '±20%', min: p * 0.80, max: p * 1.20, color: 'text-blue-600', border: 'border-blue-600', bg: 'bg-white/80', icon: Activity },
    { label: '保守策略 (Wide)', desc: '低风险 / 长期持有', range: '±50%', min: p * 0.50, max: p * 1.50, color: 'text-green-600', border: 'border-green-600', bg: 'bg-white/80', icon: ShieldCheck },
  ];
};

export default function LiquidityAnalyzer() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  
  // LP ID 查询状态
  const [lpId, setLpId] = useState('');
  const [lpResult, setLpResult] = useState<any>(null);
  const [lpLoading, setLpLoading] = useState(false);
  const [lpError, setLpError] = useState('');

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setPools([]);
    setLpResult(null); // 清除 LP 结果
    setSearched(true);

    try {
      // 检查输入是否为纯数字 (Token ID)
      if (/^\d+$/.test(input.trim())) {
        await handleLpSearch(input.trim());
        setLoading(false);
        return;
      }

      // 否则按合约地址查询
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

  const handleLpSearch = async (id: string) => {
    setLpLoading(true);
    setLpError('');
    setLpResult(null);
    setPools([]); // 清除池子结果

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'position', tokenId: id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '查询失败');
      setLpResult(data);
    } catch (err: any) {
      setLpError(err.message || '查询 LP 失败');
      setError(err.message); // 显示在主错误区
    } finally {
      setLpLoading(false);
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
              placeholder="输入代币合约地址 (例如 0x...) 或 LP Token ID (数字)"
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
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "立即扫描!"}
          </button>
        </div>
        
        {error && (
          <div className="mx-auto p-4 bg-red-100 border-2 border-red-600 text-red-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
            <AlertCircle className="w-6 h-6" />
            {error}
          </div>
        )}
      </div>

      {/* LP ID 查询结果 */}
      {lpResult && (
        <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto border-4 border-black bg-yellow-50">
          <div className="flex items-center gap-4 mb-6 border-b-2 border-black pb-4">
            <div className="p-3 bg-black text-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-black">LP 头寸详情 #{lpResult.tokenId}</h2>
              <p className="text-gray-600 font-bold">{lpResult.token0.symbol} / {lpResult.token1.symbol} (Fee: {lpResult.feeTier / 10000}%)</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <h3 className="text-sm font-black uppercase text-gray-500 mb-2">价格区间 (Price Range)</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-600">Min Price:</span>
                    <span className="font-mono text-xl font-black text-black">{formatPrice(lpResult.minPrice)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-full animate-pulse" />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-600">Max Price:</span>
                    <span className="font-mono text-xl font-black text-black">{formatPrice(lpResult.maxPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                <h3 className="text-sm font-black uppercase text-gray-500 mb-2">未领取收益 (Unclaimed Fees)</h3>
                <div className="space-y-1 font-mono font-bold">
                  <div className="flex justify-between">
                    <span>{lpResult.token0.symbol}:</span>
                    <span className="text-green-600">+{parseFloat(lpResult.fees0).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lpResult.token1.symbol}:</span>
                    <span className="text-green-600">+{parseFloat(lpResult.fees1).toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/5 p-6 rounded-xl border-2 border-black/10 flex flex-col justify-center">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> 头寸状态
              </h3>
              <div className="space-y-4 text-sm font-medium">
                <p>Tick Lower: <span className="font-mono bg-white px-2 border border-black">{lpResult.tickLower}</span></p>
                <p>Tick Upper: <span className="font-mono bg-white px-2 border border-black">{lpResult.tickUpper}</span></p>
                <p>Liquidity: <span className="font-mono text-xs break-all text-gray-600">{lpResult.liquidity}</span></p>
                
                <div className="mt-4 p-4 bg-yellow-100 border-2 border-yellow-400 text-yellow-800 text-xs">
                  💡 此数据直接读取自 BSC 链上合约 (PancakeSwap V3 NFT Manager)。如果价格显示异常，可能是因为代币顺序反转，请手动倒数 (1/Price)。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 池子列表结果 (原有逻辑) */}
      <div className="grid gap-8 pb-20">
        {searched && !loading && pools.length === 0 && !lpResult && !error && !lpError && (
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
                      title="在 DexScreener 查看详情"
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
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">24H 交易量</div>
                      <div className="font-mono font-bold text-lg text-black">
                        ${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">总流动性 (TVL)</div>
                      <div className="font-mono font-bold text-lg text-green-600">
                        ${pool.liquidityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-xs text-black mb-2 font-black uppercase">当前价格 (USD)</div>
                    <div className="font-mono text-3xl md:text-4xl font-black text-black tracking-tight break-all bg-yellow-100 border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      ${formatPrice(pool.priceUsd)}
                    </div>
                  </div>
                </div>

                {/* 右侧：智能 LP 策略 */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-6 h-6 text-black" />
                    <h4 className="font-black text-black text-xl uppercase">做市区间参考 (LP Range)</h4>
                  </div>

                  {ranges.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4">
                      {ranges.map((range, i) => (
                        <div key={i} className={`relative group p-4 border-2 ${range.border} ${range.bg} transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]`}>
                          <div className="flex items-center gap-2 mb-3">
                            <range.icon className={`w-5 h-5 ${range.color}`} />
                            <span className={`font-black text-sm ${range.color} uppercase`}>{range.label.split(' ')[0]}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-bold">最低价 (Min)</div>
                              <div className="font-mono text-sm text-black font-bold bg-white/50 px-1">{formatPrice(range.min)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 font-bold">最高价 (Max)</div>
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
                    <div className="text-gray-500 italic bg-gray-100 p-4 border-2 border-gray-300">无法获取价格，暂无参考数据</div>
                  )}
                  
                  {/* 替换"聪哥说" 为技术说明 */}
                  <div className="mt-4 bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-2 border-b-2 border-black pb-1">
                      <Calculator className="w-4 h-4" />
                      <h5 className="font-black text-black text-sm uppercase">区间计算公式 (Calculation)</h5>
                    </div>
                    <ul className="text-xs text-black space-y-1 font-mono">
                      <li className="flex justify-between items-center">
                        <span className="text-gray-600">当前 Tick (预估):</span>
                        <span className="font-bold bg-gray-100 px-1">{pool.priceUsd ? Math.floor(Math.log(pool.priceUsd) / Math.log(1.0001)) : 'N/A'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Min Price:</span>
                        <span>1.0001 ^ (Tick - Range)</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Max Price:</span>
                        <span>1.0001 ^ (Tick + Range)</span>
                      </li>
                    </ul>
                    <div className="mt-2 text-[10px] text-gray-500 italic pt-1">
                      * 数据基于当前价格模拟。要查询具体头寸，请在上方输入 Token ID。
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
