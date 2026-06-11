import { Document, Text, View } from '@react-pdf/renderer'
import { PaginaPadrao, Campo, TituloSecao, Paragrafo, LinhaAssinaturas, LocalData } from '../components'
import { base, formatarData } from '../styles'
import type { DocumentoProps } from '../types'

export function AutorizacaoImagem({ tenant, acolhido }: DocumentoProps) {
  return (
    <Document>
      <PaginaPadrao tenant={tenant} tituloDoc="Autorização de Uso de Imagem" numeroProntuario={acolhido.numero_prontuario}>

        <Text style={base.titulo}>Autorização de Uso de Imagem</Text>
        <Text style={base.subtitulo}>Comunidade Terapêutica — {tenant.nome}</Text>

        <View style={base.secao}>
          <TituloSecao>IDENTIFICAÇÃO</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Nome" valor={acolhido.nome} flex={3} />
            <Campo rotulo="Prontuário" valor={acolhido.numero_prontuario} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="CPF" valor={acolhido.cpf} />
            <Campo rotulo="Data de nascimento" valor={formatarData(acolhido.data_nascimento)} />
          </View>
        </View>

        <View style={base.secao}>
          <TituloSecao>AUTORIZAÇÃO</TituloSecao>
          <Paragrafo>
            Eu, {acolhido.nome}, portador(a) do CPF {acolhido.cpf ?? '___________________'}, AUTORIZO a {tenant.nome} a capturar, utilizar e armazenar minha imagem (fotografia e/ou vídeo) para fins exclusivamente institucionais, tais como:
          </Paragrafo>
          {[
            'a) Identificação no prontuário eletrônico e documentos internos da CT;',
            'b) Relatórios e documentos exigidos por órgãos fiscalizadores (SENAPRED, ANVISA, CONAD);',
            'c) Materiais educativos e de divulgação institucional, desde que sem identificação pessoal quando se tratar de publicação externa.',
          ].map((item, i) => (
            <Paragrafo key={i}>{item}</Paragrafo>
          ))}
          <Paragrafo>
            A presente autorização é concedida sem ônus financeiro e poderá ser revogada a qualquer momento mediante comunicação escrita à direção da CT.
          </Paragrafo>
          <Paragrafo>
            Declaro que esta autorização está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD) e com o Marco Civil da Internet.
          </Paragrafo>
        </View>

        <LocalData cidade={acolhido.contato?.endereco_cidade} />

        <LinhaAssinaturas assinaturas={[
          { label: 'Assinatura do Autorizante', nome: acolhido.nome },
          { label: 'Responsável pela CT' },
        ]} />
        {acolhido.responsavel?.nome && (
          <LinhaAssinaturas assinaturas={[
            { label: `${acolhido.responsavel.parentesco ?? 'Responsável'}: ${acolhido.responsavel.nome}` },
          ]} />
        )}

      </PaginaPadrao>
    </Document>
  )
}
