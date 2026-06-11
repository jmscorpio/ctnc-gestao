import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, UserCheck, UserMinus, BedDouble,
  CalendarCheck, Activity, AlertTriangle, ArrowRight,
  TrendingUp, TrendingDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Stats {
  ativos: number; altas: number; desligados: number; total: number
}
interface VisitaHoje {
  id: string; visitante_nome: string; acolhido_nome: string; hora_prevista: string | null; status: string
}
interface AcolhidoRecente {
  id: string; nome: string; numero_prontuario: string; data_acolhimento: string; status: string
}
interface Intercorrencia {
  id: string; tipo: string; gravidade: string; acolhido_nome: string; data_ocorrencia: string
}
interface MesOcupacao { mes: string; label: string; ativos: number }

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: typeof Users; label: string; value: number; color: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo', alta: 'Alta', desligado: 'Desligado', transferido: 'Transferido', obito: 'Óbito',
}
const STATUS_COR: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700', alta: 'bg-blue-100 text-blue-700',
  desligado: 'bg-red-100 text-red-700', transferido: 'bg-yellow-100 text-yellow-700', obito: 'bg-gray-100 text-gray-600',
}
const GRAVIDADE_COR: Record<string, string> = {
  leve: 'text-yellow-600', moderada: 'text-orange-600', grave: 'text-red-600',
}

export function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ ativos: 0, altas: 0, desligados: 0, total: 0 })
  const [visitasHoje, setVisitasHoje] = useState<VisitaHoje[]>([])
  const [recentes, setRecentes] = useState<AcolhidoRecente[]>([])
  const [intercorrencias, setIntercorrencias] = useState<Intercorrencia[]>([])
  const [atividadesHoje, setAtividadesHoje] = useState(0)
  const [ocupacaoMeses, setOcupacaoMeses] = useState<MesOcupacao[]>([])
  const [saldoMes, setSaldoMes] = useState<{ receitas: number; despesas: number } | null>(null)

  useEffect(() => {
    if (!profile) return
    const tid = profile.tenant_id
    const hoje = new Date().toISOString().slice(0, 10)

    // Últimos 6 meses para gráfico de ocupação
    const meses: MesOcupacao[] = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      return {
        mes: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        ativos: 0,
      }
    })

    async function load() {
      const [
        { data: acolhidos },
        { data: visitasData },
        { data: recentesData },
        { data: interData },
        { data: agendaData },
        { data: lancamentosData },
      ] = await Promise.all([
        supabase.from('acolhidos').select('id, nome, numero_prontuario, status, data_acolhimento, data_saida').eq('tenant_id', tid),
        supabase.from('visitas')
          .select('id, visitante_nome, hora_prevista, status, acolhido_id')
          .eq('tenant_id', tid).eq('data_visita', hoje).order('hora_prevista'),
        supabase.from('acolhidos')
          .select('id, nome, numero_prontuario, data_acolhimento, status')
          .eq('tenant_id', tid).order('created_at', { ascending: false }).limit(5),
        supabase.from('intercorrencias')
          .select('id, tipo, gravidade, acolhido_id, data_ocorrencia')
          .eq('tenant_id', tid).gte('data_ocorrencia', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
          .order('data_ocorrencia', { ascending: false }).limit(5),
        supabase.from('agenda_atividades')
          .select('id')
          .eq('tenant_id', tid).eq('data_atividade', hoje),
        supabase.from('lancamentos_financeiros')
          .select('tipo, valor')
          .eq('tenant_id', tid)
          .gte('data', new Date().toISOString().slice(0, 7) + '-01')
          .lte('data', hoje),
      ])

      if (acolhidos) {
        setStats({
          ativos: acolhidos.filter(a => a.status === 'ativo').length,
          altas: acolhidos.filter(a => a.status === 'alta').length,
          desligados: acolhidos.filter(a => a.status === 'desligado').length,
          total: acolhidos.length,
        })

        // Calcula ocupação por mês: acolhidos ativos no último dia do mês
        const ocupacao = meses.map(m => {
          const fimMes = new Date(m.mes + '-28')
          fimMes.setMonth(fimMes.getMonth() + 1, 0)
          const fimStr = fimMes.toISOString().slice(0, 10)
          const ativos = acolhidos.filter(a => {
            const entrada = a.data_acolhimento <= fimStr
            const saida = !a.data_saida || a.data_saida > fimStr
            return entrada && saida
          }).length
          return { ...m, ativos }
        })
        setOcupacaoMeses(ocupacao)
      }

      if (visitasData && acolhidos) {
        const acolhidoMap = Object.fromEntries(acolhidos.map(a => [a.id, a.nome]))
        setVisitasHoje(visitasData.map(v => ({ ...v, acolhido_nome: acolhidoMap[v.acolhido_id] ?? '—' })))
      }

      if (recentesData) setRecentes(recentesData as AcolhidoRecente[])

      if (interData && acolhidos) {
        const acolhidoMap = Object.fromEntries(acolhidos.map(a => [a.id, a.nome]))
        setIntercorrencias(interData.map(i => ({ ...i, acolhido_nome: acolhidoMap[i.acolhido_id] ?? '—' })))
      }

      if (agendaData) setAtividadesHoje(agendaData.length)

      if (lancamentosData) {
        const receitas = lancamentosData.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
        const despesas = lancamentosData.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
        setSaldoMes({ receitas, despesas })
      }
    }
    load()
  }, [profile])

  const maxOcupacao = Math.max(...ocupacaoMeses.map(m => m.ativos), 1)

  const formatMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral da comunidade terapêutica</p>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BedDouble} label="Acolhidos ativos" value={stats.ativos} color="bg-primary-600" />
        <StatCard icon={Users} label="Total cadastrado" value={stats.total} color="bg-gray-600" />
        <StatCard icon={UserCheck} label="Altas" value={stats.altas} color="bg-green-600" />
        <StatCard icon={UserMinus} label="Desligamentos" value={stats.desligados} color="bg-red-500" />
      </div>

      {/* KPIs do dia + financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck size={16} className="text-indigo-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Visitas hoje</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{visitasHoje.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {visitasHoje.filter(v => v.status === 'realizada').length} realizadas · {visitasHoje.filter(v => v.status === 'agendada').length} aguardando
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-teal-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Atividades hoje</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{atividadesHoje}</p>
          <p className="text-xs text-gray-400 mt-1">atividades agendadas para hoje</p>
        </div>
        {saldoMes ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo do mês</span>
            </div>
            <p className={`text-2xl font-bold ${saldoMes.receitas - saldoMes.despesas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoeda(saldoMes.receitas - saldoMes.despesas)}
            </p>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-green-600 flex items-center gap-1"><TrendingUp size={10}/>{formatMoeda(saldoMes.receitas)}</span>
              <span className="text-xs text-red-500 flex items-center gap-1"><TrendingDown size={10}/>{formatMoeda(saldoMes.despesas)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo do mês</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">Sem lançamentos ainda</p>
          </div>
        )}
      </div>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfico de ocupação */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Ocupação — últimos 6 meses</h3>
          <div className="flex items-end gap-2 h-32">
            {ocupacaoMeses.map(m => (
              <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{m.ativos}</span>
                <div
                  className="w-full bg-primary-500 rounded-t transition-all"
                  style={{ height: `${Math.round((m.ativos / maxOcupacao) * 96)}px`, minHeight: '4px' }}
                />
                <span className="text-xs text-gray-400 capitalize">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acolhidos recentes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Acolhidos recentes</h3>
            <Link to="/acolhidos" className="text-xs text-primary-600 flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentes.length === 0 && <p className="text-sm text-gray-400">Nenhum acolhido cadastrado</p>}
            {recentes.map(a => (
              <Link key={a.id} to={`/acolhidos/${a.id}`} className="flex items-center justify-between py-1.5 hover:bg-gray-50 rounded px-1 -mx-1 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[130px]">{a.nome}</p>
                  <p className="text-xs text-gray-400">{a.numero_prontuario}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COR[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Painel direito: visitas + intercorrências */}
        <div className="space-y-4">
          {/* Visitas de hoje */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Visitas de hoje</h3>
            {visitasHoje.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma visita agendada hoje</p>
            ) : (
              <div className="space-y-2">
                {visitasHoje.slice(0, 3).map(v => (
                  <div key={v.id} className="flex items-center gap-2">
                    <CalendarCheck size={13} className="text-indigo-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{v.visitante_nome}</p>
                      <p className="text-xs text-gray-400 truncate">→ {v.acolhido_nome} {v.hora_prevista ? `às ${v.hora_prevista}` : ''}</p>
                    </div>
                    <span className={`text-xs shrink-0 ${v.status === 'realizada' ? 'text-green-600' : v.status === 'cancelada' ? 'text-red-500' : 'text-indigo-500'}`}>
                      {v.status === 'realizada' ? '✓' : v.status === 'cancelada' ? '✕' : '●'}
                    </span>
                  </div>
                ))}
                {visitasHoje.length > 3 && <p className="text-xs text-gray-400">+{visitasHoje.length - 3} mais</p>}
              </div>
            )}
          </div>

          {/* Intercorrências recentes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle size={13} className="text-orange-500" />
              Intercorrências (7 dias)
            </h3>
            {intercorrencias.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma intercorrência recente</p>
            ) : (
              <div className="space-y-2">
                {intercorrencias.map(i => (
                  <div key={i.id} className="flex items-start gap-2">
                    <span className={`text-xs font-bold mt-0.5 shrink-0 ${GRAVIDADE_COR[i.gravidade] ?? 'text-gray-500'}`}>●</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800">{i.acolhido_nome}</p>
                      <p className="text-xs text-gray-400">{i.tipo} · {new Date(i.data_ocorrencia + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
