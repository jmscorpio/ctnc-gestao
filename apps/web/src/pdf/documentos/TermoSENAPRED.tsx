import { Document, Text, View } from '@react-pdf/renderer'
import { PaginaPadrao, Campo, TituloSecao, Paragrafo, LinhaAssinaturas, LocalData } from '../components'
import { base, formatarData, cores } from '../styles'
import { StyleSheet } from '@react-pdf/renderer'
import type { DocumentoProps } from '../types'

const s = StyleSheet.create({
  avisoOficial: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 3,
    padding: 8,
    marginBottom: 14,
  },
  avisoTexto: {
    fontSize: 8,
    color: '#92400e',
    textAlign: 'center',
  },
  caixaNumero: {
    borderWidth: 1,
    borderColor: cores.primario,
    borderRadius: 3,
    padding: 8,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: cores.texto,
    marginRight: 6,
  },
  checkboxTexto: {
    fontSize: 9,
  },
  tabelaRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    paddingVertical: 3,
  },
  tabelaLabel: {
    width: '30%',
    fontSize: 8,
    color: cores.textoSuave,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tabelaValor: {
    flex: 1,
    fontSize: 9,
  },
})

function CheckItem({ label }: { label: string }) {
  return (
    <View style={s.itemCheckbox}>
      <View style={s.checkbox} />
      <Text style={s.checkboxTexto}>{label}</Text>
    </View>
  )
}

function TabelaRow({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <View style={s.tabelaRow}>
      <Text style={s.tabelaLabel}>{label}</Text>
      <Text style={s.tabelaValor}>{valor ?? ''}</Text>
    </View>
  )
}

export function TermoSENAPRED({ tenant, acolhido }: DocumentoProps) {
  const endereco = acolhido.contato
    ? [acolhido.contato.endereco_logradouro, acolhido.contato.endereco_numero, acolhido.contato.endereco_bairro].filter(Boolean).join(', ')
    : ''

  return (
    <Document>
      <PaginaPadrao tenant={tenant} tituloDoc="Ficha de Acolhimento — SENAPRED" numeroProntuario={acolhido.numero_prontuario}>

        <View style={s.avisoOficial}>
          <Text style={s.avisoTexto}>
            SECRETARIA NACIONAL DE POLÍTICAS SOBRE DROGAS E GESTÃO DE ATIVOS — SENAPRED{'\n'}
            Ministério da Justiça e Segurança Pública — Ficha de Acolhimento para Comunidade Terapêutica
          </Text>
        </View>

        <Text style={base.titulo}>Ficha de Acolhimento</Text>
        <Text style={base.subtitulo}>Conforme Resolução CONAD nº 1/2015 e IN SENAPRED</Text>

        {/* Identificação da CT */}
        <View style={base.secao}>
          <TituloSecao>I — IDENTIFICAÇÃO DA ENTIDADE</TituloSecao>
          <View style={s.caixaNumero}>
            <View style={{ flex: 1 }}>
              <TabelaRow label="Razão Social" valor={tenant.nome} />
              <TabelaRow label="CNPJ" valor={tenant.cnpj} />
              <TabelaRow label="Telefone" valor={tenant.telefone} />
              <TabelaRow label="E-mail" valor={tenant.email} />
            </View>
          </View>
        </View>

        {/* Identificação do residente */}
        <View style={base.secao}>
          <TituloSecao>II — IDENTIFICAÇÃO DO RESIDENTE</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Nome completo" valor={acolhido.nome} flex={3} />
            <Campo rotulo="Nº Prontuário" valor={acolhido.numero_prontuario} />
          </View>
          {acolhido.nome_social && (
            <View style={base.linha}>
              <Campo rotulo="Nome social" valor={acolhido.nome_social} />
            </View>
          )}
          <View style={base.linha}>
            <Campo rotulo="Data de nascimento" valor={formatarData(acolhido.data_nascimento)} />
            <Campo rotulo="Sexo" valor={acolhido.sexo} />
            <Campo rotulo="Nacionalidade" valor={acolhido.nacionalidade} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="CPF" valor={acolhido.cpf} />
            <Campo rotulo="RG" valor={acolhido.rg} />
            <Campo rotulo="Órgão emissor/UF" valor={acolhido.rg_orgao_emissor} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="Endereço" valor={endereco} flex={3} />
            <Campo rotulo="CEP" valor={acolhido.contato?.endereco_cep} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="Município" valor={acolhido.contato?.endereco_cidade} flex={2} />
            <Campo rotulo="UF" valor={acolhido.contato?.endereco_estado} />
            <Campo rotulo="Telefone/Celular" valor={acolhido.contato?.celular ?? acolhido.contato?.telefone} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="Profissão/Ocupação" valor={acolhido.profissao} />
            <Campo rotulo="Naturalidade" valor={acolhido.naturalidade} />
          </View>
        </View>

        {/* Responsável */}
        {acolhido.responsavel && (
          <View style={base.secao}>
            <TituloSecao>III — RESPONSÁVEL LEGAL</TituloSecao>
            <View style={base.linha}>
              <Campo rotulo="Nome" valor={acolhido.responsavel.nome} flex={2} />
              <Campo rotulo="Grau de parentesco" valor={acolhido.responsavel.parentesco} />
            </View>
            <View style={base.linha}>
              <Campo rotulo="Telefone" valor={acolhido.responsavel.telefone} />
              <Campo rotulo="Celular" valor={acolhido.responsavel.celular} />
            </View>
          </View>
        )}

        {/* Dados do acolhimento */}
        <View style={base.secao}>
          <TituloSecao>IV — DADOS DO ACOLHIMENTO</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Data de entrada" valor={formatarData(acolhido.data_acolhimento)} />
            <Campo rotulo="Data de saída" valor={formatarData(acolhido.data_saida)} />
            <Campo rotulo="Motivo da saída" valor={acolhido.motivo_saida} flex={2} />
          </View>
        </View>

        {/* Natureza do acolhimento */}
        <View style={base.secao}>
          <TituloSecao>V — NATUREZA DO ACOLHIMENTO</TituloSecao>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={[base.rotulo, { marginBottom: 6 }]}>Tipo de encaminhamento:</Text>
              <CheckItem label="Espontâneo / voluntário" />
              <CheckItem label="Encaminhamento da rede de saúde (CAPS, UBS, Hospital)" />
              <CheckItem label="Encaminhamento do sistema de justiça (APAC, CREAS, etc.)" />
              <CheckItem label="Encaminhamento familiar" />
              <CheckItem label="Outro" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[base.rotulo, { marginBottom: 6 }]}>Substância(s) principal(is) de uso:</Text>
              <CheckItem label="Álcool" />
              <CheckItem label="Crack / Cocaína" />
              <CheckItem label="Cannabis" />
              <CheckItem label="Tabaco" />
              <CheckItem label="Medicamento (benzodiazepínico, etc.)" />
              <CheckItem label="Outra(s)" />
            </View>
          </View>
        </View>

        {/* Declaração de voluntariedade */}
        <View style={base.secao}>
          <TituloSecao>VI — DECLARAÇÃO DE VOLUNTARIEDADE E CONSENTIMENTO</TituloSecao>
          <Paragrafo>
            Eu, {acolhido.nome}, declaro que estou sendo acolhido(a) VOLUNTARIAMENTE na {tenant.nome}, estando ciente de que o tratamento em Comunidade Terapêutica tem natureza voluntária, conforme preconizado pela Resolução CONAD nº 1, de 19 de agosto de 2015, e que posso solicitar minha saída a qualquer momento, observadas as orientações da equipe técnica.
          </Paragrafo>
          <Paragrafo>
            Declaro ainda que fui informado(a) sobre: (i) o Projeto Terapêutico da entidade; (ii) os direitos e deveres dos residentes; (iii) as normas de convivência; (iv) a política de sigilo e proteção de dados (LGPD); e (v) os canais de ouvidoria disponíveis.
          </Paragrafo>
        </View>

        <LocalData cidade={acolhido.contato?.endereco_cidade} />

        <LinhaAssinaturas assinaturas={[
          { label: 'Assinatura do Residente', nome: acolhido.nome },
          { label: 'Coordenador(a) / Diretor(a) Técnico(a)' },
        ]} />

        {acolhido.responsavel?.nome && (
          <LinhaAssinaturas assinaturas={[
            { label: `${acolhido.responsavel.parentesco ?? 'Responsável'}: ${acolhido.responsavel.nome}` },
            { label: 'Testemunha' },
          ]} />
        )}

      </PaginaPadrao>
    </Document>
  )
}
