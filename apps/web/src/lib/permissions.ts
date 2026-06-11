import type { UserRole } from '@ctnc/shared'

export const MODULOS = ['dashboard', 'acolhidos', 'atividades', 'financeiro', 'configuracoes'] as const
export type Modulo = typeof MODULOS[number]

const PERMISSOES: Record<UserRole, Modulo[]> = {
  diretor:          ['dashboard', 'acolhidos', 'atividades', 'financeiro', 'configuracoes'],
  coordenador:      ['dashboard', 'acolhidos', 'atividades', 'financeiro'],
  medico:           ['dashboard', 'acolhidos'],
  enfermeiro:       ['dashboard', 'acolhidos'],
  psicologo:        ['dashboard', 'acolhidos'],
  assistente_social:['dashboard', 'acolhidos', 'atividades'],
  recepcionista:    ['dashboard', 'acolhidos'],
}

export function temAcesso(role: UserRole | undefined, modulo: Modulo): boolean {
  if (!role) return false
  return PERMISSOES[role]?.includes(modulo) ?? false
}

export const ROLE_LABEL: Record<UserRole, string> = {
  diretor: 'Diretor(a)',
  coordenador: 'Coordenador(a)',
  medico: 'Médico(a)',
  enfermeiro: 'Enfermeiro(a)',
  psicologo: 'Psicólogo(a)',
  assistente_social: 'Assistente Social',
  recepcionista: 'Recepcionista',
}

export const ROLE_COR: Record<UserRole, string> = {
  diretor: 'bg-purple-100 text-purple-700',
  coordenador: 'bg-blue-100 text-blue-700',
  medico: 'bg-green-100 text-green-700',
  enfermeiro: 'bg-teal-100 text-teal-700',
  psicologo: 'bg-indigo-100 text-indigo-700',
  assistente_social: 'bg-orange-100 text-orange-700',
  recepcionista: 'bg-gray-100 text-gray-600',
}
