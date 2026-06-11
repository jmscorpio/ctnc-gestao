import { useEffect, useState } from 'react'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { FinanceiroTipo } from '@ctnc/shared'

interface Categoria {
  id: string
  tipo: FinanceiroTipo
  nome: string
  cor: string
  ativa: boolean
}

const CORES_PRESET = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#6b7280',
]

const CATEGORIAS_PADRAO: { tipo: FinanceiroTipo; nome: string; cor: string }[] = [
  { tipo: 'receita', nome: 'Convênios', cor: '#10b981' },
  { tipo: 'receita', nome: 'Doações', cor: '#3b82f6' },
  { tipo: 'receita', nome: 'Cotas mensais', cor: '#8b5cf6' },
  { tipo: 'receita', nome: 'Eventos', cor: '#f59e0b' },
  { tipo: 'despesa', nome: 'Alimentação', cor: '#f97316' },
  { tipo: 'despesa', nome: 'Medicamentos', cor: '#ef4444' },
  { tipo: 'despesa', nome: 'Pessoal', cor: '#8b5cf6' },
  { tipo: 'despesa', nome: 'Utilidades (água, luz, gás)', cor: '#06b6d4' },
  { tipo: 'despesa', nome: 'Manutenção e reformas', cor: '#f59e0b' },
  { tipo: 'despesa', nome: 'Administrativo', cor: '#6b7280' },
]

export function TabCategorias() {
  const { profile } = useAuth()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [criandoTipo, setCriandoTipo] = useState<FinanceiroTipo | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [novaCor, setNovaCor] = useState(CORES_PRESET[0])
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editCor, setEditCor] = useState('')
  const [seedando, setSeedando] = useState(false)

  async function carregar() {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('categorias_financeiras')
      .select('id, tipo, nome, cor, ativa')
      .eq('tenant_id', profile.tenant_id)
      .order('tipo').order('nome')
    setCategorias((data ?? []) as Categoria[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  async function criar() {
    if (!profile || !criandoTipo || !novoNome.trim()) return
    await supabase.from('categorias_financeiras').insert({
      tenant_id: profile.tenant_id,
      tipo: criandoTipo,
      nome: novoNome.trim(),
      cor: novaCor,
    })
    setNovoNome('')
    setNovaCor(CORES_PRESET[0])
    setCriandoTipo(null)
    await carregar()
  }

  async function salvarEdicao(id: string) {
    if (!editNome.trim()) return
    await supabase.from('categorias_financeiras').update({ nome: editNome.trim(), cor: editCor }).eq('id', id)
    setEditandoId(null)
    await carregar()
  }

  async function toggleAtiva(id: string, ativa: boolean) {
    await supabase.from('categorias_financeiras').update({ ativa: !ativa }).eq('id', id)
    await carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta categoria? Lançamentos existentes perderão a categoria.')) return
    await supabase.from('categorias_financeiras').delete().eq('id', id)
    await carregar()
  }

  async function seedPadrao() {
    if (!profile) return
    setSeedando(true)
    const inserts = CATEGORIAS_PADRAO.map(c => ({ ...c, tenant_id: profile.tenant_id }))
    await supabase.from('categorias_financeiras').insert(inserts)
    await carregar()
    setSeedando(false)
  }

  const receitas = categorias.filter(c => c.tipo === 'receita')
  const despesas = categorias.filter(c => c.tipo === 'despesa')

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      {categorias.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-amber-800">Nenhuma categoria cadastrada</p>
            <p className="text-xs text-amber-600 mt-1">Crie categorias para organizar seus lançamentos, ou importe as categorias padrão sugeridas.</p>
          </div>
          <button
            onClick={seedPadrao}
            disabled={seedando}
            className="shrink-0 bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {seedando ? 'Importando...' : 'Importar padrão'}
          </button>
        </div>
      )}

      {(['receita', 'despesa'] as FinanceiroTipo[]).map(tipo => {
        const lista = tipo === 'receita' ? receitas : despesas
        return (
          <div key={tipo}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                {tipo === 'receita' ? 'Receitas' : 'Despesas'}
              </h3>
              <button
                onClick={() => { setCriandoTipo(tipo); setNovoNome(''); setNovaCor(CORES_PRESET[0]) }}
                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  tipo === 'receita'
                    ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                <Plus size={12} /> Nova categoria
              </button>
            </div>

            {/* Formulário inline de criação */}
            {criandoTipo === tipo && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 flex items-center gap-3">
                <input
                  autoFocus
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') criar(); if (e.key === 'Escape') setCriandoTipo(null) }}
                  placeholder="Nome da categoria"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <div className="flex gap-1">
                  {CORES_PRESET.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNovaCor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${novaCor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button onClick={criar} className="text-emerald-600 hover:text-emerald-700 p-1"><Check size={16} /></button>
                <button onClick={() => setCriandoTipo(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
              </div>
            )}

            {lista.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Nenhuma categoria de {tipo === 'receita' ? 'receita' : 'despesa'}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lista.map(cat => (
                  <div key={cat.id} className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${cat.ativa ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
                    {editandoId === cat.id ? (
                      <>
                        <div className="flex gap-1">
                          {CORES_PRESET.map(c => (
                            <button
                              key={c}
                              onClick={() => setEditCor(c)}
                              className={`w-4 h-4 rounded-full border-2 ${editCor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <input
                          autoFocus
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') salvarEdicao(cat.id); if (e.key === 'Escape') setEditandoId(null) }}
                          className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button onClick={() => salvarEdicao(cat.id)} className="text-emerald-600 hover:text-emerald-700 p-1"><Check size={14} /></button>
                        <button onClick={() => setEditandoId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                        <span className="flex-1 text-sm text-gray-800">{cat.nome}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditandoId(cat.id); setEditNome(cat.nome); setEditCor(cat.cor) }}
                            className="text-gray-300 hover:text-gray-600 transition-colors p-1"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => toggleAtiva(cat.id, cat.ativa)}
                            className="text-gray-300 hover:text-gray-600 transition-colors p-1"
                            title={cat.ativa ? 'Desativar' : 'Ativar'}
                          >
                            {cat.ativa ? <X size={13} /> : <Check size={13} />}
                          </button>
                          <button
                            onClick={() => excluir(cat.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
