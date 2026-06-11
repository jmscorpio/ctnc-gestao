import { MapPin, Phone, Pill, AlertTriangle, User, Users } from 'lucide-react'
import type { Database } from '@ctnc/shared'

type Acolhido = Database['public']['Tables']['acolhidos']['Row']
type Contato = Database['public']['Tables']['acolhidos_contato']['Row']
type Responsavel = Database['public']['Tables']['responsaveis']['Row']
type Medicamento = Database['public']['Tables']['medicamentos']['Row']
type Advertencia = Database['public']['Tables']['advertencias']['Row']

interface Props {
  acolhido: Acolhido
  contato: Contato | null
  responsaveis: Responsavel[]
  medicamentos: Medicamento[]
  advertencias: Advertencia[]
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

export function TabDados({ acolhido, contato, responsaveis, medicamentos, advertencias }: Props) {
  const idade = acolhido.data_nascimento
    ? Math.floor((Date.now() - new Date(acolhido.data_nascimento).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Dados pessoais */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-primary-600" />
            <h2 className="font-semibold text-gray-800">Dados Pessoais</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Data de nascimento" value={acolhido.data_nascimento ? new Date(acolhido.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : null} />
            {idade !== null && <InfoRow label="Idade" value={`${idade} anos`} />}
            <InfoRow label="Sexo" value={acolhido.sexo} />
            <InfoRow label="Estado civil" value={acolhido.estado_civil} />
            <InfoRow label="Escolaridade" value={acolhido.escolaridade} />
            <InfoRow label="Profissão" value={acolhido.profissao} />
            <InfoRow label="Naturalidade" value={acolhido.naturalidade} />
            <InfoRow label="Nacionalidade" value={acolhido.nacionalidade} />
            <InfoRow label="CPF" value={acolhido.cpf} />
            <InfoRow label="RG" value={acolhido.rg ? `${acolhido.rg}${acolhido.rg_orgao_emissor ? ' – ' + acolhido.rg_orgao_emissor : ''}` : null} />
            <InfoRow label="Acolhido em" value={acolhido.data_acolhimento ? new Date(acolhido.data_acolhimento + 'T00:00:00').toLocaleDateString('pt-BR') : null} />
          </div>
          {acolhido.observacoes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações</p>
              <p className="text-sm text-gray-700">{acolhido.observacoes}</p>
            </div>
          )}
        </div>

        {/* Contato */}
        {contato && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={16} className="text-primary-600" />
              <h2 className="font-semibold text-gray-800">Contato</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Telefone" value={contato.telefone} />
              <InfoRow label="Celular" value={contato.celular} />
              <InfoRow label="E-mail" value={contato.email} />
            </div>
            {contato.endereco_logradouro && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">
                  {[contato.endereco_logradouro, contato.endereco_numero, contato.endereco_bairro, contato.endereco_cidade, contato.endereco_estado].filter(Boolean).join(', ')}
                  {contato.endereco_cep ? ` — CEP ${contato.endereco_cep}` : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Medicamentos */}
        {medicamentos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Pill size={16} className="text-primary-600" />
              <h2 className="font-semibold text-gray-800">Medicamentos em uso</h2>
            </div>
            <div className="space-y-3">
              {medicamentos.map(m => (
                <div key={m.id} className="border border-gray-100 rounded-lg p-3">
                  <p className="font-medium text-sm text-gray-900">{m.nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[m.dosagem, m.frequencia, m.via_administracao].filter(Boolean).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advertências */}
        {advertencias.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-orange-500" />
              <h2 className="font-semibold text-gray-800">Advertências</h2>
            </div>
            <div className="space-y-2">
              {advertencias.map(a => (
                <div key={a.id} className="flex items-start gap-3 text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-400 text-xs mt-0.5 shrink-0">
                    {new Date(a.data_ocorrencia + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-gray-700">{a.descricao}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coluna lateral */}
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center">
          <div className="w-32 h-32 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
            {acolhido.foto_url
              ? <img src={acolhido.foto_url} alt="Foto" className="w-full h-full object-cover" />
              : <User size={40} className="text-gray-300" />}
          </div>
          {acolhido.nome_social && (
            <p className="text-sm text-gray-500 mt-2">Nome social: <span className="font-medium text-gray-700">{acolhido.nome_social}</span></p>
          )}
        </div>

        {responsaveis.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-primary-600" />
              <h2 className="font-semibold text-gray-800">Responsáveis</h2>
            </div>
            <div className="space-y-3">
              {responsaveis.map(r => (
                <div key={r.id}>
                  <p className="font-medium text-sm text-gray-900">{r.nome}</p>
                  <p className="text-xs text-gray-500">{r.parentesco}</p>
                  {r.celular && <p className="text-xs text-gray-500">{r.celular}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
