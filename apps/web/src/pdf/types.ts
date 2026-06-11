export interface TenantInfo {
  nome: string
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: { logradouro?: string; cidade?: string; estado?: string } | null
}

export interface AcolhidoInfo {
  id: string
  nome: string
  nome_social?: string | null
  numero_prontuario: string
  data_nascimento?: string | null
  sexo?: string | null
  cpf?: string | null
  rg?: string | null
  rg_orgao_emissor?: string | null
  profissao?: string | null
  naturalidade?: string | null
  nacionalidade?: string | null
  data_acolhimento?: string | null
  data_saida?: string | null
  motivo_saida?: string | null
  foto_url?: string | null
  status?: string | null
  contato?: {
    telefone?: string | null
    celular?: string | null
    email?: string | null
    endereco_logradouro?: string | null
    endereco_numero?: string | null
    endereco_bairro?: string | null
    endereco_cidade?: string | null
    endereco_estado?: string | null
    endereco_cep?: string | null
  } | null
  responsavel?: {
    nome?: string | null
    parentesco?: string | null
    telefone?: string | null
    celular?: string | null
  } | null
}

export interface DocumentoProps {
  tenant: TenantInfo
  acolhido: AcolhidoInfo
}
