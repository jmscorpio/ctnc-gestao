import { useEffect, useState } from 'react'
import { Settings, Users, UserCheck, UserX, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_LABEL, ROLE_COR } from '../../lib/permissions'
import type { UserRole } from '@ctnc/shared'

type AbaId = 'usuarios' | 'perfil'

interface UsuarioPerfil {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  telefone: string | null
}

const TODAS_ROLES: UserRole[] = [
  'diretor', 'coordenador', 'medico', 'enfermeiro',
  'psicologo', 'assistente_social', 'recepcionista',
]

export function ConfiguracoesPage() {
  const { profile } = useAuth()
  const [aba, setAba] = useState<AbaId>('usuarios')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gray-100 rounded-lg">
          <Settings size={20} className="text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 text-sm">Gestão da equipe e preferências</p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {([
            { id: 'usuarios' as AbaId, label: 'Equipe', icon: Users },
            { id: 'perfil' as AbaId, label: 'Meu perfil', icon: Shield },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                aba === id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {aba === 'usuarios' && <TabUsuarios tenantId={profile?.tenant_id ?? ''} meuId={profile?.id ?? ''} />}
      {aba === 'perfil' && <TabMeuPerfil />}
    </div>
  )
}

function TabUsuarios({ tenantId, meuId }: { tenantId: string; meuId: string }) {
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, nome, email, role, ativo, telefone')
      .eq('tenant_id', tenantId)
      .order('nome')
    setUsuarios((data ?? []) as UsuarioPerfil[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function alterarRole(id: string, role: UserRole) {
    setSalvando(id)
    await supabase.from('profiles').update({ role }).eq('id', id)
    await carregar()
    setSalvando(null)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    setSalvando(id)
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    await carregar()
    setSalvando(null)
  }

  const ativos = usuarios.filter(u => u.ativo).length

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Users size={15} className="text-gray-400" />
        <span>{ativos} usuário{ativos !== 1 ? 's' : ''} ativo{ativos !== 1 ? 's' : ''} · {usuarios.length} total</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Profissional</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden sm:table-cell">Função</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Perfil</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map(u => (
              <tr key={u.id} className={u.ativo ? '' : 'opacity-50'}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.nome}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COR[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.id === meuId ? (
                    <span className="text-xs text-gray-400">você</span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => alterarRole(u.id, e.target.value as UserRole)}
                      disabled={salvando === u.id}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                    >
                      {TODAS_ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.id !== meuId && (
                    <button
                      onClick={() => toggleAtivo(u.id, u.ativo)}
                      disabled={salvando === u.id}
                      className="text-gray-300 hover:text-gray-600 transition-colors disabled:opacity-50"
                      title={u.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                    >
                      {u.ativo ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium">Convidar novo usuário</p>
        <p className="text-xs text-blue-600 mt-1">
          Para adicionar um novo membro da equipe, crie a conta diretamente no painel do Supabase em
          Authentication → Users, depois atualize o campo <code className="bg-blue-100 px-1 rounded">tenant_id</code> e <code className="bg-blue-100 px-1 rounded">role</code> na tabela <code className="bg-blue-100 px-1 rounded">profiles</code>.
          Uma funcionalidade de convite por e-mail será adicionada em uma próxima versão.
        </p>
      </div>
    </div>
  )
}

function TabMeuPerfil() {
  const { profile } = useAuth()
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [telefone, setTelefone] = useState(profile?.telefone ?? '')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSalvando(true)
    await supabase.from('profiles').update({ nome, telefone: telefone || null }).eq('id', profile.id)
    setSalvando(false)
    setSucesso(true)
    setTimeout(() => setSucesso(false), 2500)
  }

  if (!profile) return null

  return (
    <div className="max-w-md">
      <form onSubmit={salvar} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 font-medium">Nome completo</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">E-mail</label>
          <input
            value={profile.email}
            disabled
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Telefone</label>
          <input
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            placeholder="(11) 99999-0000"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Função</label>
          <div className="mt-1">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COR[profile.role as UserRole]}`}>
              {ROLE_LABEL[profile.role as UserRole]}
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={salvando}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            sucesso
              ? 'bg-green-500 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
          }`}
        >
          {sucesso ? '✓ Salvo com sucesso' : salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
