import { Document, Text, View } from '@react-pdf/renderer'
import { PaginaPadrao, Campo, TituloSecao, Paragrafo, LinhaAssinaturas, LocalData } from '../components'
import { base, formatarData } from '../styles'
import type { DocumentoProps } from '../types'

export function DeclaracaoDesligamento({ tenant, acolhido }: DocumentoProps) {
  const dataBase = acolhido.data_acolhimento
    ? new Date(acolhido.data_acolhimento + 'T00:00:00')
    : null
  const dataSaida = acolhido.data_saida
    ? new Date(acolhido.data_saida + 'T00:00:00')
    : new Date()
  const diasTratamento = dataBase
    ? Math.round((dataSaida.getTime() - dataBase.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Document>
      <PaginaPadrao tenant={tenant} tituloDoc="Declaração de Desligamento" numeroProntuario={acolhido.numero_prontuario}>

        <Text style={base.titulo}>Declaração de Desligamento</Text>
        <Text style={base.subtitulo}>Comunidade Terapêutica — {tenant.nome}</Text>

        <View style={base.secao}>
          <TituloSecao>IDENTIFICAÇÃO</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Nome" valor={acolhido.nome} flex={3} />
            <Campo rotulo="Prontuário" valor={acolhido.numero_prontuario} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="CPF" valor={acolhido.cpf} />
            <Campo rotulo="Data de entrada" valor={formatarData(acolhido.data_acolhimento)} />
            <Campo rotulo="Data de saída" valor={formatarData(acolhido.data_saida)} />
          </View>
          {diasTratamento !== null && (
            <View style={base.linha}>
              <Campo rotulo="Tempo de permanência" valor={`${diasTratamento} dias`} />
              <Campo rotulo="Motivo do desligamento" valor={acolhido.motivo_saida} flex={3} />
            </View>
          )}
        </View>

        <View style={base.secao}>
          <TituloSecao>DECLARAÇÃO</TituloSecao>
          <Paragrafo>
            A {tenant.nome} declara, para os devidos fins, que {acolhido.nome}, portador(a) do CPF {acolhido.cpf ?? '___________________'}, esteve acolhido(a) nesta instituição no período de {formatarData(acolhido.data_acolhimento)} a {formatarData(acolhido.data_saida)}{diasTratamento !== null ? `, totalizando ${diasTratamento} dias de tratamento` : ''}.
          </Paragrafo>
          <Paragrafo>
            O desligamento ocorreu por: {acolhido.motivo_saida ?? '_____________________________________________'}.
          </Paragrafo>
          <Paragrafo>
            Durante sua permanência, o(a) acolhido(a) participou do programa terapêutico oferecido pela instituição, em conformidade com a Resolução CONAD nº 1/2015 e demais normativas aplicáveis.
          </Paragrafo>
          <Paragrafo>
            Declaramos que foram devolvidos todos os pertences pessoais do(a) acolhido(a) registrados na triagem de entrada, não havendo pendências a regularizar nesta data.
          </Paragrafo>
        </View>

        <LocalData cidade={acolhido.contato?.endereco_cidade} />

        <LinhaAssinaturas assinaturas={[
          { label: 'Assinatura do Acolhido / Responsável', nome: acolhido.nome },
          { label: 'Diretor(a) Responsável', nome: tenant.nome },
        ]} />

      </PaginaPadrao>
    </Document>
  )
}
