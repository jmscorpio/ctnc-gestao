import { Link } from 'react-router-dom'
import { Plus, ClipboardList } from 'lucide-react'
import { RISCO_COR, RISCO_LABEL, AUDIT_RISCO_COR, AUDIT_RISCO_LABEL } from '@ctnc/shared'

interface TriagemResumo {
  id: string
  tipo: 'assist' | 'audit'
  realizada_em: string
  score_total: number | null
  nivel_risco: string | null
}

interface Props {
  acolhidoId: string
  triagens: TriagemResumo[]
}

function mapRiscoAudit(nivel: string) {
  return nivel.replace('baixo','zona1').replace('moderado','zona2').replace('alto','zona3').replace('muito_alto','zona4') as keyof typeof AUDIT_RISCO_COR
}

export function TabTriagens({ acolhidoId, triagens }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Link to={`/acolhidos/${acolhidoId}/triagem/assist`}
          className="flex items-center gap-1 text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
          <Plus size={14} /> ASSIST
        </Link>
        <Link to={`/acolhidos/${acolhidoId}/triagem/audit`}
          className="flex items-center gap-1 text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
          <Plus size={14} /> AUDIT
        </Link>
      </div>

      {triagens.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <ClipboardList size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Nenhuma triagem realizada</p>
          <p className="text-sm mt-1">Aplique o ASSIST ou o AUDIT usando os botões acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {triagens.map(t => {
            const isAssist = t.tipo === 'assist'
            const cor = isAssist
              ? (t.nivel_risco ? RISCO_COR[t.nivel_risco as keyof typeof RISCO_COR] : 'bg-gray-100 text-gray-600 border-gray-200')
              : (t.nivel_risco ? AUDIT_RISCO_COR[mapRiscoAudit(t.nivel_risco)] : 'bg-gray-100 text-gray-600 border-gray-200')
            const label = isAssist
              ? (t.nivel_risco ? RISCO_LABEL[t.nivel_risco as keyof typeof RISCO_LABEL] : '—')
              : (t.nivel_risco ? AUDIT_RISCO_LABEL[mapRiscoAudit(t.nivel_risco)] : '—')
            return (
              <div key={t.id} className={`flex items-center justify-between border rounded-xl px-5 py-3 ${cor}`}>
                <div>
                  <span className="font-bold text-sm uppercase">{t.tipo}</span>
                  <span className="text-xs ml-2 opacity-70">
                    {new Date(t.realizada_em + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{label}</p>
                  {t.score_total !== null && <p className="text-xs opacity-70">Score: {t.score_total}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
