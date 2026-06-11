import { useEffect, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileText, Download, Clock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import type { TenantInfo, AcolhidoInfo } from '../../../pdf/types'
import { TermoAcolhimento } from '../../../pdf/documentos/TermoAcolhimento'
import { TermoAdesao } from '../../../pdf/documentos/TermoAdesao'
import { TermoSENAPRED } from '../../../pdf/documentos/TermoSENAPRED'
import { CertificadoConclusao } from '../../../pdf/documentos/CertificadoConclusao'
import { DeclaracaoDesligamento } from '../../../pdf/documentos/DeclaracaoDesligamento'
import { AutorizacaoImagem } from '../../../pdf/documentos/AutorizacaoImagem'
import type { Database } from '@ctnc/shared'

type DocGerado = { id: string; tipo: string; titulo: string; gerado_em: string }

interface DocumentoCatalogo {
  tipo: string
  titulo: string
  descricao: string
  categoria: 'entrada' | 'saida' | 'lgpd' | 'oficial'
  icone: string
  apenasComSaida?: boolean
}

const CATALOGO: DocumentoCatalogo[] = [
  { tipo: 'termo_acolhimento', titulo: 'Termo de Acolhimento', descricao: 'Documento de admissão com dados do acolhido e da CT', categoria: 'entrada', icone: '📋' },
  { tipo: 'termo_adesao', titulo: 'Termo de Adesão', descricao: 'Compromissos mútuos entre acolhido e CT', categoria: 'entrada', icone: '🤝' },
  { tipo: 'termo_senapred', titulo: 'Ficha SENAPRED', descricao: 'Formato oficial exigido pelo CONAD/SENAPRED', categoria: 'oficial', icone: '🏛️' },
  { tipo: 'autorizacao_imagem', titulo: 'Autorização de Imagem', descricao: 'Consentimento LGPD para uso de imagem e dados', categoria: 'lgpd', icone: '🔒' },
  { tipo: 'declaracao_desligamento', titulo: 'Declaração de Desligamento', descricao: 'Declara período de permanência e motivo da saída', categoria: 'saida', icone: '📄', apenasComSaida: true },
  { tipo: 'certificado_conclusao', titulo: 'Certificado de Conclusão', descricao: 'Reconhece a conclusão bem-sucedida do tratamento', categoria: 'saida', icone: '🏆', apenasComSaida: true },
]

const CATEGORIA_LABEL: Record<string, string> = {
  entrada: 'Documentos de Entrada',
  oficial: 'Documentos Oficiais',
  lgpd: 'Privacidade e LGPD',
  saida: 'Documentos de Saída / Alta',
}

const CATEGORIA_COR: Record<string, string> = {
  entrada: 'text-blue-600',
  oficial: 'text-purple-600',
  lgpd: 'text-green-600',
  saida: 'text-orange-600',
}

interface Props { acolhidoId: string }

function BotaoDownload({ tipo, titulo, tenant, acolhido, onGerado }: {
  tipo: string; titulo: string; tenant: TenantInfo; acolhido: AcolhidoInfo;
  onGerado: (tipo: string, titulo: string) => void
}) {
  const props = { tenant, acolhido }
  const nomeArquivo = `${titulo.replace(/\s+/g, '_')}_${acolhido.numero_prontuario}.pdf`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documentoMap: Record<string, React.ReactElement<any>> = {
    termo_acolhimento: <TermoAcolhimento {...props} />,
    termo_adesao: <TermoAdesao {...props} />,
    termo_senapred: <TermoSENAPRED {...props} />,
    autorizacao_imagem: <AutorizacaoImagem {...props} />,
    declaracao_desligamento: <DeclaracaoDesligamento {...props} />,
    certificado_conclusao: <CertificadoConclusao {...props} />,
  }

  const documento = documentoMap[tipo]
  if (!documento) return null

  return (
    <PDFDownloadLink document={documento} fileName={nomeArquivo} onClick={() => onGerado(tipo, titulo)}>
      {({ loading }) => (
        <button
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            loading
              ? 'border-gray-200 text-gray-400 bg-gray-50'
              : 'border-primary-300 text-primary-600 bg-primary-50 hover:bg-primary-100'
          }`}
        >
          {loading ? <Clock size={13} /> : <Download size={13} />}
          {loading ? 'Gerando...' : 'Baixar PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}

export function TabDocumentos({ acolhidoId }: Props) {
  const { profile } = useAuth()
  const [acolhido, setAcolhido] = useState<AcolhidoInfo | null>(null)
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [historico, setHistorico] = useState<DocGerado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const [{ data: ac }, { data: contato }, { data: resp }, { data: ten }, { data: hist }] = await Promise.all([
        supabase.from('acolhidos').select('*').eq('id', acolhidoId).single(),
        supabase.from('acolhidos_contato').select('*').eq('acolhido_id', acolhidoId).single(),
        supabase.from('responsaveis').select('*').eq('acolhido_id', acolhidoId).eq('principal', true).single(),
        supabase.from('tenants').select('*').eq('id', profile!.tenant_id).single(),
        supabase.from('documentos_gerados').select('id, tipo, titulo, gerado_em').eq('acolhido_id', acolhidoId).order('gerado_em', { ascending: false }).limit(20),
      ])

      if (ac && ten) {
        setAcolhido({
          ...ac,
          contato: contato ?? null,
          responsavel: resp ? { nome: resp.nome, parentesco: resp.parentesco, telefone: resp.telefone, celular: resp.celular } : null,
        } as AcolhidoInfo)

        const endereco = ten.endereco as { logradouro?: string; cidade?: string; estado?: string } | null
        setTenant({
          nome: ten.nome,
          cnpj: ten.cnpj,
          email: ten.email,
          telefone: ten.telefone,
          endereco,
        })
      }
      setHistorico((hist ?? []) as DocGerado[])
      setLoading(false)
    }
    load()
  }, [acolhidoId, profile])

  async function registrarGeracao(tipo: string, titulo: string) {
    if (!profile) return
    await supabase.from('documentos_gerados').insert({
      acolhido_id: acolhidoId,
      tenant_id: profile.tenant_id,
      tipo: tipo as Database['public']['Tables']['documentos_gerados']['Insert']['tipo'],
      titulo,
      gerado_por: profile.id,
    })
    const { data } = await supabase.from('documentos_gerados').select('id, tipo, titulo, gerado_em').eq('acolhido_id', acolhidoId).order('gerado_em', { ascending: false }).limit(20)
    setHistorico((data ?? []) as DocGerado[])
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!acolhido || !tenant) return <p className="text-gray-400 text-sm">Erro ao carregar dados.</p>

  const temSaida = Boolean(acolhido.data_saida)
  const categorias = [...new Set(CATALOGO.map(d => d.categoria))]

  return (
    <div className="space-y-6">
      {/* Catálogo de documentos */}
      {categorias.map(cat => {
        const docs = CATALOGO.filter(d => d.categoria === cat && (!d.apenasComSaida || temSaida))
        if (docs.length === 0) return null
        return (
          <div key={cat}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${CATEGORIA_COR[cat]}`}>
              {CATEGORIA_LABEL[cat]}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docs.map(doc => (
                <div key={doc.tipo} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{doc.icone}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{doc.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{doc.descricao}</p>
                    </div>
                  </div>
                  <BotaoDownload
                    tipo={doc.tipo}
                    titulo={doc.titulo}
                    tenant={tenant}
                    acolhido={acolhido}
                    onGerado={registrarGeracao}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Documentos de saída disponíveis apenas com data de saída */}
      {!temSaida && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-700 font-medium">Declaração de Desligamento e Certificado de Conclusão</p>
          <p className="text-xs text-orange-500 mt-1">Disponíveis após o registro da data de saída no cadastro do acolhido.</p>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Histórico de documentos gerados</h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Documento</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs hidden sm:table-cell">Gerado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historico.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span>{h.titulo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs hidden sm:table-cell">
                      {new Date(h.gerado_em).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
