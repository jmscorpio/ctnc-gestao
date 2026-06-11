import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, User, Download, X, SlidersHorizontal } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Database, AcolhidoStatus } from '@ctnc/shared'

type Acolhido = Database['public']['Tables']['acolhidos']['Row']

type OrdemId = 'nome_asc' | 'nome_desc' | 'entrada_desc' | 'entrada_asc' | 'prontuario'

const STATUS_LABEL: Record<AcolhidoStatus, string> = {
  ativo: 'Ativo', alta: 'Alta', desligado: 'Desligado', transferido: 'Transferido', obito: 'Óbito',
}
const STATUS_COR: Record<AcolhidoStatus, string> = {
  ativo: 'bg-green-100 text-green-700 border-green-200',
  alta: 'bg-blue-100 text-blue-700 border-blue-200',
  desligado: 'bg-red-100 text-red-700 border-red-200',
  transferido: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  obito: 'bg-gray-100 text-gray-600 border-gray-200',
}
const STATUS_COR_INATIVO: Record<AcolhidoStatus, string> = {
  ativo: 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600',
  alta: 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600',
  desligado: 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-600',
  transferido: 'bg-white text-gray-500 border-gray-200 hover:border-yellow-300 hover:text-yellow-600',
  obito: 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
}
const ORDENS: { id: OrdemId; label: string }[] = [
  { id: 'nome_asc', label: 'Nome A→Z' },
  { id: 'nome_desc', label: 'Nome Z→A' },
  { id: 'entrada_desc', label: 'Entrada mais recente' },
  { id: 'entrada_asc', label: 'Entrada mais antiga' },
  { id: 'prontuario', label: 'Prontuário' },
]

function exportarCSV(lista: Acolhido[]) {
  const cabecalho = ['Prontuário', 'Nome', 'Nome Social', 'Sexo', 'Nascimento', 'CPF', 'Data Entrada', 'Data Saída', 'Status', 'Motivo Saída']
  const linhas = lista.map(a => [
    a.numero_prontuario,
    a.nome,
    a.nome_social ?? '',
    a.sexo,
    new Date(a.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR'),
    a.cpf ?? '',
    new Date(a.data_acolhimento + 'T00:00:00').toLocaleDateString('pt-BR'),
    a.data_saida ? new Date(a.data_saida + 'T00:00:00').toLocaleDateString('pt-BR') : '',
    STATUS_LABEL[a.status],
    a.motivo_saida ?? '',
  ])
  const conteudo = [cabecalho, ...linhas]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `acolhidos_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function AcolhidosListPage() {
  const { profile } = useAuth()
  const [acolhidos, setAcolhidos] = useState<Acolhido[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFiltros, setStatusFiltros] = useState<Set<AcolhidoStatus>>(new Set())
  const [ordem, setOrdem] = useState<OrdemId>('nome_asc')
  const [periodoAberto, setPeriodoAberto] = useState(false)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Debounce busca: só dispara query 350ms após parar de digitar
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const carregar = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    let q = supabase.from('acolhidos').select('*').eq('tenant_id', profile.tenant_id)

    // Busca por nome, CPF ou prontuário
    if (search.trim()) {
      const s = search.trim()
      q = q.or(`nome.ilike.%${s}%,cpf.ilike.%${s}%,numero_prontuario.ilike.%${s}%`)
    }

    // Filtros de status (multiple)
    if (statusFiltros.size > 0) {
      q = q.in('status', [...statusFiltros])
    }

    // Período de entrada
    if (dataInicio) q = q.gte('data_acolhimento', dataInicio)
    if (dataFim) q = q.lte('data_acolhimento', dataFim)

    // Ordenação
    switch (ordem) {
      case 'nome_asc':      q = q.order('nome', { ascending: true }); break
      case 'nome_desc':     q = q.order('nome', { ascending: false }); break
      case 'entrada_desc':  q = q.order('data_acolhimento', { ascending: false }); break
      case 'entrada_asc':   q = q.order('data_acolhimento', { ascending: true }); break
      case 'prontuario':    q = q.order('numero_prontuario', { ascending: true }); break
    }

    const { data } = await q
    setAcolhidos(data ?? [])
    setLoading(false)
  }, [profile, search, statusFiltros, ordem, dataInicio, dataFim])

  useEffect(() => { carregar() }, [carregar])

  function toggleStatus(s: AcolhidoStatus) {
    setStatusFiltros(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function limparFiltros() {
    setSearchInput('')
    setSearch('')
    setStatusFiltros(new Set())
    setDataInicio('')
    setDataFim('')
    setOrdem('nome_asc')
    setPeriodoAberto(false)
  }

  const temFiltroAtivo = search || statusFiltros.size > 0 || dataInicio || dataFim

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acolhidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Prontuários e cadastros</p>
        </div>
        <Link
          to="/acolhidos/novo"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo acolhido
        </Link>
      </div>

      {/* Barra de busca + controles */}
      <div className="space-y-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Busca */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou prontuário..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Ordenação */}
          <select
            value={ordem}
            onChange={e => setOrdem(e.target.value as OrdemId)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {ORDENS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>

          {/* Período */}
          <button
            onClick={() => setPeriodoAberto(v => !v)}
            className={`flex items-center gap-1.5 border rounded-lg text-sm px-3 py-2 transition-colors ${
              periodoAberto || dataInicio || dataFim
                ? 'border-primary-400 text-primary-600 bg-primary-50'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <SlidersHorizontal size={14} />
            Período
          </button>

          {/* Exportar */}
          <button
            onClick={() => exportarCSV(acolhidos)}
            disabled={acolhidos.length === 0}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:border-gray-400 rounded-lg text-sm px-3 py-2 transition-colors disabled:opacity-40"
            title="Exportar lista atual para CSV"
          >
            <Download size={14} />
            CSV
          </button>
        </div>

        {/* Período expandido */}
        {periodoAberto && (
          <div className="flex items-center gap-3 flex-wrap bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-xs font-medium text-gray-500">Entrada entre:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-xs text-gray-400">e</span>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {(dataInicio || dataFim) && (
              <button onClick={() => { setDataInicio(''); setDataFim('') }} className="text-xs text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Filtros de status — pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(STATUS_LABEL) as AcolhidoStatus[]).map(s => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                statusFiltros.has(s) ? STATUS_COR[s] : STATUS_COR_INATIVO[s]
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
          {temFiltroAtivo && (
            <button
              onClick={limparFiltros}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 ml-1 transition-colors"
            >
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          {acolhidos.length === 0
            ? 'Nenhum resultado'
            : `${acolhidos.length} acolhido${acolhidos.length !== 1 ? 's' : ''} encontrado${acolhidos.length !== 1 ? 's' : ''}`}
          {temFiltroAtivo && ' com os filtros aplicados'}
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : acolhidos.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
          <User size={40} className="mx-auto mb-3 text-gray-300" />
          {temFiltroAtivo ? (
            <>
              <p className="font-medium">Nenhum acolhido corresponde aos filtros</p>
              <button onClick={limparFiltros} className="text-sm text-primary-600 hover:underline mt-2">
                Limpar todos os filtros
              </button>
            </>
          ) : (
            <>
              <p className="font-medium">Nenhum acolhido cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo acolhido" para começar</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden sm:table-cell">Prontuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden md:table-cell">Entrada</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs hidden lg:table-cell">Permanência</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {acolhidos.map(a => {
                const entrada = new Date(a.data_acolhimento + 'T00:00:00')
                const saida = a.data_saida ? new Date(a.data_saida + 'T00:00:00') : new Date()
                const dias = Math.floor((saida.getTime() - entrada.getTime()) / 86400000)
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/acolhidos/${a.id}`} className="font-medium text-primary-600 hover:underline">
                        {a.nome}
                      </Link>
                      {a.nome_social && <span className="text-gray-400 text-xs ml-1.5">({a.nome_social})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell font-mono text-xs">{a.numero_prontuario}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                      {entrada.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">
                        {dias < 30
                          ? `${dias} dias`
                          : dias < 365
                          ? `${Math.floor(dias / 30)} meses`
                          : `${Math.floor(dias / 365)}a ${Math.floor((dias % 365) / 30)}m`}
                        {a.status === 'ativo' && <span className="text-primary-400 ml-1">↑</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COR[a.status]}`}>
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
