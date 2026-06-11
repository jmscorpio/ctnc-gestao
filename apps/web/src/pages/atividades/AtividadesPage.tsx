import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, BookOpen, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type AtividadeTipo = 'terapeutica' | 'educativa' | 'laboral' | 'religiosa' | 'recreativa' | 'esportiva' | 'cultural' | 'outro'

interface Atividade {
  id: string
  nome: string
  tipo: AtividadeTipo
  responsavel_nome: string | null
  duracao_min: number | null
  ativa: boolean
}

interface AgendaEvento {
  id: string
  titulo: string
  data_atividade: string
  hora_inicio: string | null
  hora_fim: string | null
  local: string | null
  responsavel_nome: string | null
  atividade_id: string | null
  _total_presencas?: number
}

const TIPO_COR: Record<AtividadeTipo, string> = {
  terapeutica: 'bg-blue-100 text-blue-700',
  educativa: 'bg-purple-100 text-purple-700',
  laboral: 'bg-yellow-100 text-yellow-700',
  religiosa: 'bg-indigo-100 text-indigo-700',
  recreativa: 'bg-green-100 text-green-700',
  esportiva: 'bg-orange-100 text-orange-700',
  cultural: 'bg-pink-100 text-pink-700',
  outro: 'bg-gray-100 text-gray-600',
}

const TIPO_LABEL: Record<AtividadeTipo, string> = {
  terapeutica: 'Terapêutica', educativa: 'Educativa', laboral: 'Laboral',
  religiosa: 'Religiosa', recreativa: 'Recreativa', esportiva: 'Esportiva',
  cultural: 'Cultural', outro: 'Outro',
}

type AreaProfissional = 'medico' | 'enfermagem' | 'psicologia' | 'assistencia_social' | 'terapia_ocupacional' | 'educacao_fisica' | 'outros'

export function AtividadesPage() {
  const { profile } = useAuth()
  const [aba, setAba] = useState<'agenda' | 'catalogo'>('agenda')
  const [semana, setSemana] = useState(new Date())
  const [eventos, setEventos] = useState<AgendaEvento[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [criandoEvento, setCriandoEvento] = useState(false)
  const [criandoAtividade, setCriandoAtividade] = useState(false)
  const [formEvento, setFormEvento] = useState({ titulo: '', data_atividade: new Date().toISOString().slice(0,10), hora_inicio: '', hora_fim: '', local: '', responsavel_nome: '', atividade_id: '' })
  const [formAtividade, setFormAtividade] = useState({ nome: '', tipo: 'terapeutica' as AtividadeTipo, area: 'psicologia' as AreaProfissional, responsavel_nome: '', duracao_min: '' })
  const [salvando, setSalvando] = useState(false)

  const inicioSemana = startOfWeek(semana, { weekStartsOn: 1 })
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i))

  async function carregarEventos() {
    if (!profile) return
    const inicio = format(inicioSemana, 'yyyy-MM-dd')
    const fim = format(addDays(inicioSemana, 6), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('agenda_atividades')
      .select('id, titulo, data_atividade, hora_inicio, hora_fim, local, responsavel_nome, atividade_id')
      .eq('tenant_id', profile.tenant_id)
      .gte('data_atividade', inicio)
      .lte('data_atividade', fim)
      .order('hora_inicio')
    setEventos((data ?? []) as AgendaEvento[])
  }

  async function carregarAtividades() {
    if (!profile) return
    const { data } = await supabase
      .from('atividades')
      .select('id, nome, tipo, responsavel_nome, duracao_min, ativa')
      .eq('tenant_id', profile.tenant_id)
      .order('nome')
    setAtividades((data ?? []) as Atividade[])
  }

  useEffect(() => { carregarEventos() }, [semana, profile])
  useEffect(() => { carregarAtividades() }, [profile])

  async function salvarEvento() {
    if (!profile || !formEvento.titulo.trim()) return
    setSalvando(true)
    await supabase.from('agenda_atividades').insert({
      tenant_id: profile.tenant_id,
      titulo: formEvento.titulo,
      data_atividade: formEvento.data_atividade,
      hora_inicio: formEvento.hora_inicio || null,
      hora_fim: formEvento.hora_fim || null,
      local: formEvento.local || null,
      responsavel_nome: formEvento.responsavel_nome || null,
      atividade_id: formEvento.atividade_id || null,
      created_by: profile.id,
    })
    setFormEvento({ titulo: '', data_atividade: new Date().toISOString().slice(0,10), hora_inicio: '', hora_fim: '', local: '', responsavel_nome: '', atividade_id: '' })
    setCriandoEvento(false)
    setSalvando(false)
    await carregarEventos()
  }

  async function salvarAtividade() {
    if (!profile || !formAtividade.nome.trim()) return
    setSalvando(true)
    await supabase.from('atividades').insert({
      tenant_id: profile.tenant_id,
      nome: formAtividade.nome,
      tipo: formAtividade.tipo,
      area: formAtividade.area,
      responsavel_nome: formAtividade.responsavel_nome || null,
      duracao_min: formAtividade.duracao_min ? Number(formAtividade.duracao_min) : null,
    })
    setFormAtividade({ nome: '', tipo: 'terapeutica', area: 'psicologia', responsavel_nome: '', duracao_min: '' })
    setCriandoAtividade(false)
    setSalvando(false)
    await carregarAtividades()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-500 text-sm mt-0.5">Cronograma e catálogo de atividades terapêuticas</p>
        </div>
        <button
          onClick={() => aba === 'agenda' ? setCriandoEvento(true) : setCriandoAtividade(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> {aba === 'agenda' ? 'Novo evento' : 'Nova atividade'}
        </button>
      </div>

      {/* Abas */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1 w-fit mb-6">
        <button onClick={() => setAba('agenda')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${aba === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Calendar size={15} /> Agenda semanal
        </button>
        <button onClick={() => setAba('catalogo')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${aba === 'catalogo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <BookOpen size={15} /> Catálogo
        </button>
      </div>

      {/* ── AGENDA ── */}
      {aba === 'agenda' && (
        <>
          {/* Formulário novo evento */}
          {criandoEvento && (
            <div className="bg-white rounded-xl border border-primary-200 p-5 mb-5">
              <h3 className="font-semibold text-gray-800 mb-4">Novo Evento na Agenda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Título *</label>
                  <input value={formEvento.titulo} onChange={e => setFormEvento(f => ({ ...f, titulo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Grupo terapêutico, Oficina de artesanato..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Atividade do catálogo</label>
                  <select value={formEvento.atividade_id} onChange={e => {
                    const atv = atividades.find(a => a.id === e.target.value)
                    setFormEvento(f => ({ ...f, atividade_id: e.target.value, titulo: atv ? atv.nome : f.titulo }))
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">— Selecionar (opcional) —</option>
                    {atividades.filter(a => a.ativa).map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data *</label>
                  <input type="date" value={formEvento.data_atividade} onChange={e => setFormEvento(f => ({ ...f, data_atividade: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hora início</label>
                  <input type="time" value={formEvento.hora_inicio} onChange={e => setFormEvento(f => ({ ...f, hora_inicio: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hora fim</label>
                  <input type="time" value={formEvento.hora_fim} onChange={e => setFormEvento(f => ({ ...f, hora_fim: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Local</label>
                  <input value={formEvento.local} onChange={e => setFormEvento(f => ({ ...f, local: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Sala 1, Pátio..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Responsável</label>
                  <input value={formEvento.responsavel_nome} onChange={e => setFormEvento(f => ({ ...f, responsavel_nome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nome do responsável" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCriandoEvento(false)} className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={salvarEvento} disabled={salvando || !formEvento.titulo.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
                  {salvando ? 'Salvando...' : 'Adicionar ao cronograma'}
                </button>
              </div>
            </div>
          )}

          {/* Navegação semanal */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSemana(s => subWeeks(s, 1))}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-semibold text-gray-800 capitalize">
              {format(inicioSemana, "d 'de' MMMM", { locale: ptBR })} – {format(addDays(inicioSemana, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <button onClick={() => setSemana(s => addWeeks(s, 1))}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Grade semanal */}
          <div className="grid grid-cols-7 gap-2">
            {diasSemana.map(dia => {
              const eventosNoDia = eventos.filter(e => isSameDay(parseISO(e.data_atividade), dia))
              const isHoje = isSameDay(dia, new Date())
              return (
                <div key={dia.toISOString()} className={`min-h-[120px] rounded-xl border p-2 ${isHoje ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200 bg-white'}`}>
                  <p className={`text-xs font-semibold mb-2 text-center ${isHoje ? 'text-primary-600' : 'text-gray-500'}`}>
                    <span className="block capitalize">{format(dia, 'EEE', { locale: ptBR })}</span>
                    <span className={`text-base ${isHoje ? 'text-primary-700' : 'text-gray-800'}`}>{format(dia, 'd')}</span>
                  </p>
                  <div className="space-y-1">
                    {eventosNoDia.map(ev => (
                      <Link key={ev.id} to={`/atividades/${ev.id}/presenca`}
                        className="block bg-primary-100 hover:bg-primary-200 text-primary-800 rounded-md px-2 py-1 text-xs transition-colors truncate"
                        title={ev.titulo}>
                        {ev.hora_inicio && <span className="font-medium">{ev.hora_inicio.slice(0,5)} </span>}
                        {ev.titulo}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Lista de eventos da semana */}
          {eventos.length > 0 && (
            <div className="mt-5 space-y-2">
              <h3 className="font-medium text-gray-700 text-sm">Eventos desta semana</h3>
              {eventos.sort((a, b) => a.data_atividade.localeCompare(b.data_atividade) || (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? '')).map(ev => (
                <div key={ev.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{ev.titulo}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> {new Date(ev.data_atividade + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      {ev.hora_inicio && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={11} /> {ev.hora_inicio.slice(0,5)}{ev.hora_fim ? ` – ${ev.hora_fim.slice(0,5)}` : ''}
                        </span>
                      )}
                      {ev.local && <span className="text-xs text-gray-400">{ev.local}</span>}
                      {ev.responsavel_nome && <span className="text-xs text-gray-400">{ev.responsavel_nome}</span>}
                    </div>
                  </div>
                  <Link to={`/atividades/${ev.id}/presenca`}
                    className="flex items-center gap-1.5 text-xs border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 shrink-0 transition-colors">
                    <Users size={13} /> Lista de presença
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CATÁLOGO ── */}
      {aba === 'catalogo' && (
        <>
          {criandoAtividade && (
            <div className="bg-white rounded-xl border border-primary-200 p-5 mb-5">
              <h3 className="font-semibold text-gray-800 mb-4">Nova Atividade</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Nome *</label>
                  <input value={formAtividade.nome} onChange={e => setFormAtividade(f => ({ ...f, nome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Grupo de apoio, Oficina de pintura..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                  <select value={formAtividade.tipo} onChange={e => setFormAtividade(f => ({ ...f, tipo: e.target.value as AtividadeTipo }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {(Object.keys(TIPO_LABEL) as AtividadeTipo[]).map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Duração (minutos)</label>
                  <input type="number" min="5" value={formAtividade.duracao_min} onChange={e => setFormAtividade(f => ({ ...f, duracao_min: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: 60" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Responsável padrão</label>
                  <input value={formAtividade.responsavel_nome} onChange={e => setFormAtividade(f => ({ ...f, responsavel_nome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nome do profissional responsável" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCriandoAtividade(false)} className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={salvarAtividade} disabled={salvando || !formAtividade.nome.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
                  {salvando ? 'Salvando...' : 'Criar atividade'}
                </button>
              </div>
            </div>
          )}

          {atividades.length === 0 && !criandoAtividade ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <BookOpen size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Nenhuma atividade cadastrada</p>
              <p className="text-sm mt-1">Crie o catálogo de atividades terapêuticas da CT.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {atividades.map(a => (
                <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm text-gray-900">{a.nome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${TIPO_COR[a.tipo]}`}>{TIPO_LABEL[a.tipo]}</span>
                  </div>
                  {a.responsavel_nome && <p className="text-xs text-gray-500">{a.responsavel_nome}</p>}
                  {a.duracao_min && <p className="text-xs text-gray-400 mt-0.5">{a.duracao_min} min</p>}
                  {!a.ativa && <span className="text-xs text-gray-400 italic">Inativa</span>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
