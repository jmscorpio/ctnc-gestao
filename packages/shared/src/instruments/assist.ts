export type RiscoNivel = 'baixo' | 'moderado' | 'alto'

export interface SubstanciaAssist {
  id: string
  label: string
  exemplos: string
}

export const SUBSTANCIAS: SubstanciaAssist[] = [
  { id: 'tabaco', label: 'Tabaco', exemplos: 'cigarros, charutos, fumo de rolo, narguilé' },
  { id: 'alcool', label: 'Álcool', exemplos: 'cerveja, vinho, destilados, cachaça' },
  { id: 'cannabis', label: 'Cannabis', exemplos: 'maconha, haxixe, skunk' },
  { id: 'cocaina', label: 'Cocaína/Crack', exemplos: 'pó, crack, merla, pasta base' },
  { id: 'anfetaminas', label: 'Anfetaminas/Estimulantes', exemplos: 'rebite, loló, êxtase, anfetaminas' },
  { id: 'inalantes', label: 'Inalantes', exemplos: 'cola, solvente, tinner, gasolina' },
  { id: 'sedativos', label: 'Sedativos/Calmantes', exemplos: 'diazepam, clonazepam, barbitúricos (sem prescrição)' },
  { id: 'alucinogenos', label: 'Alucinógenos', exemplos: 'LSD, cogumelos, DMT, mescalina' },
  { id: 'opiaceos', label: 'Opiáceos', exemplos: 'heroína, morfina, codeína, metadona' },
  { id: 'outros', label: 'Outras drogas', exemplos: 'esteroides, GHB, flunitrazepam' },
]

export const Q1_OPCOES = [
  { valor: 0, label: 'Não, nunca' },
  { valor: 1, label: 'Sim' },
]

export const Q2_OPCOES = [
  { valor: 0, label: 'Nunca' },
  { valor: 2, label: '1 ou 2 vezes' },
  { valor: 3, label: 'Mensalmente' },
  { valor: 4, label: 'Semanalmente' },
  { valor: 6, label: 'Diariamente ou quase todos os dias' },
]

export const Q3_OPCOES = [
  { valor: 0, label: 'Nunca' },
  { valor: 3, label: '1 ou 2 vezes' },
  { valor: 4, label: 'Mensalmente' },
  { valor: 5, label: 'Semanalmente' },
  { valor: 6, label: 'Diariamente ou quase todos os dias' },
]

export const Q4_OPCOES = [
  { valor: 0, label: 'Nunca' },
  { valor: 4, label: '1 ou 2 vezes' },
  { valor: 5, label: 'Mensalmente' },
  { valor: 6, label: 'Semanalmente' },
  { valor: 7, label: 'Diariamente ou quase todos os dias' },
]

export const Q5_OPCOES = [
  { valor: 0, label: 'Nunca' },
  { valor: 5, label: '1 ou 2 vezes' },
  { valor: 6, label: 'Mensalmente' },
  { valor: 7, label: 'Semanalmente' },
  { valor: 8, label: 'Diariamente ou quase todos os dias' },
]

export const Q6_OPCOES = [
  { valor: 0, label: 'Não' },
  { valor: 6, label: 'Sim, mas não nos últimos 3 meses' },
  { valor: 7, label: 'Sim, nos últimos 3 meses' },
]

export const Q7_OPCOES = [
  { valor: 0, label: 'Não' },
  { valor: 6, label: 'Sim, mas não nos últimos 3 meses' },
  { valor: 7, label: 'Sim, nos últimos 3 meses' },
]

export const Q8_OPCOES = [
  { valor: 0, label: 'Não, nunca' },
  { valor: 2, label: 'Sim, mas não nos últimos 3 meses' },
  { valor: 3, label: 'Sim, nos últimos 3 meses' },
]

export function calcularScoreSubstancia(
  substanciaId: string,
  respostas: Record<string, number>
): number {
  const q2 = respostas[`q2_${substanciaId}`] ?? 0
  const q3 = respostas[`q3_${substanciaId}`] ?? 0
  const q4 = respostas[`q4_${substanciaId}`] ?? 0
  const q5 = respostas[`q5_${substanciaId}`] ?? 0
  const q6 = respostas[`q6_${substanciaId}`] ?? 0
  const q7 = respostas[`q7_${substanciaId}`] ?? 0
  return q2 + q3 + q4 + q5 + q6 + q7
}

export function classificarRiscoAssist(substanciaId: string, score: number): RiscoNivel {
  if (substanciaId === 'tabaco') {
    if (score <= 3) return 'baixo'
    return 'moderado'
  }
  if (substanciaId === 'alcool') {
    if (score <= 10) return 'baixo'
    if (score <= 26) return 'moderado'
    return 'alto'
  }
  if (score <= 3) return 'baixo'
  if (score <= 26) return 'moderado'
  return 'alto'
}

export const RISCO_COR: Record<RiscoNivel, string> = {
  baixo: 'bg-green-100 text-green-700 border-green-200',
  moderado: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  alto: 'bg-red-100 text-red-700 border-red-200',
}

export const RISCO_LABEL: Record<RiscoNivel, string> = {
  baixo: 'Baixo risco',
  moderado: 'Risco moderado',
  alto: 'Alto risco',
}

export const RISCO_INTERVENCAO: Record<RiscoNivel, string> = {
  baixo: 'Fornecer informações sobre uso de substâncias.',
  moderado: 'Intervenção breve indicada — orientação e acompanhamento.',
  alto: 'Encaminhamento para tratamento especializado.',
}
