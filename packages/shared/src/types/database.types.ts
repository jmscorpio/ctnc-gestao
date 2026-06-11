export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'diretor' | 'coordenador' | 'medico' | 'enfermeiro' | 'psicologo' | 'assistente_social' | 'recepcionista'
export type AcolhidoStatus = 'ativo' | 'alta' | 'desligado' | 'transferido' | 'obito'
export type Sexo = 'masculino' | 'feminino' | 'outro'
export type EstadoCivil = 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel' | 'outro'
export type Escolaridade =
  | 'sem_escolaridade' | 'fundamental_incompleto' | 'fundamental_completo'
  | 'medio_incompleto' | 'medio_completo' | 'superior_incompleto' | 'superior_completo' | 'pos_graduacao'

// Migration 002
export type TriagemTipo = 'assist' | 'audit'
export type RiscoNivelDb = 'baixo' | 'moderado' | 'alto' | 'muito_alto'

// Migration 003
export type PasStatus = 'ativo' | 'concluido' | 'cancelado'
export type PasAcaoStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
export type FaseTratamento = 'acolhimento' | 'estabilizacao' | 'desintoxicacao' | 'reabilitacao' | 'reinsercao_social'
export type RegistroTipo = 'evolucao_clinica' | 'atendimento_individual' | 'atendimento_grupo' | 'demanda' | 'outro'
export type AreaProfissional = 'medico' | 'enfermagem' | 'psicologia' | 'assistencia_social' | 'terapia_ocupacional' | 'educacao_fisica' | 'outros'
export type IntercorrenciaTipo = 'saude' | 'comportamental' | 'fuga' | 'agressao' | 'acidente' | 'outro'
export type IntercorrenciaGravidade = 'leve' | 'moderada' | 'grave'

// Migration 004
export type VisitaTipo = 'familiar' | 'ressocializacao' | 'institucional' | 'outro'
export type VisitaStatus = 'agendada' | 'realizada' | 'cancelada' | 'nao_compareceu'
export type AtividadeTipo = 'terapeutica' | 'educativa' | 'laboral' | 'religiosa' | 'recreativa' | 'esportiva' | 'cultural' | 'outro'
export type PresencaStatus = 'presente' | 'ausente' | 'justificado'

// Migration 006
export type FinanceiroTipo = 'receita' | 'despesa'
export type ConvenioTipo = 'municipal' | 'estadual' | 'federal' | 'privado' | 'religioso' | 'filantropia' | 'outro'

// Migration 005
export type DocumentoTipo =
  | 'termo_acolhimento' | 'termo_adesao' | 'contrato_permanencia'
  | 'declaracao_desligamento' | 'declaracao_conclusao' | 'certificado_conclusao'
  | 'termo_senapred' | 'autorizacao_imagem' | 'triagem_pertences' | 'normas_visita' | 'outro'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          email: string | null
          telefone: string | null
          endereco: Json | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          email?: string | null
          telefone?: string | null
          endereco?: Json | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          tenant_id: string
          role: UserRole
          nome: string
          email: string
          telefone: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          role: UserRole
          nome: string
          email: string
          telefone?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      acolhidos: {
        Row: {
          id: string
          tenant_id: string
          numero_prontuario: string
          status: AcolhidoStatus
          nome: string
          nome_social: string | null
          data_nascimento: string
          sexo: Sexo
          estado_civil: EstadoCivil | null
          escolaridade: Escolaridade | null
          profissao: string | null
          naturalidade: string | null
          nacionalidade: string
          cpf: string | null
          rg: string | null
          rg_orgao_emissor: string | null
          foto_url: string | null
          data_acolhimento: string
          data_saida: string | null
          motivo_saida: string | null
          observacoes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          numero_prontuario?: string
          status?: AcolhidoStatus
          nome: string
          nome_social?: string | null
          data_nascimento: string
          sexo: Sexo
          estado_civil?: EstadoCivil | null
          escolaridade?: Escolaridade | null
          profissao?: string | null
          naturalidade?: string | null
          nacionalidade?: string
          cpf?: string | null
          rg?: string | null
          rg_orgao_emissor?: string | null
          foto_url?: string | null
          data_acolhimento: string
          data_saida?: string | null
          motivo_saida?: string | null
          observacoes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['acolhidos']['Insert']>
        Relationships: []
      }
      acolhidos_contato: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          telefone: string | null
          celular: string | null
          email: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_complemento: string | null
          endereco_bairro: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_cep: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          telefone?: string | null
          celular?: string | null
          email?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_complemento?: string | null
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_cep?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['acolhidos_contato']['Insert']>
        Relationships: []
      }
      responsaveis: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          nome: string
          parentesco: string
          telefone: string | null
          celular: string | null
          email: string | null
          endereco: Json | null
          principal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          nome: string
          parentesco: string
          telefone?: string | null
          celular?: string | null
          email?: string | null
          endereco?: Json | null
          principal?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['responsaveis']['Insert']>
        Relationships: []
      }
      documentos: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          tipo: string
          numero: string | null
          arquivo_url: string | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          tipo: string
          numero?: string | null
          arquivo_url?: string | null
          observacoes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['documentos']['Insert']>
        Relationships: []
      }
      medicamentos: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          nome: string
          dosagem: string | null
          frequencia: string | null
          via_administracao: string | null
          prescrito_por: string | null
          inicio: string | null
          fim: string | null
          ativo: boolean
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          nome: string
          dosagem?: string | null
          frequencia?: string | null
          via_administracao?: string | null
          prescrito_por?: string | null
          inicio?: string | null
          fim?: string | null
          ativo?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['medicamentos']['Insert']>
        Relationships: []
      }
      historico_saude: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          substancias_uso: Json | null
          tempo_uso: string | null
          internacoes_anteriores: number | null
          alergias: string | null
          doencas_preexistentes: string | null
          medicamentos_anteriores: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          substancias_uso?: Json | null
          tempo_uso?: string | null
          internacoes_anteriores?: number | null
          alergias?: string | null
          doencas_preexistentes?: string | null
          medicamentos_anteriores?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['historico_saude']['Insert']>
        Relationships: []
      }
      advertencias: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          tipo: string
          descricao: string
          data_ocorrencia: string
          registrado_por: string
          created_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          tipo: string
          descricao: string
          data_ocorrencia: string
          registrado_por: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['advertencias']['Insert']>
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          acao: string
          tabela: string
          registro_id: string | null
          dados_antes: Json | null
          dados_depois: Json | null
          ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          acao: string
          tabela: string
          registro_id?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          ip?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      // Migration 002: Triagens
      triagens: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          tipo: TriagemTipo
          realizada_por: string | null
          realizada_em: string
          score_total: number | null
          nivel_risco: RiscoNivelDb | null
          observacoes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          tipo: TriagemTipo
          realizada_por?: string | null
          realizada_em?: string
          score_total?: number | null
          nivel_risco?: RiscoNivelDb | null
          observacoes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['triagens']['Insert']>
        Relationships: []
      }
      triagem_respostas: {
        Row: {
          id: string
          triagem_id: string
          questao_id: string
          resposta: number
          created_at: string
        }
        Insert: {
          id?: string
          triagem_id: string
          questao_id: string
          resposta: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['triagem_respostas']['Insert']>
        Relationships: []
      }
      assist_scores_substancia: {
        Row: {
          id: string
          triagem_id: string
          substancia: string
          score: number
          nivel_risco: RiscoNivelDb
          created_at: string
        }
        Insert: {
          id?: string
          triagem_id: string
          substancia: string
          score: number
          nivel_risco: RiscoNivelDb
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['assist_scores_substancia']['Insert']>
        Relationships: []
      }
      // Migration 003: Clínico
      pas: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          fase: FaseTratamento
          status: PasStatus
          data_inicio: string
          data_revisao: string | null
          data_conclusao: string | null
          objetivo_geral: string | null
          observacoes: string | null
          elaborado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          fase?: FaseTratamento
          status?: PasStatus
          data_inicio?: string
          data_revisao?: string | null
          data_conclusao?: string | null
          objetivo_geral?: string | null
          observacoes?: string | null
          elaborado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pas']['Insert']>
        Relationships: []
      }
      pas_acoes: {
        Row: {
          id: string
          pas_id: string
          tenant_id: string
          area: AreaProfissional
          objetivo: string
          meta: string | null
          intervencao: string | null
          responsavel: string | null
          prazo: string | null
          status: PasAcaoStatus
          resultado: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pas_id: string
          tenant_id: string
          area: AreaProfissional
          objetivo: string
          meta?: string | null
          intervencao?: string | null
          responsavel?: string | null
          prazo?: string | null
          status?: PasAcaoStatus
          resultado?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pas_acoes']['Insert']>
        Relationships: []
      }
      registros_terapeuticos: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          tipo: RegistroTipo
          area: AreaProfissional
          data_registro: string
          profissional_nome: string | null
          conteudo: string
          participantes: number | null
          atividade_nome: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          tipo: RegistroTipo
          area: AreaProfissional
          data_registro?: string
          profissional_nome?: string | null
          conteudo: string
          participantes?: number | null
          atividade_nome?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['registros_terapeuticos']['Insert']>
        Relationships: []
      }
      intercorrencias: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          tipo: IntercorrenciaTipo
          gravidade: IntercorrenciaGravidade
          data_ocorrencia: string
          hora_ocorrencia: string | null
          descricao: string
          medidas_tomadas: string | null
          encaminhamento: string | null
          registrado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          tipo: IntercorrenciaTipo
          gravidade?: IntercorrenciaGravidade
          data_ocorrencia?: string
          hora_ocorrencia?: string | null
          descricao: string
          medidas_tomadas?: string | null
          encaminhamento?: string | null
          registrado_por?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['intercorrencias']['Insert']>
        Relationships: []
      }
      // Migration 004: Operacional
      visitas: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          tipo: VisitaTipo
          status: VisitaStatus
          visitante_nome: string
          vinculo: string | null
          data_visita: string
          hora_prevista: string | null
          hora_entrada: string | null
          hora_saida: string | null
          local_visita: string | null
          autorizado_por: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          tipo?: VisitaTipo
          status?: VisitaStatus
          visitante_nome: string
          vinculo?: string | null
          data_visita: string
          hora_prevista?: string | null
          hora_entrada?: string | null
          hora_saida?: string | null
          local_visita?: string | null
          autorizado_por?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['visitas']['Insert']>
        Relationships: []
      }
      atividades: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          descricao: string | null
          tipo: AtividadeTipo
          area: AreaProfissional | null
          responsavel_nome: string | null
          duracao_min: number | null
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          descricao?: string | null
          tipo?: AtividadeTipo
          area?: AreaProfissional | null
          responsavel_nome?: string | null
          duracao_min?: number | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['atividades']['Insert']>
        Relationships: []
      }
      agenda_atividades: {
        Row: {
          id: string
          tenant_id: string
          atividade_id: string | null
          titulo: string
          data_atividade: string
          hora_inicio: string | null
          hora_fim: string | null
          local: string | null
          responsavel_nome: string | null
          observacoes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          atividade_id?: string | null
          titulo: string
          data_atividade: string
          hora_inicio?: string | null
          hora_fim?: string | null
          local?: string | null
          responsavel_nome?: string | null
          observacoes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['agenda_atividades']['Insert']>
        Relationships: []
      }
      presencas: {
        Row: {
          id: string
          agenda_id: string
          acolhido_id: string
          tenant_id: string
          status: PresencaStatus
          justificativa: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agenda_id: string
          acolhido_id: string
          tenant_id: string
          status?: PresencaStatus
          justificativa?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['presencas']['Insert']>
        Relationships: []
      }
      // Migration 006: Financeiro
      convenios: {
        Row: {
          id: string
          tenant_id: string
          nome: string
          tipo: ConvenioTipo
          orgao_responsavel: string | null
          numero_processo: string | null
          valor_mensal: number
          data_inicio: string
          data_fim: string | null
          ativo: boolean
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nome: string
          tipo?: ConvenioTipo
          orgao_responsavel?: string | null
          numero_processo?: string | null
          valor_mensal?: number
          data_inicio: string
          data_fim?: string | null
          ativo?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['convenios']['Insert']>
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          id: string
          tenant_id: string
          tipo: FinanceiroTipo
          nome: string
          cor: string
          ativa: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          tipo: FinanceiroTipo
          nome: string
          cor?: string
          ativa?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['categorias_financeiras']['Insert']>
        Relationships: []
      }
      lancamentos_financeiros: {
        Row: {
          id: string
          tenant_id: string
          tipo: FinanceiroTipo
          categoria_id: string | null
          convenio_id: string | null
          data: string
          valor: number
          descricao: string
          comprovante_url: string | null
          registrado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          tipo: FinanceiroTipo
          categoria_id?: string | null
          convenio_id?: string | null
          data?: string
          valor: number
          descricao: string
          comprovante_url?: string | null
          registrado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['lancamentos_financeiros']['Insert']>
        Relationships: []
      }
      // Migration 005: Documentos gerados
      documentos_gerados: {
        Row: {
          id: string
          acolhido_id: string
          tenant_id: string
          tipo: DocumentoTipo
          titulo: string
          gerado_por: string | null
          gerado_em: string
          observacoes: string | null
        }
        Insert: {
          id?: string
          acolhido_id: string
          tenant_id: string
          tipo: DocumentoTipo
          titulo: string
          gerado_por?: string | null
          gerado_em?: string
          observacoes?: string | null
        }
        Update: Partial<Database['public']['Tables']['documentos_gerados']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
