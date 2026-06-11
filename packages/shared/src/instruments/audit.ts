export type RiscoAudit = 'zona1' | 'zona2' | 'zona3' | 'zona4'

export interface AuditQuestao {
  id: string
  texto: string
  opcoes: { valor: number; label: string }[]
}

export const AUDIT_QUESTOES: AuditQuestao[] = [
  {
    id: 'q1',
    texto: 'Com que frequência você consome bebidas que contêm álcool?',
    opcoes: [
      { valor: 0, label: 'Nunca' },
      { valor: 1, label: 'Mensalmente ou menos' },
      { valor: 2, label: '2 a 4 vezes por mês' },
      { valor: 3, label: '2 a 3 vezes por semana' },
      { valor: 4, label: '4 ou mais vezes por semana' },
    ],
  },
  {
    id: 'q2',
    texto: 'Quantas doses você costuma tomar em um dia típico quando está bebendo?',
    opcoes: [
      { valor: 0, label: '1 ou 2' },
      { valor: 1, label: '3 ou 4' },
      { valor: 2, label: '5 ou 6' },
      { valor: 3, label: '7 a 9' },
      { valor: 4, label: '10 ou mais' },
    ],
  },
  {
    id: 'q3',
    texto: 'Com que frequência você consome 6 ou mais doses em uma única ocasião?',
    opcoes: [
      { valor: 0, label: 'Nunca' },
      { valor: 1, label: 'Menos do que uma vez por mês' },
      { valor: 2, label: 'Mensalmente' },
      { valor: 3, label: 'Semanalmente' },
      { valor: 4, label: 'Diariamente ou quase todos os dias' },
    ],
  },
  {
    id: 'q4',
    texto: 'Com que frequência, durante o último ano, você percebeu que não conseguia parar de beber depois que começou?',
    opcoes: [
      { valor: 0, label: 'Nunca' },
      { valor: 1, label: 'Menos do que uma vez por mês' },
      { valor: 2, label: 'Mensalmente' },
      { valor: 3, label: 'Semanalmente' },
      { valor: 4, label: 'Diariamente ou quase todos os dias' },
    ],
  },
  {
    id: 'q5',
    texto: 'Com que frequência, durante o último ano, você deixou de fazer o que era esperado por causa do álcool?',
    opcoes: [
      { valor: 0, label: 'Nunca' },
      { valor: 1, label: 'Menos do que uma vez por mês' },
      { valor: 2, label: 'Mensalmente' },
      { valor: 3, label: 'Semanalmente' },
      { valor: 4, label: 'Diariamente ou quase todos os dias' },
    ],
  },
  {
    id: 'q6',
    texto: 'Com que frequência, durante o último ano, você precisou beber logo pela manhã para se sentir melhor depois de ter bebido muito no dia anterior?',
    opcoes: [
      { valor: 0, label: 'Nunca' },
      { valor: 1, label: 'Menos do que uma vez por mês' },
      { valor: 2, label: 'Mensalmente' },
      { valor: 3, label: 'Semanalmente' },
      { valor: 4, label: 'Diariamente ou quase todos os dias' },
    ],
  },
  {
    id: 'q7',
    texto: 'Com que frequência, durante o último ano, você se sentiu culpado ou com remorso depois de beber?',
    opcoes: [
      { valor: 0, label: 'Nunca' },
      { valor: 1, label: 'Menos do que uma vez por mês' },
      { valor: 2, label: 'Mensalmente' },
      { valor: 3, label: 'Semanalmente' },
      { valor: 4, label: 'Diariamente ou quase todos os dias' },
    ],
  },
  {
    id: 'q8',
    texto: 'Com que frequência, durante o último ano, você foi incapaz de lembrar o que aconteceu na noite anterior por causa do álcool?',
    opcoes: [
      { valor: 0, label: 'Nunca' },
      { valor: 1, label: 'Menos do que uma vez por mês' },
      { valor: 2, label: 'Mensalmente' },
      { valor: 3, label: 'Semanalmente' },
      { valor: 4, label: 'Diariamente ou quase todos os dias' },
    ],
  },
  {
    id: 'q9',
    texto: 'Você ou alguém se machucou por causa do seu consumo de álcool?',
    opcoes: [
      { valor: 0, label: 'Não' },
      { valor: 2, label: 'Sim, mas não no último ano' },
      { valor: 4, label: 'Sim, no último ano' },
    ],
  },
  {
    id: 'q10',
    texto: 'Algum parente, amigo, médico ou profissional de saúde já demonstrou preocupação com seu consumo de álcool ou sugeriu que você parasse?',
    opcoes: [
      { valor: 0, label: 'Não' },
      { valor: 2, label: 'Sim, mas não no último ano' },
      { valor: 4, label: 'Sim, no último ano' },
    ],
  },
]

export function classificarRiscoAudit(score: number): RiscoAudit {
  if (score <= 7) return 'zona1'
  if (score <= 15) return 'zona2'
  if (score <= 19) return 'zona3'
  return 'zona4'
}

export const AUDIT_RISCO_LABEL: Record<RiscoAudit, string> = {
  zona1: 'Zona I — Baixo risco',
  zona2: 'Zona II — Uso de risco',
  zona3: 'Zona III — Uso nocivo',
  zona4: 'Zona IV — Possível dependência',
}

export const AUDIT_RISCO_COR: Record<RiscoAudit, string> = {
  zona1: 'bg-green-100 text-green-700 border-green-200',
  zona2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  zona3: 'bg-orange-100 text-orange-700 border-orange-200',
  zona4: 'bg-red-100 text-red-700 border-red-200',
}

export const AUDIT_RISCO_INTERVENCAO: Record<RiscoAudit, string> = {
  zona1: 'Educação sobre álcool e retroalimentação.',
  zona2: 'Intervenção breve — aconselhamento simples e monitoramento.',
  zona3: 'Intervenção breve e acompanhamento contínuo indicados.',
  zona4: 'Avaliação diagnóstica e tratamento especializado indicados.',
}
