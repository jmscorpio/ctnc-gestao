import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Wine } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  AUDIT_QUESTOES,
  classificarRiscoAudit,
  AUDIT_RISCO_LABEL,
  AUDIT_RISCO_COR,
  AUDIT_RISCO_INTERVENCAO,
} from '@ctnc/shared'

type Passo = 'instrucoes' | 'questoes' | 'resultado'

export function AuditPage() {
  const { id: acolhidoId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [passo, setPasso] = useState<Passo>('instrucoes')
  const [questaoIdx, setQuestaoIdx] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)

  const questaoAtual = AUDIT_QUESTOES[questaoIdx]
  const respostaAtual = respostas[questaoAtual?.id]
  const scoreTotal = Object.values(respostas).reduce((acc, v) => acc + v, 0)
  const classificacao = classificarRiscoAudit(scoreTotal)

  function selecionar(valor: number) {
    setRespostas(r => ({ ...r, [questaoAtual.id]: valor }))
  }

  function avancar() {
    if (respostaAtual === undefined) return
    if (questaoIdx < AUDIT_QUESTOES.length - 1) {
      setQuestaoIdx(i => i + 1)
    } else {
      setPasso('resultado')
    }
  }

  function voltar() {
    if (questaoIdx > 0) setQuestaoIdx(i => i - 1)
    else setPasso('instrucoes')
  }

  async function salvar() {
    if (!profile || !acolhidoId) return
    setSalvando(true)

    const nivelMap = { zona1: 'baixo', zona2: 'moderado', zona3: 'alto', zona4: 'muito_alto' } as const

    const { data: triagem, error } = await supabase
      .from('triagens')
      .insert({
        acolhido_id: acolhidoId,
        tenant_id: profile.tenant_id,
        tipo: 'audit',
        realizada_por: profile.id,
        score_total: scoreTotal,
        nivel_risco: nivelMap[classificacao],
        observacoes: observacoes || null,
      })
      .select()
      .single()

    if (error || !triagem) { setSalvando(false); return }

    const respostasArr = Object.entries(respostas).map(([questao_id, resposta]) => ({
      triagem_id: triagem.id,
      questao_id,
      resposta,
    }))
    await supabase.from('triagem_respostas').insert(respostasArr)

    setSalvando(false)
    navigate(`/acolhidos/${acolhidoId}`)
  }

  // ── Instrucoes ─────────────────────────────────────────────

  if (passo === 'instrucoes') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg"><Wine size={22} className="text-blue-600" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AUDIT</h1>
              <p className="text-sm text-gray-500">Alcohol Use Disorders Identification Test — OMS</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            O AUDIT é um instrumento desenvolvido pela OMS para identificar padrões de consumo de álcool e problemas relacionados.
          </p>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 mb-6">
            <li>10 questões sobre consumo de álcool</li>
            <li>Score de 0 a 40 pontos</li>
            <li>4 zonas de risco com intervenções recomendadas</li>
            <li>Duração estimada: 3 a 5 minutos</li>
          </ul>

          <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
            {(['zona1','zona2','zona3','zona4'] as const).map(z => (
              <div key={z} className={`px-3 py-2 rounded-lg border ${AUDIT_RISCO_COR[z]}`}>
                <p className="font-semibold">{AUDIT_RISCO_LABEL[z]}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setQuestaoIdx(0); setPasso('questoes') }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-3 text-sm transition-colors"
          >
            Iniciar triagem
          </button>
        </div>
      </div>
    )
  }

  // ── Questões ───────────────────────────────────────────────

  if (passo === 'questoes') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={voltar} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Questão {questaoIdx + 1} de {AUDIT_QUESTOES.length}</p>
            <p className="text-xs text-gray-400">{Math.round(((questaoIdx + 1) / AUDIT_QUESTOES.length) * 100)}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${((questaoIdx + 1) / AUDIT_QUESTOES.length) * 100}%` }}
            />
          </div>

          <h2 className="text-base font-semibold text-gray-900 mb-5">{questaoAtual.texto}</h2>

          <div className="space-y-2">
            {questaoAtual.opcoes.map(op => (
              <button
                key={op.valor}
                type="button"
                onClick={() => selecionar(op.valor)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  respostaAtual === op.valor
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          <button
            disabled={respostaAtual === undefined}
            onClick={avancar}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium rounded-lg py-3 text-sm transition-colors"
          >
            {questaoIdx < AUDIT_QUESTOES.length - 1 ? <><span>Próxima</span><ArrowRight size={16} /></> : <><span>Ver resultado</span><ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    )
  }

  // ── Resultado ──────────────────────────────────────────────

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Resultado AUDIT</h1>
        <p className="text-sm text-gray-500 mb-5">Classificação do padrão de consumo de álcool</p>

        <div className={`border rounded-xl p-5 mb-5 ${AUDIT_RISCO_COR[classificacao]}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xl">{AUDIT_RISCO_LABEL[classificacao]}</span>
            <span className="text-3xl font-bold">{scoreTotal}</span>
          </div>
          <p className="text-sm font-medium mb-1">Intervenção recomendada:</p>
          <p className="text-sm opacity-90">{AUDIT_RISCO_INTERVENCAO[classificacao]}</p>
        </div>

        <div className="grid grid-cols-1 gap-1 mb-5">
          {AUDIT_QUESTOES.map((q, i) => (
            <div key={q.id} className="flex items-start justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-gray-600 flex-1 pr-4">Q{i + 1}. {q.texto.substring(0, 60)}...</span>
              <span className="font-semibold text-gray-900 shrink-0">{respostas[q.id] ?? 0}</span>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações do aplicador</label>
          <textarea
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Observações sobre a aplicação da triagem..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { setQuestaoIdx(AUDIT_QUESTOES.length - 1); setPasso('questoes') }}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Revisar
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          <Check size={16} />
          {salvando ? 'Salvando...' : 'Salvar triagem'}
        </button>
      </div>
    </div>
  )
}
