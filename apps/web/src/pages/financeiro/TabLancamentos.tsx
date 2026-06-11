import { useEffect, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { FinanceiroTipo } from '@ctnc/shared'

interface Lancamento {
  id: string
  tipo: FinanceiroTipo
  valor: number
  descricao: string
  data: string
  categoria_nome: string | null
  categoria_cor: string | null
}
interface Categoria { id: string; nome: string; tipo: FinanceiroTipo; cor: string }

const schema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  valor: z.string().min(1).transform(v => parseFloat(v.replace(',', '.'))),
  descricao: z.string().min(1, 'Informe uma descrição'),
  data: z.string().min(1),
  categoria_id: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function TabLancamentos() {
  const { profile } = useAuth()
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7))
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [filtroTipo, setFiltroTipo] = useState<FinanceiroTipo | 'todos'>('todos')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'despesa', data: new Date().toISOString().slice(0, 10) },
  })
  const tipoWatch = watch('tipo')

  useEffect(() => {
    if (!profile) return
    supabase.from('categorias_financeiras')
      .select('id, nome, tipo, cor')
      .eq('tenant_id', profile.tenant_id)
      .eq('ativa', true)
      .then(({ data }) => setCategorias((data ?? []) as Categoria[]))
  }, [profile])

  async function carregar() {
    if (!profile) return
    setLoading(true)
    const primeiroDia = mes + '-01'
    const ultimoDia = new Date(mes + '-28')
    ultimoDia.setMonth(ultimoDia.getMonth() + 1, 0)

    const { data } = await supabase.from('lancamentos_financeiros')
      .select('id, tipo, valor, descricao, data, categoria_id')
      .eq('tenant_id', profile.tenant_id)
      .gte('data', primeiroDia)
      .lte('data', ultimoDia.toISOString().slice(0, 10))
      .order('data', { ascending: false })

    const catMap = Object.fromEntries(categorias.map(c => [c.id, c]))
    setLancamentos((data ?? []).map(l => ({
      ...l,
      tipo: l.tipo as FinanceiroTipo,
      categoria_nome: l.categoria_id ? (catMap[l.categoria_id]?.nome ?? null) : null,
      categoria_cor: l.categoria_id ? (catMap[l.categoria_id]?.cor ?? null) : null,
    })))
    setLoading(false)
  }

  useEffect(() => { carregar() }, [profile, mes, categorias]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: FormData) {
    if (!profile) return
    await supabase.from('lancamentos_financeiros').insert({
      tenant_id: profile.tenant_id,
      tipo: data.tipo,
      valor: data.valor,
      descricao: data.descricao,
      data: data.data,
      categoria_id: data.categoria_id || null,
      registrado_por: profile.id,
    })
    reset({ tipo: 'despesa', data: new Date().toISOString().slice(0, 10) })
    setShowForm(false)
    await carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('lancamentos_financeiros').delete().eq('id', id)
    await carregar()
  }

  function mudarMes(delta: number) {
    const [ano, m] = mes.split('-').map(Number)
    const d = new Date(ano, m - 1 + delta, 1)
    setMes(d.toISOString().slice(0, 7))
  }

  const exibidos = filtroTipo === 'todos' ? lancamentos : lancamentos.filter(l => l.tipo === filtroTipo)
  const totRec = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
  const totDesp = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)
  const mesLabel = new Date(mes + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const catsDoTipo = categorias.filter(c => c.tipo === tipoWatch)

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => mudarMes(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-gray-800 capitalize w-36 text-center">{mesLabel}</span>
          <button onClick={() => mudarMes(1)} disabled={mes >= new Date().toISOString().slice(0, 7)} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-40"><ChevronRight size={16} /></button>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['todos', 'receita', 'despesa'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${filtroTipo === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'todos' ? 'Todos' : t === 'receita' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowForm(v => !v); reset({ tipo: 'despesa', data: new Date().toISOString().slice(0, 10) }) }}
          className="ml-auto flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Lançar
        </button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-600" />
          <div><p className="text-xs text-emerald-600">Receitas</p><p className="font-bold text-emerald-700">{fmt(totRec)}</p></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <TrendingDown size={14} className="text-red-600" />
          <div><p className="text-xs text-red-600">Despesas</p><p className="font-bold text-red-700">{fmt(totDesp)}</p></div>
        </div>
        <div className={`${totRec - totDesp >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-3`}>
          <p className="text-xs text-gray-500">Saldo</p>
          <p className={`font-bold ${totRec - totDesp >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmt(totRec - totDesp)}</p>
        </div>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Novo lançamento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Tipo</label>
              <select {...register('tipo')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Valor (R$)</label>
              <input {...register('valor')} type="number" step="0.01" min="0.01" placeholder="0,00"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              {errors.valor && <p className="text-xs text-red-500 mt-0.5">{String(errors.valor.message)}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Descrição</label>
              <input {...register('descricao')} placeholder="Ex.: Conta de água"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              {errors.descricao && <p className="text-xs text-red-500 mt-0.5">{errors.descricao.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Data</label>
              <input {...register('data')} type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            {catsDoTipo.length > 0 && (
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 font-medium">Categoria (opcional)</label>
                <select {...register('categoria_id')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="">Sem categoria</option>
                  {catsDoTipo.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSubmitting}
              className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Salvando...' : 'Salvar lançamento'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : exibidos.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-sm">Nenhum lançamento encontrado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs">Valor</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exibidos.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {l.tipo === 'receita'
                        ? <TrendingUp size={13} className="text-emerald-500 shrink-0" />
                        : <TrendingDown size={13} className="text-red-400 shrink-0" />}
                      <span className="text-gray-800">{l.descricao}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {l.categoria_nome ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.categoria_cor ?? '#6b7280' }} />
                        {l.categoria_nome}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {l.tipo === 'receita' ? '+' : '-'}{fmt(l.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => excluir(l.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
