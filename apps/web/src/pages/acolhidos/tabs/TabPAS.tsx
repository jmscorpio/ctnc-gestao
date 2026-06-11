import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Circle, Clock, XCircle, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

type FaseTratamento = 'acolhimento' | 'estabilizacao' | 'desintoxicacao' | 'reabilitacao' | 'reinsercao_social'
type PasStatus = 'ativo' | 'concluido' | 'cancelado'
type AcaoStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
type AreaProfissional = 'medico' | 'enfermagem' | 'psicologia' | 'assistencia_social' | 'terapia_ocupacional' | 'educacao_fisica' | 'outros'

interface PasAcao {
  id: string
  area: AreaProfissional
  objetivo: string
  meta: string | null
  intervencao: string | null
  responsavel: string | null
  prazo: string | null
  status: AcaoStatus
  resultado: string | null
}

interface Pas {
  id: string
  fase: FaseTratamento
  status: PasStatus
  data_inicio: string
  data_revisao: string | null
  objetivo_geral: string | null
  observacoes: string | null
  acoes: PasAcao[]
}

const FASE_LABEL: Record<FaseTratamento, string> = {
  acolhimento: 'Acolhimento',
  estabilizacao: 'Estabilização',
  desintoxicacao: 'Desintoxicação',
  reabilitacao: 'Reabilitação',
  reinsercao_social: 'Reinserção Social',
}

const AREA_LABEL: Record<AreaProfissional, string> = {
  medico: 'Médico', enfermagem: 'Enfermagem', psicologia: 'Psicologia',
  assistencia_social: 'Assistência Social', terapia_ocupacional: 'Terapia Ocupacional',
  educacao_fisica: 'Educação Física', outros: 'Outros',
}

const ACAO_STATUS_ICON: Record<AcaoStatus, React.ReactNode> = {
  pendente: <Circle size={15} className="text-gray-400" />,
  em_andamento: <Clock size={15} className="text-yellow-500" />,
  concluida: <CheckCircle2 size={15} className="text-green-500" />,
  cancelada: <XCircle size={15} className="text-red-400" />,
}

const PAS_STATUS_COR: Record<PasStatus, string> = {
  ativo: 'bg-green-100 text-green-700',
  concluido: 'bg-blue-100 text-blue-700',
  cancelado: 'bg-gray-100 text-gray-500',
}

interface NovaAcaoForm {
  area: AreaProfissional
  objetivo: string
  meta: string
  intervencao: string
  responsavel: string
  prazo: string
}

const ACAO_VAZIA: NovaAcaoForm = { area: 'psicologia', objetivo: '', meta: '', intervencao: '', responsavel: '', prazo: '' }

interface Props { acolhidoId: string }

export function TabPAS({ acolhidoId }: Props) {
  const { profile } = useAuth()
  const [planosRaw, setPlanosRaw] = useState<Omit<Pas, 'acoes'>[]>([])
  const [acoesPorPas, setAcoesPorPas] = useState<Record<string, PasAcao[]>>({})
  const [expandido, setExpandido] = useState<string | null>(null)
  const [criandoPas, setCriandoPas] = useState(false)
  const [adicionandoAcao, setAdicionandoAcao] = useState<string | null>(null)
  const [novaAcao, setNovaAcao] = useState<NovaAcaoForm>(ACAO_VAZIA)
  const [novoFase, setNovoFase] = useState<FaseTratamento>('acolhimento')
  const [novoObjetivo, setNovoObjetivo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const planos: Pas[] = planosRaw.map(p => ({ ...p, acoes: acoesPorPas[p.id] ?? [] }))

  async function carregar() {
    if (!profile) return
    const { data: pasData } = await supabase
      .from('pas')
      .select('id, fase, status, data_inicio, data_revisao, objetivo_geral, observacoes')
      .eq('acolhido_id', acolhidoId)
      .order('data_inicio', { ascending: false })
    if (!pasData) return
    setPlanosRaw(pasData as Omit<Pas, 'acoes'>[])

    if (pasData.length > 0) {
      const ids = pasData.map(p => p.id)
      const { data: acoesData } = await supabase
        .from('pas_acoes')
        .select('id, area, objetivo, meta, intervencao, responsavel, prazo, status, resultado')
        .in('pas_id', ids)
        .order('created_at')
      const mapa: Record<string, PasAcao[]> = {}
      for (const a of (acoesData ?? [])) {
        const typed = a as PasAcao & { pas_id: string }
        if (!mapa[typed.pas_id]) mapa[typed.pas_id] = []
        mapa[typed.pas_id].push(typed)
      }
      setAcoesPorPas(mapa)
      if (pasData.length > 0 && !expandido) setExpandido(pasData[0].id)
    }
  }

  useEffect(() => { carregar() }, [acolhidoId])

  async function criarPas() {
    if (!profile) return
    setSalvando(true)
    await supabase.from('pas').insert({
      acolhido_id: acolhidoId,
      tenant_id: profile.tenant_id,
      fase: novoFase,
      objetivo_geral: novoObjetivo || null,
      elaborado_por: profile.id,
    })
    setNovoFase('acolhimento')
    setNovoObjetivo('')
    setCriandoPas(false)
    setSalvando(false)
    await carregar()
  }

  async function salvarAcao(pasId: string) {
    if (!novaAcao.objetivo.trim() || !profile) return
    setSalvando(true)
    await supabase.from('pas_acoes').insert({
      pas_id: pasId,
      tenant_id: profile.tenant_id,
      area: novaAcao.area,
      objetivo: novaAcao.objetivo,
      meta: novaAcao.meta || null,
      intervencao: novaAcao.intervencao || null,
      responsavel: novaAcao.responsavel || null,
      prazo: novaAcao.prazo || null,
    })
    setNovaAcao(ACAO_VAZIA)
    setAdicionandoAcao(null)
    setSalvando(false)
    await carregar()
  }

  async function atualizarStatusAcao(acaoId: string, status: AcaoStatus) {
    await supabase.from('pas_acoes').update({ status }).eq('id', acaoId)
    await carregar()
  }

  async function excluirAcao(acaoId: string) {
    await supabase.from('pas_acoes').delete().eq('id', acaoId)
    await carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCriandoPas(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> Novo PAS
        </button>
      </div>

      {/* Formulário novo PAS */}
      {criandoPas && (
        <div className="bg-white rounded-xl border border-primary-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Novo Plano de Atendimento Singular</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase do tratamento</label>
              <select
                value={novoFase}
                onChange={e => setNovoFase(e.target.value as FaseTratamento)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {(Object.keys(FASE_LABEL) as FaseTratamento[]).map(f => (
                  <option key={f} value={f}>{FASE_LABEL[f]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo geral</label>
            <textarea
              value={novoObjetivo}
              onChange={e => setNovoObjetivo(e.target.value)}
              rows={3}
              placeholder="Descreva o objetivo geral deste plano..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setCriandoPas(false)} className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={criarPas} disabled={salvando} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
              {salvando ? 'Criando...' : 'Criar PAS'}
            </button>
          </div>
        </div>
      )}

      {planos.length === 0 && !criandoPas && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <p className="font-medium text-gray-500">Nenhum PAS elaborado</p>
          <p className="text-sm mt-1">Clique em "Novo PAS" para elaborar o plano de atendimento.</p>
        </div>
      )}

      {planos.map(pas => (
        <div key={pas.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Cabeçalho do PAS */}
          <button
            onClick={() => setExpandido(expandido === pas.id ? null : pas.id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PAS_STATUS_COR[pas.status]}`}>
                {pas.status.charAt(0).toUpperCase() + pas.status.slice(1)}
              </span>
              <div>
                <p className="font-semibold text-gray-900">{FASE_LABEL[pas.fase]}</p>
                <p className="text-xs text-gray-400">
                  Iniciado em {new Date(pas.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                  {' · '}{pas.acoes.length} {pas.acoes.length === 1 ? 'ação' : 'ações'}
                </p>
              </div>
            </div>
            {expandido === pas.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>

          {/* Conteúdo expandido */}
          {expandido === pas.id && (
            <div className="border-t border-gray-100 px-5 py-4">
              {pas.objetivo_geral && (
                <p className="text-sm text-gray-600 mb-4 italic">"{pas.objetivo_geral}"</p>
              )}

              {/* Ações */}
              <div className="space-y-3 mb-4">
                {pas.acoes.map(acao => (
                  <div key={acao.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => {
                            const next: AcaoStatus[] = ['pendente','em_andamento','concluida']
                            const idx = next.indexOf(acao.status as AcaoStatus)
                            atualizarStatusAcao(acao.id, next[(idx + 1) % next.length])
                          }}
                          className="mt-0.5 shrink-0"
                        >
                          {ACAO_STATUS_ICON[acao.status]}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${acao.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {acao.objetivo}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{AREA_LABEL[acao.area]}</span>
                            {acao.responsavel && <span className="text-xs text-gray-400">{acao.responsavel}</span>}
                            {acao.prazo && <span className="text-xs text-gray-400">até {new Date(acao.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                          </div>
                          {acao.meta && <p className="text-xs text-gray-500 mt-1"><strong>Meta:</strong> {acao.meta}</p>}
                          {acao.intervencao && <p className="text-xs text-gray-500 mt-0.5"><strong>Intervenção:</strong> {acao.intervencao}</p>}
                        </div>
                      </div>
                      <button onClick={() => excluirAcao(acao.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulário nova ação */}
              {adicionandoAcao === pas.id ? (
                <div className="border border-dashed border-primary-300 rounded-lg p-4 bg-primary-50/30">
                  <p className="text-sm font-medium text-gray-700 mb-3">Nova ação</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Área profissional</label>
                      <select
                        value={novaAcao.area}
                        onChange={e => setNovaAcao(a => ({ ...a, area: e.target.value as AreaProfissional }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {(Object.keys(AREA_LABEL) as AreaProfissional[]).map(a => (
                          <option key={a} value={a}>{AREA_LABEL[a]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Responsável</label>
                      <input value={novaAcao.responsavel} onChange={e => setNovaAcao(a => ({ ...a, responsavel: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nome do responsável" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Objetivo *</label>
                      <input value={novaAcao.objetivo} onChange={e => setNovaAcao(a => ({ ...a, objetivo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Descreva o objetivo da ação" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Meta</label>
                      <input value={novaAcao.meta} onChange={e => setNovaAcao(a => ({ ...a, meta: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Meta mensurável" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Intervenção</label>
                      <input value={novaAcao.intervencao} onChange={e => setNovaAcao(a => ({ ...a, intervencao: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ação / intervenção proposta" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Prazo</label>
                      <input type="date" value={novaAcao.prazo} onChange={e => setNovaAcao(a => ({ ...a, prazo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => { setAdicionandoAcao(null); setNovaAcao(ACAO_VAZIA) }}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">Cancelar</button>
                    <button onClick={() => salvarAcao(pas.id)} disabled={salvando || !novaAcao.objetivo.trim()}
                      className="text-sm bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 font-medium">
                      {salvando ? 'Salvando...' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setAdicionandoAcao(pas.id); setNovaAcao(ACAO_VAZIA) }}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 border border-dashed border-primary-300 rounded-lg px-4 py-2 w-full justify-center hover:bg-primary-50 transition-colors"
                >
                  <Plus size={14} /> Adicionar ação
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
