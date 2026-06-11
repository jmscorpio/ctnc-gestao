import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type PresencaStatus = 'presente' | 'ausente' | 'justificado'

interface AgendaEvento {
  id: string
  titulo: string
  data_atividade: string
  hora_inicio: string | null
  local: string | null
}

interface AcolhidoAtivo {
  id: string
  nome: string
  numero_prontuario: string
  foto_url: string | null
}

interface PresencaItem {
  acolhidoId: string
  status: PresencaStatus
  justificativa: string
  presencaId: string | null
}

const STATUS_ICONE: Record<PresencaStatus, React.ReactNode> = {
  presente: <CheckCircle2 size={20} className="text-green-500" />,
  ausente: <XCircle size={20} className="text-red-400" />,
  justificado: <MinusCircle size={20} className="text-yellow-500" />,
}

const STATUS_COR: Record<PresencaStatus, string> = {
  presente: 'border-green-300 bg-green-50',
  ausente: 'border-red-200 bg-red-50',
  justificado: 'border-yellow-200 bg-yellow-50',
}

export function PresencaPage() {
  const { id: agendaId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [evento, setEvento] = useState<AgendaEvento | null>(null)
  const [acolhidos, setAcolhidos] = useState<AcolhidoAtivo[]>([])
  const [presencas, setPresencas] = useState<Record<string, PresencaItem>>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!profile || !agendaId) return
    async function load() {
      const [{ data: ev }, { data: acols }, { data: pres }] = await Promise.all([
        supabase.from('agenda_atividades').select('id, titulo, data_atividade, hora_inicio, local').eq('id', agendaId!).single(),
        supabase.from('acolhidos').select('id, nome, numero_prontuario, foto_url').eq('tenant_id', profile!.tenant_id).eq('status', 'ativo').order('nome'),
        supabase.from('presencas').select('id, acolhido_id, status, justificativa').eq('agenda_id', agendaId!),
      ])
      setEvento(ev as AgendaEvento)
      setAcolhidos((acols ?? []) as AcolhidoAtivo[])

      const mapa: Record<string, PresencaItem> = {}
      for (const a of (acols ?? [])) {
        const p = (pres ?? []).find((x: { acolhido_id: string }) => x.acolhido_id === a.id) as { id: string; status: PresencaStatus; justificativa: string } | undefined
        mapa[a.id] = { acolhidoId: a.id, status: p?.status ?? 'presente', justificativa: p?.justificativa ?? '', presencaId: p?.id ?? null }
      }
      setPresencas(mapa)
      setLoading(false)
    }
    load()
  }, [agendaId, profile])

  function ciclarStatus(acolhidoId: string) {
    const ordem: PresencaStatus[] = ['presente', 'ausente', 'justificado']
    setPresencas(p => {
      const atual = p[acolhidoId].status
      const prox = ordem[(ordem.indexOf(atual) + 1) % ordem.length]
      return { ...p, [acolhidoId]: { ...p[acolhidoId], status: prox } }
    })
  }

  async function salvar() {
    if (!profile || !agendaId) return
    setSalvando(true)
    const items = Object.values(presencas)

    const novas = items.filter(p => !p.presencaId).map(p => ({
      agenda_id: agendaId,
      acolhido_id: p.acolhidoId,
      tenant_id: profile.tenant_id,
      status: p.status,
      justificativa: p.justificativa || null,
    }))
    const atualizacoes = items.filter(p => p.presencaId)

    if (novas.length > 0) await supabase.from('presencas').insert(novas)
    for (const p of atualizacoes) {
      await supabase.from('presencas').update({ status: p.status, justificativa: p.justificativa || null }).eq('id', p.presencaId!)
    }
    setSalvando(false)
    navigate('/atividades')
  }

  const acolhidosFiltrados = acolhidos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) || a.numero_prontuario.includes(busca)
  )
  const totalPresentes = Object.values(presencas).filter(p => p.status === 'presente').length

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} /> Voltar
      </button>

      {evento && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h1 className="text-xl font-bold text-gray-900">{evento.titulo}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            <span>{new Date(evento.data_atividade + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            {evento.hora_inicio && <span>{evento.hora_inicio.slice(0, 5)}</span>}
            {evento.local && <span>{evento.local}</span>}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-green-600">{totalPresentes} presentes</span>
            <span className="text-sm text-gray-400">de {acolhidos.length} acolhidos ativos</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Buscar acolhido..." />
      </div>

      <p className="text-xs text-gray-400 mb-3">Toque no ícone para alternar: Presente → Ausente → Justificado</p>

      <div className="space-y-2 mb-6">
        {acolhidosFiltrados.map(a => {
          const p = presencas[a.id]
          if (!p) return null
          return (
            <div key={a.id} className={`border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors ${STATUS_COR[p.status]}`}>
              <button onClick={() => ciclarStatus(a.id)} className="shrink-0">
                {STATUS_ICONE[p.status]}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{a.nome}</p>
                <p className="text-xs text-gray-400">{a.numero_prontuario}</p>
              </div>
              {p.status === 'justificado' && (
                <input
                  value={p.justificativa}
                  onChange={e => setPresencas(prev => ({ ...prev, [a.id]: { ...prev[a.id], justificativa: e.target.value } }))}
                  onClick={e => e.stopPropagation()}
                  className="text-xs border border-yellow-300 rounded-lg px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-yellow-400 bg-white"
                  placeholder="Justificativa..."
                />
              )}
            </div>
          )
        })}
      </div>

      <button onClick={salvar} disabled={salvando}
        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg py-3 text-sm transition-colors">
        <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar lista de presença'}
      </button>
    </div>
  )
}
