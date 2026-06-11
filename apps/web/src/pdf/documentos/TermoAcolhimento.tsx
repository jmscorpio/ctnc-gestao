import { Document, Text, View } from '@react-pdf/renderer'
import { PaginaPadrao, Campo, TituloSecao, Paragrafo, LinhaAssinaturas, LocalData } from '../components'
import { base, formatarData } from '../styles'
import type { DocumentoProps } from '../types'

export function TermoAcolhimento({ tenant, acolhido }: DocumentoProps) {
  const endereco = acolhido.contato
    ? [acolhido.contato.endereco_logradouro, acolhido.contato.endereco_numero, acolhido.contato.endereco_bairro, acolhido.contato.endereco_cidade, acolhido.contato.endereco_estado].filter(Boolean).join(', ')
    : ''

  return (
    <Document>
      <PaginaPadrao tenant={tenant} tituloDoc="Termo de Acolhimento" numeroProntuario={acolhido.numero_prontuario}>

        <Text style={base.titulo}>Termo de Acolhimento</Text>
        <Text style={base.subtitulo}>Comunidade Terapêutica — {tenant.nome}</Text>

        <View style={base.secao}>
          <TituloSecao>1. IDENTIFICAÇÃO DA COMUNIDADE TERAPÊUTICA</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Razão Social" valor={tenant.nome} flex={2} />
            <Campo rotulo="CNPJ" valor={tenant.cnpj} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="Telefone" valor={tenant.telefone} />
            <Campo rotulo="E-mail" valor={tenant.email} flex={2} />
          </View>
        </View>

        <View style={base.secao}>
          <TituloSecao>2. IDENTIFICAÇÃO DO ACOLHIDO</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Nome completo" valor={acolhido.nome} flex={3} />
            <Campo rotulo="Prontuário" valor={acolhido.numero_prontuario} />
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
            <Campo rotulo="Órgão emissor" valor={acolhido.rg_orgao_emissor} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="Profissão" valor={acolhido.profissao} />
            <Campo rotulo="Naturalidade" valor={acolhido.naturalidade} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="Endereço" valor={endereco} flex={3} />
            <Campo rotulo="CEP" valor={acolhido.contato?.endereco_cep} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="Telefone" valor={acolhido.contato?.telefone} />
            <Campo rotulo="Celular" valor={acolhido.contato?.celular} />
            <Campo rotulo="E-mail" valor={acolhido.contato?.email} flex={2} />
          </View>
        </View>

        {acolhido.responsavel && (
          <View style={base.secao}>
            <TituloSecao>3. RESPONSÁVEL / FAMILIAR</TituloSecao>
            <View style={base.linha}>
              <Campo rotulo="Nome" valor={acolhido.responsavel.nome} flex={2} />
              <Campo rotulo="Parentesco / Vínculo" valor={acolhido.responsavel.parentesco} />
            </View>
            <View style={base.linha}>
              <Campo rotulo="Telefone" valor={acolhido.responsavel.telefone} />
              <Campo rotulo="Celular" valor={acolhido.responsavel.celular} />
            </View>
          </View>
        )}

        <View style={base.secao}>
          <TituloSecao>4. DADOS DO ACOLHIMENTO</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Data de acolhimento" valor={formatarData(acolhido.data_acolhimento)} />
          </View>
        </View>

        <View style={base.secao}>
          <TituloSecao>5. DECLARAÇÃO</TituloSecao>
          <Paragrafo>
            Eu, {acolhido.nome}, portador(a) do CPF {acolhido.cpf ?? '___________________'}, declaro que aceito voluntariamente ser acolhido(a) na {tenant.nome}, estando ciente de que esta é uma instituição de caráter terapêutico, sem fins lucrativos, voltada ao tratamento e reabilitação de pessoas com transtornos decorrentes do uso, abuso ou dependência de substâncias psicoativas.
          </Paragrafo>
          <Paragrafo>
            Declaro ainda ter sido informado(a) sobre as normas e regulamento interno da CT, os direitos e deveres dos acolhidos, o caráter voluntário do tratamento, e que minha permanência está condicionada ao cumprimento das normas estabelecidas.
          </Paragrafo>
        </View>

        <LocalData cidade={acolhido.contato?.endereco_cidade} />

        <LinhaAssinaturas assinaturas={[
          { label: 'Assinatura do Acolhido', nome: acolhido.nome },
          { label: 'Responsável pela CT', nome: '' },
        ]} />
        {acolhido.responsavel?.nome && (
          <LinhaAssinaturas assinaturas={[
            { label: `${acolhido.responsavel.parentesco ?? 'Responsável'}: ${acolhido.responsavel.nome}`, nome: '' },
          ]} />
        )}

      </PaginaPadrao>
    </Document>
  )
}
