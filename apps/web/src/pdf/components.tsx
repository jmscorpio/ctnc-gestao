import { Text, View, Page } from '@react-pdf/renderer'
import { base, formatarDataExtenso } from './styles'

interface TenantInfo {
  nome: string
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: { logradouro?: string; cidade?: string; estado?: string } | null
}

export function Cabecalho({ tenant, tituloDoc }: { tenant: TenantInfo; tituloDoc: string }) {
  return (
    <View style={base.cabecalho}>
      <View style={base.cabecalhoEsq}>
        <Text style={base.nomeCt}>{tenant.nome}</Text>
        {tenant.cnpj && <Text style={base.subtituloCt}>CNPJ: {tenant.cnpj}</Text>}
        {tenant.telefone && <Text style={base.subtituloCt}>Tel: {tenant.telefone}</Text>}
        {tenant.email && <Text style={base.subtituloCt}>{tenant.email}</Text>}
      </View>
      <Text style={base.tituloDoc}>{tituloDoc}</Text>
    </View>
  )
}

export function Rodape({ numeroProntuario }: { numeroProntuario: string }) {
  return (
    <View style={base.rodape} fixed>
      <Text style={base.rodapeTexto}>Prontuário: {numeroProntuario}</Text>
      <Text style={base.rodapeTexto}>CTNC Gestão — Sistema de Gestão para CT</Text>
      <Text style={base.rodapeTexto} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber}/${totalPages}`} />
    </View>
  )
}

export function Campo({ rotulo, valor, flex }: { rotulo: string; valor?: string | null; flex?: number }) {
  return (
    <View style={[base.campo, flex ? { flex } : {}]}>
      <Text style={base.rotulo}>{rotulo}</Text>
      <Text style={base.valor}>{valor ?? ''}</Text>
    </View>
  )
}

export function TituloSecao({ children }: { children: string }) {
  return <Text style={base.tituloSecao}>{children}</Text>
}

export function Paragrafo({ children }: { children: React.ReactNode }) {
  return <Text style={base.paragrafo}>{children}</Text>
}

export function LinhaAssinaturas({ assinaturas }: { assinaturas: { label: string; nome?: string }[] }) {
  return (
    <View style={base.linhaAssinatura}>
      {assinaturas.map((a, i) => (
        <View key={i} style={base.blocoAssinatura}>
          <View style={base.linhaTracejada} />
          <Text style={base.textoAssinatura}>{a.label}</Text>
          {a.nome && <Text style={[base.textoAssinatura, { fontFamily: 'Helvetica-Bold' }]}>{a.nome}</Text>}
        </View>
      ))}
    </View>
  )
}

export function LocalData({ cidade }: { cidade?: string | null }) {
  const hoje = formatarDataExtenso(new Date().toISOString().slice(0, 10))
  return (
    <Text style={[base.paragrafo, { textAlign: 'right', marginTop: 20 }]}>
      {cidade ? `${cidade}, ` : ''}{hoje}
    </Text>
  )
}

export function PaginaPadrao({ children, tenant, tituloDoc, numeroProntuario }: {
  children: React.ReactNode
  tenant: TenantInfo
  tituloDoc: string
  numeroProntuario: string
}) {
  return (
    <Page size="A4" style={base.pagina}>
      <Cabecalho tenant={tenant} tituloDoc={tituloDoc} />
      {children}
      <Rodape numeroProntuario={numeroProntuario} />
    </Page>
  )
}
