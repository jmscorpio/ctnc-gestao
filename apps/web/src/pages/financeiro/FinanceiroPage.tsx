import { useState } from 'react'
import { DollarSign } from 'lucide-react'
import { TabVisaoGeral } from './TabVisaoGeral'
import { TabLancamentos } from './TabLancamentos'
import { TabConvenios } from './TabConvenios'
import { TabCategorias } from './TabCategorias'

type AbaId = 'visao_geral' | 'lancamentos' | 'convenios' | 'categorias'

const ABAS: { id: AbaId; label: string }[] = [
  { id: 'visao_geral', label: 'Visão Geral' },
  { id: 'lancamentos', label: 'Lançamentos' },
  { id: 'convenios', label: 'Convênios' },
  { id: 'categorias', label: 'Categorias' },
]

export function FinanceiroPage() {
  const [aba, setAba] = useState<AbaId>('visao_geral')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-emerald-100 rounded-lg">
          <DollarSign size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm">Receitas, despesas e convênios da CT</p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {ABAS.map(a => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                aba === a.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {a.label}
            </button>
          ))}
        </nav>
      </div>

      {aba === 'visao_geral' && <TabVisaoGeral />}
      {aba === 'lancamentos' && <TabLancamentos />}
      {aba === 'convenios' && <TabConvenios />}
      {aba === 'categorias' && <TabCategorias />}
    </div>
  )
}
