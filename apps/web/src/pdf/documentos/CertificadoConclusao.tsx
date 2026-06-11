import { Document, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Cabecalho, Rodape, LinhaAssinaturas, LocalData } from '../components'
import { base, formatarData, cores } from '../styles'
import type { DocumentoProps } from '../types'

const s = StyleSheet.create({
  pagina: {
    ...base.pagina,
    paddingTop: 50,
  },
  moldura: {
    borderWidth: 3,
    borderColor: cores.primario,
    borderRadius: 8,
    padding: 30,
    margin: 10,
    alignItems: 'center',
  },
  tituloCert: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: cores.primario,
    textTransform: 'uppercase',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtituloCert: {
    fontSize: 11,
    color: cores.textoSuave,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  textoPreambulo: {
    fontSize: 11,
    textAlign: 'center',
    color: cores.textoSuave,
    marginBottom: 8,
  },
  nomeDestaque: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: cores.texto,
    textAlign: 'center',
    marginVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: cores.primario,
    paddingBottom: 8,
  },
  textoConclusao: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 1.7,
    marginVertical: 12,
    maxWidth: 420,
  },
  dataDestaque: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: cores.primario,
    marginVertical: 8,
  },
  prontuario: {
    fontSize: 8,
    color: cores.textoSuave,
    textAlign: 'center',
    marginTop: 12,
  },
  ornamento: {
    fontSize: 20,
    color: cores.primario,
    textAlign: 'center',
    marginVertical: 8,
  },
})

export function CertificadoConclusao({ tenant, acolhido }: DocumentoProps) {
  return (
    <Document>
      <View style={s.pagina}>
        <Cabecalho tenant={tenant} tituloDoc="Certificado de Conclusão" />

        <View style={s.moldura}>
          <Text style={s.ornamento}>✦ ✦ ✦</Text>
          <Text style={s.tituloCert}>Certificado de Conclusão</Text>
          <Text style={s.subtituloCert}>de Tratamento em Comunidade Terapêutica</Text>

          <Text style={s.textoPreambulo}>A {tenant.nome} certifica que</Text>

          <Text style={s.nomeDestaque}>{acolhido.nome}</Text>

          <Text style={s.textoConclusao}>
            concluiu com êxito o programa de tratamento e reabilitação para pessoas com transtornos decorrentes do uso, abuso ou dependência de substâncias psicoativas, desenvolvendo habilidades para a sobriedade, reinserção social e qualidade de vida.
          </Text>

          <Text style={s.textoPreambulo}>Período de tratamento:</Text>
          <Text style={s.dataDestaque}>
            {formatarData(acolhido.data_acolhimento)} a {formatarData(acolhido.data_saida ?? new Date().toISOString().slice(0, 10))}
          </Text>

          <Text style={s.ornamento}>✦ ✦ ✦</Text>
          <Text style={s.prontuario}>Prontuário nº {acolhido.numero_prontuario}</Text>
        </View>

        <LocalData cidade={acolhido.contato?.endereco_cidade} />

        <LinhaAssinaturas assinaturas={[
          { label: 'Diretor(a) / Responsável Técnico(a)', nome: tenant.nome },
          { label: 'Coordenador(a) Terapêutico(a)' },
        ]} />

        <Rodape numeroProntuario={acolhido.numero_prontuario} />
      </View>
    </Document>
  )
}
