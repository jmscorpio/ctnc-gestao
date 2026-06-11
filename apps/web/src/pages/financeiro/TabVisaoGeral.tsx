import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Resumo { receitas: number; despesas: number }
interface CategoriaResumo { nome: string; cor: string; valor: number; tipo: 'receita' | 'despesa' }
interface MesTrend { label: string; receitas: number; despesas: number }

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function TabVisaoGeral() {
  const { profile } = useAuth()
  const [mesAtual, setMesAtual] = useState(() => new Date().toISOString().slice(0, 7))
  const [resumo, setResumo] = useState<Resumo>({ receitas: 0, despesas: 0 })
  const [categorias, setCategorias] = useState<CategoriaResumo[]>([])
  const [trend, setTrend] = useState<MesTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    setLoading(true)

    const primeiroDia = mesAtual + '-01'
    const ultimoDia = new Date(mesAtual + '-28')
    ultimoDia.setMonth(ultimoDia.getMonth() + 1, 0)
    const ultimoDiaStr = ultimoDia.toISOString().slice(0, 10)

    // Tendência: últimos 6 meses
    const meses6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(mesAtual + '-01')
      d.setMonth(d.getMonth() - (5 - i))
      return d.toISOString().slice(0, 7)
    })
    const primeiroMes6 = meses6[0] + '-01'

    async function load() {
      const [{ data: lancamentos }, { data: cats }] = await Promise.all([
        supabase.from('lancamentos_financeiros')
          .select('tipo, valor, data, categoria_id')
          .eq('tenant_id', profile!.tenant_id)
          .gte('data', primeiroMes6)
          .lte('data', ultimoDiaStr),
        supabase.from('categorias_financeiras')
          .select('id, nome, cor, tipo')
          .eq('tenant_id', profile!.tenant_id)
          .eq('ativa', true),
      ])

      if (!lancamentos) { setLoading(false); return }

      // Resumo do mês atual
      const doMes = lancamentos.filter(l => l.data >= primeiroDia && l.data <= ultimoDiaStr)
      const totRec = doMes.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
      const totDesp = doMes.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
      setResumo({ receitas: totRec, despesas: totDesp })

      // Por categoria (mês atual)
      if (cats) {
        const catMap = Object.fromEntries(cats.map(c => [c.id, c]))
        const aggr: Record<string, CategoriaResumo> = {}
        for (const l of doMes) {
          const cat = l.categoria_id ? catMap[l.categoria_id] : null
          const key = l.categoria_id ?? `__${l.tipo}`
          if (!aggr[key]) {
            aggr[key] = {
              nome: cat?.nome ?? (l.tipo === 'receita' ? 'Receitas s/ categoria' : 'Despesas s/ categoria'),
              cor: cat?.cor ?? (l.tipo === 'receita' ? '#10b981' : '#ef4444'),
              valor: 0,
              tipo: l.tipo as 'receita' | 'despesa',
            }
          }
          aggr[key].valor += l.valor
        }
        setCategorias(Object.values(aggr).sort((a, b) => b.valor - a.valor))
      }

      // Tendência mensal
      const trendData = meses6.map(m => {
        const fim = new Date(m + '-28')
        fim.setMonth(fim.getMonth() + 1, 0)
        const fimStr = fim.toISOString().slice(0, 10)
        const doMesT = lancamentos.filter(l => l.data >= m + '-01' && l.data <= fimStr)
        const d = new Date(m + '-01')
        return {
          label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          receitas: doMesT.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0),
          despesas: doMesT.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0),
        }
      })
      setTrend(trendData)
      setLoading(false)
    }
    load()
  }, [profile, mesAtual])

  function mudarMes(delta: number) {
    const [ano, mes] = mesAtual.split('-').map(Number)
    const d = new Date(ano, mes - 1 + delta, 1)
    setMesAtual(d.toISOString().slice(0, 7))
  }

  const saldo = resumo.receitas - resumo.despesas
  const maxTrend = Math.max(...trend.map(t => Math.max(t.receitas, t.despesas)), 1)
  const mesLabel = new Date(mesAtual + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (loading) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      {/* Seletor de mês */}
      <div className="flex items-center gap-3">
        <button onClick={() => mudarMes(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-base font-semibold text-gray-900 capitalize w-44 text-center">{mesLabel}</span>
        <button
          onClick={() => mudarMes(1)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={mesAtual >= new Date().toISOString().slice(0, 7)}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receitas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(resumo.receitas)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-red-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(resumo.despesas)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className={saldo >= 0 ? 'text-blue-500' : 'text-orange-500'} />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{fmt(saldo)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendência */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendência — últimos 6 meses</h3>
          <div className="flex items-end gap-3 h-36">
            {trend.map(t => (
              <div key={t.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 w-full">
                  <div
                    className="flex-1 bg-emerald-400 rounded-t"
                    style={{ height: `${Math.round((t.receitas / maxTrend) * 100)}px`, minHeight: '2px' }}
                    title={`Receitas: ${fmt(t.receitas)}`}
                  />
                  <div
                    className="flex-1 bg-red-400 rounded-t"
                    style={{ height: `${Math.round((t.despesas / maxTrend) * 100)}px`, minHeight: '2px' }}
                    title={`Despesas: ${fmt(t.despesas)}`}
                  />
                </div>
                <span className="text-xs text-gray-400 capitalize">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Receitas</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Despesas</span>
          </div>
        </div>

        {/* Por categoria */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Por categoria — {mesLabel}</h3>
          {categorias.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum lançamento neste mês</p>
          ) : (
            <div className="space-y-2.5">
              {categorias.slice(0, 8).map((c, i) => {
                const total = c.tipo === 'receita' ? resumo.receitas : resumo.despesas
                const pct = total > 0 ? Math.round((c.valor / total) * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: c.cor }} />
                        {c.nome}
                      </span>
                      <span className="text-gray-500 font-medium">{fmt(c.valor)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.cor }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
