import { useEffect, useState } from 'react'
import { Plus, Calendar, Clock, User } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

type VisitaTipo = 'familiar' | 'ressocializacao' | 'institucional' | 'outro'
type VisitaStatus = 'agendada' | 'realizada' | 'cancelada' | 'nao_compareceu'

interface Visita {
  id: string
  tipo: VisitaTipo
  status: VisitaStatus
  visitante_nome: string
  vinculo: string | null
  data_visita: string
  hora_prevista: string | null
  hora_entrada: string | null
  hora_saida: string | null
  local_visita: string | null
  observacoes: string | null
}

const TIPO_LABEL: Record<VisitaTipo, string> = {
  familiar: 'Familiar', ressocializacao: 'Ressocialização',
  institucional: 'Institucional', outro: 'Outro',
}

const STATUS_COR: Record<VisitaStatus, string> = {
  agendada: 'bg-blue-100 text-blue-700 border-blue-200',
  realizada: 'bg-green-100 text-green-700 border-green-200',
  cancelada: 'bg-gray-100 text-gray-500 border-gray-200',
  nao_compareceu: 'bg-red-100 text-red-600 border-red-200',
}

const STATUS_LABEL: Record<VisitaStatus, string> = {
  agendada: 'Agendada', realizada: 'Realizada',
  cancelada: 'Cancelada', nao_compareceu: 'Não compareceu',
}

interface NovaVisitaForm {
  tipo: VisitaTipo
  visitante_nome: string
  vinculo: string
  data_visita: string
  hora_prevista: string
  local_visita: string
  observacoes: string
}

const VAZIO: NovaVisitaForm = {
  tipo: 'familiar', visitante_nome: '', vinculo: '',
  data_visita: new Date().toISOString().slice(0, 10),
  hora_prevista: '', local_visita: '', observacoes: '',
}

interface Props { acolhidoId: string }

export function TabVisitas({ acolhidoId }: Props) {
  const { profile } = useAuth()
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<NovaVisitaForm>(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [filtro, setFiltro] = useState<VisitaStatus | 'todas'>('todas')

  async function carregar() {
    let query = supabase
      .from('visitas')
      .select('id, tipo, status, visitante_nome, vinculo, data_visita, hora_prevista, hora_entrada, hora_saida, local_visita, observacoes')
      .eq('acolhido_id', acolhidoId)
      .order('data_visita', { ascending: false })
    if (filtro !== 'todas') query = query.eq('status', filtro)
    const { data } = await query
    setVisitas((data ?? []) as Visita[])
  }

  useEffect(() => { carregar() }, [acolhidoId, filtro])

  async function salvar() {
    if (!profile || !form.visitante_nome.trim()) return
    setSalvando(true)
    await supabase.from('visitas').insert({
      acolhido_id: acolhidoId,
      tenant_id: profile.tenant_id,
      tipo: form.tipo,
      visitante_nome: form.visitante_nome,
      vinculo: form.vinculo || null,
      data_visita: form.data_visita,
      hora_prevista: form.hora_prevista || null,
      local_visita: form.local_visita || null,
      observacoes: form.observacoes || null,
      autorizado_por: profile.id,
    })
    setForm(VAZIO)
    setCriando(false)
    setSalvando(false)
    await carregar()
  }

  async function atualizarStatus(id: string, status: VisitaStatus) {
    await supabase.from('visitas').update({ status }).eq('id', id)
    await carregar()
  }

  async function registrarEntradaSaida(id: string, campo: 'hora_entrada' | 'hora_saida') {
    const agora = new Date().toTimeString().slice(0, 5)
    if (campo === 'hora_entrada') {
      await supabase.from('visitas').update({ hora_entrada: agora, status: 'realizada' }).eq('id', id)
    } else {
      await supabase.from('visitas').update({ hora_saida: agora }).eq('id', id)
    }
    await carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value as VisitaStatus | 'todas')}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="todas">Todas as visitas</option>
          {(Object.keys(STATUS_LABEL) as VisitaStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Agendar visita
        </button>
      </div>

      {/* Formulário */}
      {criando && (
        <div className="bg-white rounded-xl border border-primary-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Agendar Visita</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo de visita</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as VisitaTipo }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {(Object.keys(TIPO_LABEL) as VisitaTipo[]).map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome do visitante *</label>
              <input value={form.visitante_nome} onChange={e => setForm(f => ({ ...f, visitante_nome: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vínculo / Parentesco</label>
              <input value={form.vinculo} onChange={e => setForm(f => ({ ...f, vinculo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Mãe, Cônjuge, Amigo..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data *</label>
              <input type="date" value={form.data_visita} onChange={e => setForm(f => ({ ...f, data_visita: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Horário previsto</label>
              <input type="time" value={form.hora_prevista} onChange={e => setForm(f => ({ ...f, hora_prevista: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Local</label>
              <input value={form.local_visita} onChange={e => setForm(f => ({ ...f, local_visita: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Sala de visitas" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Observações sobre a visita..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setCriando(false); setForm(VAZIO) }}
              className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={salvar} disabled={salvando || !form.visitante_nome.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
              {salvando ? 'Salvando...' : 'Agendar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {visitas.length === 0 && !criando ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <Calendar size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Nenhuma visita registrada</p>
          <p className="text-sm mt-1">Agende a primeira visita clicando no botão acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitas.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{v.visitante_nome}</p>
                    <p className="text-xs text-gray-400">{v.vinculo ? `${v.vinculo} · ` : ''}{TIPO_LABEL[v.tipo]}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    <Calendar size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-600">{new Date(v.data_visita + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    {v.hora_prevista && (
                      <>
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">{v.hora_prevista.slice(0, 5)}</span>
                      </>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COR[v.status]}`}>
                    {STATUS_LABEL[v.status]}
                  </span>
                </div>
              </div>

              {/* Controle de entrada/saída */}
              {v.status === 'agendada' && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => registrarEntradaSaida(v.id, 'hora_entrada')}
                    className="flex-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg px-3 py-1.5 transition-colors">
                    Registrar entrada
                  </button>
                  <button onClick={() => atualizarStatus(v.id, 'cancelada')}
                    className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => atualizarStatus(v.id, 'nao_compareceu')}
                    className="text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors">
                    Não compareceu
                  </button>
                </div>
              )}
              {v.status === 'realizada' && v.hora_entrada && !v.hora_saida && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Entrada: {v.hora_entrada.slice(0, 5)}</span>
                  <button onClick={() => registrarEntradaSaida(v.id, 'hora_saida')}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors">
                    Registrar saída
                  </button>
                </div>
              )}
              {v.hora_entrada && v.hora_saida && (
                <div className="flex gap-4 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Entrada: <strong>{v.hora_entrada.slice(0, 5)}</strong></span>
                  <span className="text-xs text-gray-500">Saída: <strong>{v.hora_saida.slice(0, 5)}</strong></span>
                </div>
              )}
              {v.local_visita && <p className="text-xs text-gray-400 mt-1">{v.local_visita}</p>}
              {v.observacoes && <p className="text-xs text-gray-500 mt-1 italic">{v.observacoes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
