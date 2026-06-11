import { useEffect, useState } from 'react'
import { Plus, FileText, Users as UsersIcon, MessageSquare, Stethoscope } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

type RegistroTipo = 'evolucao_clinica' | 'atendimento_individual' | 'atendimento_grupo' | 'demanda' | 'outro'
type AreaProfissional = 'medico' | 'enfermagem' | 'psicologia' | 'assistencia_social' | 'terapia_ocupacional' | 'educacao_fisica' | 'outros'

interface Registro {
  id: string
  tipo: RegistroTipo
  area: AreaProfissional
  data_registro: string
  profissional_nome: string | null
  conteudo: string
  participantes: number | null
  atividade_nome: string | null
}

const TIPO_LABEL: Record<RegistroTipo, string> = {
  evolucao_clinica: 'Evolução Clínica',
  atendimento_individual: 'Atendimento Individual',
  atendimento_grupo: 'Atendimento em Grupo',
  demanda: 'Demanda',
  outro: 'Outro',
}

const AREA_LABEL: Record<AreaProfissional, string> = {
  medico: 'Médico', enfermagem: 'Enfermagem', psicologia: 'Psicologia',
  assistencia_social: 'Assistência Social', terapia_ocupacional: 'Terapia Ocupacional',
  educacao_fisica: 'Educação Física', outros: 'Outros',
}

const TIPO_ICONE: Record<RegistroTipo, React.ReactNode> = {
  evolucao_clinica: <Stethoscope size={15} className="text-blue-500" />,
  atendimento_individual: <MessageSquare size={15} className="text-purple-500" />,
  atendimento_grupo: <UsersIcon size={15} className="text-green-500" />,
  demanda: <FileText size={15} className="text-orange-500" />,
  outro: <FileText size={15} className="text-gray-400" />,
}

const TIPO_COR: Record<RegistroTipo, string> = {
  evolucao_clinica: 'bg-blue-50 border-blue-100',
  atendimento_individual: 'bg-purple-50 border-purple-100',
  atendimento_grupo: 'bg-green-50 border-green-100',
  demanda: 'bg-orange-50 border-orange-100',
  outro: 'bg-gray-50 border-gray-100',
}

interface NovoRegistroForm {
  tipo: RegistroTipo
  area: AreaProfissional
  data_registro: string
  profissional_nome: string
  conteudo: string
  participantes: string
  atividade_nome: string
}

const VAZIO: NovoRegistroForm = {
  tipo: 'evolucao_clinica', area: 'psicologia',
  data_registro: new Date().toISOString().slice(0, 10),
  profissional_nome: '', conteudo: '', participantes: '', atividade_nome: '',
}

interface Props { acolhidoId: string }

export function TabRegistros({ acolhidoId }: Props) {
  const { profile } = useAuth()
  const [registros, setRegistros] = useState<Registro[]>([])
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<NovoRegistroForm>(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<RegistroTipo | 'todos'>('todos')

  async function carregar() {
    let query = supabase
      .from('registros_terapeuticos')
      .select('id, tipo, area, data_registro, profissional_nome, conteudo, participantes, atividade_nome')
      .eq('acolhido_id', acolhidoId)
      .order('data_registro', { ascending: false })
    if (filtroTipo !== 'todos') query = query.eq('tipo', filtroTipo)
    const { data } = await query
    setRegistros((data ?? []) as Registro[])
  }

  useEffect(() => { carregar() }, [acolhidoId, filtroTipo])

  async function salvar() {
    if (!profile || !form.conteudo.trim()) return
    setSalvando(true)
    await supabase.from('registros_terapeuticos').insert({
      acolhido_id: acolhidoId,
      tenant_id: profile.tenant_id,
      tipo: form.tipo,
      area: form.area,
      data_registro: form.data_registro,
      profissional_nome: form.profissional_nome || null,
      conteudo: form.conteudo,
      participantes: form.participantes ? Number(form.participantes) : null,
      atividade_nome: form.atividade_nome || null,
      created_by: profile.id,
    })
    setForm(VAZIO)
    setCriando(false)
    setSalvando(false)
    await carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value as RegistroTipo | 'todos')}
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="todos">Todos os tipos</option>
          {(Object.keys(TIPO_LABEL) as RegistroTipo[]).map(t => (
            <option key={t} value={t}>{TIPO_LABEL[t]}</option>
          ))}
        </select>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Novo registro
        </button>
      </div>

      {/* Formulário */}
      {criando && (
        <div className="bg-white rounded-xl border border-primary-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Novo Registro Terapêutico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as RegistroTipo }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {(Object.keys(TIPO_LABEL) as RegistroTipo[]).map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Área</label>
              <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as AreaProfissional }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {(Object.keys(AREA_LABEL) as AreaProfissional[]).map(a => <option key={a} value={a}>{AREA_LABEL[a]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data</label>
              <input type="date" value={form.data_registro} onChange={e => setForm(f => ({ ...f, data_registro: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Profissional</label>
              <input value={form.profissional_nome} onChange={e => setForm(f => ({ ...f, profissional_nome: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nome do profissional" />
            </div>
            {form.tipo === 'atendimento_grupo' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Atividade</label>
                  <input value={form.atividade_nome} onChange={e => setForm(f => ({ ...f, atividade_nome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nome da atividade" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Participantes</label>
                  <input type="number" min="1" value={form.participantes} onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nº de participantes" />
                </div>
              </>
            )}
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">Conteúdo / Evolução *</label>
            <textarea value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
              rows={5} placeholder="Descreva o atendimento, evolução ou demanda..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setCriando(false); setForm(VAZIO) }}
              className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={salvar} disabled={salvando || !form.conteudo.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
              {salvando ? 'Salvando...' : 'Salvar registro'}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {registros.length === 0 && !criando ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <FileText size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Nenhum registro encontrado</p>
          <p className="text-sm mt-1">Registre evoluções, atendimentos e demandas do acolhido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map(r => (
            <div key={r.id} className={`border rounded-xl p-4 ${TIPO_COR[r.tipo]}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {TIPO_ICONE[r.tipo]}
                  <span className="text-sm font-semibold text-gray-800">{TIPO_LABEL[r.tipo]}</span>
                  <span className="text-xs bg-white/70 text-gray-500 px-2 py-0.5 rounded-full border">{AREA_LABEL[r.area]}</span>
                  {r.tipo === 'atendimento_grupo' && r.participantes && (
                    <span className="text-xs text-gray-500">{r.participantes} participantes</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{new Date(r.data_registro + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  {r.profissional_nome && <p className="text-xs text-gray-400">{r.profissional_nome}</p>}
                </div>
              </div>
              {r.atividade_nome && <p className="text-xs text-gray-500 mb-1 font-medium">{r.atividade_nome}</p>}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.conteudo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
