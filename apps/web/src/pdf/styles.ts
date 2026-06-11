import { StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

export const cores = {
  primario: '#0369a1',
  texto: '#1f2937',
  textoSuave: '#6b7280',
  borda: '#e5e7eb',
  fundoCabecalho: '#f0f9ff',
  fundoDestaque: '#f9fafb',
}

export const base = StyleSheet.create({
  pagina: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: cores.texto,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  cabecalho: {
    borderBottomWidth: 2,
    borderBottomColor: cores.primario,
    paddingBottom: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cabecalhoEsq: {
    flex: 1,
  },
  nomeCt: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: cores.primario,
  },
  subtituloCt: {
    fontSize: 8,
    color: cores.textoSuave,
    marginTop: 2,
  },
  tituloDoc: {
    fontSize: 8,
    color: cores.textoSuave,
    textAlign: 'right',
  },
  titulo: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: cores.primario,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 9,
    textAlign: 'center',
    color: cores.textoSuave,
    marginBottom: 20,
  },
  secao: {
    marginBottom: 14,
  },
  tituloSecao: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: cores.primario,
    backgroundColor: cores.fundoCabecalho,
    padding: 5,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: cores.primario,
  },
  linha: {
    flexDirection: 'row',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  campo: {
    flex: 1,
    marginRight: 10,
  },
  rotulo: {
    fontSize: 8,
    color: cores.textoSuave,
    marginBottom: 2,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  valor: {
    fontSize: 10,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    paddingBottom: 3,
    minHeight: 16,
  },
  paragrafo: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  assinatura: {
    marginTop: 30,
  },
  linhaAssinatura: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
  },
  blocoAssinatura: {
    alignItems: 'center',
    width: '40%',
  },
  linhaTracejada: {
    borderTopWidth: 1,
    borderTopColor: cores.texto,
    width: '100%',
    marginBottom: 4,
  },
  textoAssinatura: {
    fontSize: 8,
    textAlign: 'center',
    color: cores.textoSuave,
  },
  rodape: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rodapeTexto: {
    fontSize: 7,
    color: cores.textoSuave,
  },
  destaque: {
    backgroundColor: cores.fundoDestaque,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
})

export function formatarData(data?: string | null): string {
  if (!data) return '___/___/______'
  try {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  } catch {
    return data
  }
}

export function formatarDataExtenso(data?: string | null): string {
  if (!data) return '_____ de ______________ de _______'
  try {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return data
  }
}
