import { Document, Text, View } from '@react-pdf/renderer'
import { PaginaPadrao, Campo, TituloSecao, Paragrafo, LinhaAssinaturas, LocalData } from '../components'
import { base, formatarData } from '../styles'
import type { DocumentoProps } from '../types'

export function TermoAdesao({ tenant, acolhido }: DocumentoProps) {
  return (
    <Document>
      <PaginaPadrao tenant={tenant} tituloDoc="Termo de Adesão" numeroProntuario={acolhido.numero_prontuario}>

        <Text style={base.titulo}>Termo de Adesão ao Tratamento</Text>
        <Text style={base.subtitulo}>Comunidade Terapêutica — {tenant.nome}</Text>

        <View style={base.secao}>
          <TituloSecao>IDENTIFICAÇÃO</TituloSecao>
          <View style={base.linha}>
            <Campo rotulo="Nome" valor={acolhido.nome} flex={3} />
            <Campo rotulo="Prontuário" valor={acolhido.numero_prontuario} />
          </View>
          <View style={base.linha}>
            <Campo rotulo="CPF" valor={acolhido.cpf} />
            <Campo rotulo="Data de acolhimento" valor={formatarData(acolhido.data_acolhimento)} />
          </View>
        </View>

        <View style={base.secao}>
          <TituloSecao>COMPROMISSOS DO ACOLHIDO</TituloSecao>
          {[
            '1. Comprometer-me com o processo terapêutico e com minha recuperação, participando ativamente das atividades propostas pela CT.',
            '2. Cumprir integralmente o Regulamento Interno da {CT}, abstendo-me do uso de álcool, tabaco e outras substâncias psicoativas durante o período de tratamento.',
            '3. Respeitar os demais acolhidos, colaboradores e equipe técnica, mantendo convivência harmoniosa.',
            '4. Participar das atividades terapêuticas, educativas e laborais programadas pela equipe.',
            '5. Comunicar imediatamente à equipe técnica qualquer situação de mal-estar físico ou emocional.',
            '6. Não portar ou introduzir na CT qualquer substância psicoativa, medicamento não prescrito, objetos cortantes ou materiais proibidos pelo regulamento.',
            '7. Manter sigilo sobre as informações compartilhadas por outros acolhidos no contexto terapêutico.',
            '8. Cumprir o período mínimo de tratamento acordado com a equipe técnica, exceto em situações de alta médica ou decisão terapêutica fundamentada.',
          ].map((item, i) => (
            <Paragrafo key={i}>{item.replace('{CT}', tenant.nome)}</Paragrafo>
          ))}
        </View>

        <View style={base.secao}>
          <TituloSecao>COMPROMISSOS DA COMUNIDADE TERAPÊUTICA</TituloSecao>
          {[
            '1. Oferecer tratamento digno, humanizado e fundamentado nos princípios da Comunidade Terapêutica.',
            '2. Garantir o sigilo das informações do acolhido, em conformidade com a LGPD e o Código de Ética profissional.',
            '3. Disponibilizar equipe técnica habilitada para acompanhamento clínico, psicológico e social.',
            '4. Comunicar ao responsável legal qualquer intercorrência relevante com o acolhido.',
            '5. Elaborar e executar o Plano de Atendimento Singular (PAS) em conjunto com o acolhido.',
          ].map((item, i) => (
            <Paragrafo key={i}>{item}</Paragrafo>
          ))}
        </View>

        <Paragrafo>
          Declaro ter lido, compreendido e concordado com os termos acima, aderindo voluntariamente ao tratamento na {tenant.nome}.
        </Paragrafo>

        <LocalData cidade={acolhido.contato?.endereco_cidade} />

        <LinhaAssinaturas assinaturas={[
          { label: 'Assinatura do Acolhido', nome: acolhido.nome },
          { label: 'Responsável Técnico da CT' },
        ]} />

      </PaginaPadrao>
    </Document>
  )
}
