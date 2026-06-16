/**
 * Validação de CPF pelos dígitos verificadores (algoritmo oficial).
 * Aceita o valor com ou sem máscara (pontos/traço são ignorados).
 */
export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  // rejeita sequências de dígitos iguais (000.000.000-00, 111..., etc.)
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i)
  let dv1 = (soma * 10) % 11
  if (dv1 === 10) dv1 = 0
  if (dv1 !== parseInt(cpf[9], 10)) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i)
  let dv2 = (soma * 10) % 11
  if (dv2 === 10) dv2 = 0
  if (dv2 !== parseInt(cpf[10], 10)) return false

  return true
}
