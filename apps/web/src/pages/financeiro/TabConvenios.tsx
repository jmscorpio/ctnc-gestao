import { useEffect, useState } from 'react'
import { Plus, Building2, CheckCircle, XCircle, Edit, X, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { ConvenioTipo } from '@ctnc/shared'

interface Convenio {
  id: string
  nome: string
  tipo: ConvenioTipo
  orgao_responsavel: string | null
  numero_processo: string | null
  valor_mensal: number
  data_inicio: string
  data_fim: string | null
  ativo: boolean
  observacoes: string | null
}

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  tipo: z.enum(['municipal', 'estadual', 'federal', 'privado', 'religioso', 'filantropia', 'outro']),
  orgao_responsavel: z.string().optional(),
  numero_processo: z.string().optional(),
  valor_mensal: z.coerce.number().min(0).default(0),
  data_inicio: z.string().min(1, 'Data obrigatória'),
  data_fim: z.string().optional(),
  observacoes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const TIPO_LABEL: Record<ConvenioTipo, string> = {
  municipal: 'Municipal', estadual: 'Estadual', federal: 'Federal',
  privado: 'Privado', religioso: 'Religioso', filantropia: 'Filantropia', outro: 'Outro',
}
const TIPO_COR: Record<ConvenioTipo, string> = {
  municipal: 'bg-blue-100 text-blue-700', estadual: 'bg-indigo-100 text-indigo-700',
  federal: 'bg-purple-100 text-purple-700', privado: 'bg-gray-100 text-gray-700',
  religioso: 'bg-amber-100 text-amber-700', filantropia: 'bg-pink-100 text-pink-700',
  outro: 'bg-gray-100 text-gray-600',
}
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function TabConvenios() {
  const { profile } = useAuth()
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState<boolean | null>(true)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'outro', data_inicio: new Date().toISOString().slice(0, 10) },
  })

  async function carregar() {
    if (!profile) return
    setLoading(true)
    let q = supabase.from('convenios').select('*').eq('tenant_id', profile.tenant_id).order('nome')
    if (filtroAtivo !== null) q = q.eq('ativo', filtroAtivo)
    const { data } = await q
    setConvenios((data ?? []) as Convenio[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [profile, filtroAtivo]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: FormData) {
    if (!profile) return
    const payload = {
      tenant_id: profile.tenant_id,
      nome: data.nome,
      tipo: data.tipo,
      orgao_responsavel: data.orgao_responsavel || null,
      numero_processo: data.numero_processo || null,
      valor_mensal: data.valor_mensal,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim || null,
      observacoes: data.observacoes || null,
    }

    if (editando) {
      await supabase.from('convenios').update(payload).eq('id', editando)
      setEditando(null)
    } else {
      await supabase.from('convenios').insert({ ...payload, ativo: true })
    }
    reset()
    setShowForm(false)
    await carregar()
  }

  function iniciarEdicao(c: Convenio) {
    setEditando(c.id)
    setShowForm(true)
    reset({
      nome: c.nome,
      tipo: c.tipo,
      orgao_responsavel: c.orgao_responsavel ?? '',
      numero_processo: c.numero_processo ?? '',
      valor_mensal: c.valor_mensal,
      data_inicio: c.data_inicio,
      data_fim: c.data_fim ?? '',
      observacoes: c.observacoes ?? '',
    })
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('convenios').update({ ativo: !ativo }).eq('id', id)
    await carregar()
  }

  const totalAtivo = convenios.filter(c => c.ativo).reduce((s, c) => s + c.valor_mensal, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {([true, false, null] as const).map(v => (
            <button
              key={String(v)}
              onClick={() => setFiltroAtivo(v)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filtroAtivo === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {v === true ? 'Ativos' : v === false ? 'Encerrados' : 'Todos'}
            </button>
          ))}
        </div>

        {filtroAtivo !== false && (
          <div className="text-sm text-gray-600">
            Valor mensal total: <span className="font-semibold text-emerald-600">{fmt(totalAtivo)}</span>
          </div>
        )}

        <button
          onClick={() => { setShowForm(v => !v); setEditando(null); reset() }}
          className="ml-auto flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Novo convênio
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">{editando ? 'Editar convênio' : 'Novo convênio'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Nome do convênio / parceiro</label>
              <input {...register('nome')} placeholder="Ex.: Prefeitura de São Paulo"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              {errors.nome && <p className="text-xs text-red-500 mt-0.5">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Tipo</label>
              <select {...register('tipo')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Órgão responsável</label>
              <input {...register('orgao_responsavel')} placeholder="Ex.: Secretaria de Saúde"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Número do processo</label>
              <input {...register('numero_processo')} placeholder="Ex.: 2024/00123"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Valor mensal (R$)</label>
              <input {...register('valor_mensal')} type="number" step="0.01" min="0" placeholder="0,00"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Data de início</label>
              <input {...register('data_inicio')} type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              {errors.data_inicio && <p className="text-xs text-red-500 mt-0.5">{errors.data_inicio.message}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Data de término (opcional)</label>
              <input {...register('data_fim')} type="date"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Observações</label>
              <input {...register('observacoes')} placeholder="Notas adicionais"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSubmitting}
              className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Check size={14} />
              {isSubmitting ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); reset() }}
              className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5">
              <X size={14} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : convenios.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white border border-gray-200 rounded-xl">
          <Building2 size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum convênio cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {convenios.map(c => (
            <div key={c.id} className={`bg-white border rounded-xl p-4 ${c.ativo ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.nome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TIPO_COR[c.tipo]}`}>
                      {TIPO_LABEL[c.tipo]}
                    </span>
                  </div>
                  {c.orgao_responsavel && <p className="text-xs text-gray-400 mt-0.5">{c.orgao_responsavel}</p>}
                  {c.numero_processo && <p className="text-xs text-gray-400">Proc. {c.numero_processo}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => iniciarEdicao(c)} className="text-gray-300 hover:text-gray-600 transition-colors p-1">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => toggleAtivo(c.id, c.ativo)} className="text-gray-300 hover:text-gray-600 transition-colors p-1" title={c.ativo ? 'Encerrar' : 'Reativar'}>
                    {c.ativo ? <XCircle size={14} /> : <CheckCircle size={14} />}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-emerald-600">{fmt(c.valor_mensal)}<span className="text-xs font-normal text-gray-400">/mês</span></span>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {c.data_fim && ` → ${new Date(c.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                  </p>
                  <span className={`text-xs font-medium ${c.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                    {c.ativo ? '● Ativo' : '● Encerrado'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
