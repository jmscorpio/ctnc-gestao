import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Database, AcolhidoStatus } from '@ctnc/shared'
import { TabDados } from './tabs/TabDados'
import { TabTriagens } from './tabs/TabTriagens'
import { TabPAS } from './tabs/TabPAS'
import { TabRegistros } from './tabs/TabRegistros'
import { TabOcorrencias } from './tabs/TabOcorrencias'
import { TabVisitas } from './tabs/TabVisitas'
// Carregada sob demanda: puxa o @react-pdf/renderer (pesado), então só
// baixa quando o usuário abre a aba Documentos — mantém o bundle inicial leve.
const TabDocumentos = lazy(() => import('./tabs/TabDocumentos').then(m => ({ default: m.TabDocumentos })))

type Acolhido = Database['public']['Tables']['acolhidos']['Row']
type Contato = Database['public']['Tables']['acolhidos_contato']['Row']
type Responsavel = Database['public']['Tables']['responsaveis']['Row']
type Medicamento = Database['public']['Tables']['medicamentos']['Row']
type Advertencia = Database['public']['Tables']['advertencias']['Row']

interface TriagemResumo {
  id: string
  tipo: 'assist' | 'audit'
  realizada_em: string
  score_total: number | null
  nivel_risco: string | null
}

const statusLabel: Record<AcolhidoStatus, string> = {
  ativo: 'Ativo', alta: 'Alta', desligado: 'Desligado', transferido: 'Transferido', obito: 'Óbito',
}

const statusColor: Record<AcolhidoStatus, string> = {
  ativo: 'bg-green-100 text-green-700',
  alta: 'bg-blue-100 text-blue-700',
  desligado: 'bg-red-100 text-red-700',
  transferido: 'bg-yellow-100 text-yellow-700',
  obito: 'bg-gray-100 text-gray-600',
}

type AbaId = 'dados' | 'triagens' | 'pas' | 'registros' | 'ocorrencias' | 'visitas' | 'documentos'

const ABAS: { id: AbaId; label: string }[] = [
  { id: 'dados', label: 'Dados' },
  { id: 'triagens', label: 'Triagens' },
  { id: 'pas', label: 'PAS' },
  { id: 'registros', label: 'Registros' },
  { id: 'ocorrencias', label: 'Ocorrências' },
  { id: 'visitas', label: 'Visitas' },
  { id: 'documentos', label: 'Documentos' },
]

export function AcolhidoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [acolhido, setAcolhido] = useState<Acolhido | null>(null)
  const [contato, setContato] = useState<Contato | null>(null)
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([])
  const [triagens, setTriagens] = useState<TriagemResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<AbaId>('dados')

  useEffect(() => {
    if (!id) return
    async function load() {
      const [a, c, r, m, adv, tri] = await Promise.all([
        supabase.from('acolhidos').select('*').eq('id', id!).single(),
        supabase.from('acolhidos_contato').select('*').eq('acolhido_id', id!).single(),
        supabase.from('responsaveis').select('*').eq('acolhido_id', id!),
        supabase.from('medicamentos').select('*').eq('acolhido_id', id!).eq('ativo', true),
        supabase.from('advertencias').select('*').eq('acolhido_id', id!).order('created_at', { ascending: false }),
        supabase.from('triagens').select('id, tipo, realizada_em, score_total, nivel_risco').eq('acolhido_id', id!).order('realizada_em', { ascending: false }),
      ])
      setAcolhido(a.data)
      setContato(c.data)
      setResponsaveis(r.data ?? [])
      setMedicamentos(m.data ?? [])
      setAdvertencias((adv.data ?? []) as Advertencia[])
      setTriagens((tri.data ?? []) as TriagemResumo[])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!acolhido) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Acolhido não encontrado.</p>
        <Link to="/acolhidos" className="text-primary-600 text-sm underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{acolhido.nome}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColor[acolhido.status]}`}>
              {statusLabel[acolhido.status]}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Prontuário {acolhido.numero_prontuario}</p>
        </div>
        <Link
          to={`/acolhidos/${id}/editar`}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors shrink-0"
        >
          <Edit size={15} /> Editar
        </Link>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {ABAS.map(a => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                aba === a.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da aba */}
      {aba === 'dados' && (
        <TabDados
          acolhido={acolhido}
          contato={contato}
          responsaveis={responsaveis}
          medicamentos={medicamentos}
          advertencias={advertencias}
        />
      )}
      {aba === 'triagens' && <TabTriagens acolhidoId={id!} triagens={triagens} />}
      {aba === 'pas' && <TabPAS acolhidoId={id!} />}
      {aba === 'registros' && <TabRegistros acolhidoId={id!} />}
      {aba === 'ocorrencias' && <TabOcorrencias acolhidoId={id!} />}
      {aba === 'visitas' && <TabVisitas acolhidoId={id!} />}
      {aba === 'documentos' && (
        <Suspense fallback={<div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <TabDocumentos acolhidoId={id!} />
        </Suspense>
      )}
    </div>
  )
}
