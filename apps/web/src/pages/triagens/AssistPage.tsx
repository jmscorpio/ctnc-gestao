import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import {
  SUBSTANCIAS,
  Q2_OPCOES, Q3_OPCOES, Q4_OPCOES, Q5_OPCOES, Q6_OPCOES, Q7_OPCOES, Q8_OPCOES,
  calcularScoreSubstancia, classificarRiscoAssist,
  RISCO_COR, RISCO_LABEL, RISCO_INTERVENCAO,
} from '@ctnc/shared'
import type { RiscoNivel } from '@ctnc/shared'

type Passo = 'instrucoes' | 'q1' | 'perSubstancia' | 'q8' | 'resultado'

interface ScoreSubstancia {
  substanciaId: string
  label: string
  score: number
  nivel: RiscoNivel
}

function OpcaoBtn({
  selecionado,
  onClick,
  children,
}: {
  selecionado: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
        selecionado
          ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

export function AssistPage() {
  const { id: acolhidoId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [passo, setPasso] = useState<Passo>('instrucoes')
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [substanciaIdx, setSubstanciaIdx] = useState(0)
  const [questaoIdx, setQuestaoIdx] = useState(0) // 0=Q2, 1=Q3, ..., 5=Q7
  const [q8, setQ8] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [scores, setScores] = useState<ScoreSubstancia[]>([])
  const [observacoes, setObservacoes] = useState('')

  const substanciasUsadas = SUBSTANCIAS.filter(s => respostas[`q1_${s.id}`] === 1)
  const substanciaAtual = substanciasUsadas[substanciaIdx]

  const questoesPorSubstancia = [
    { key: 'q2', opcoes: Q2_OPCOES, texto: (sub: string) => `Nos últimos 3 meses, com que frequência você usou ${sub}?` },
    { key: 'q3', opcoes: Q3_OPCOES, texto: (sub: string) => `Nos últimos 3 meses, com que frequência sentiu um forte desejo ou vontade de usar ${sub}?` },
    { key: 'q4', opcoes: Q4_OPCOES, texto: (sub: string) => `Nos últimos 3 meses, com que frequência o uso de ${sub} resultou em problemas de saúde, sociais, legais ou financeiros?` },
    { key: 'q5', opcoes: Q5_OPCOES, texto: (sub: string) => `Nos últimos 3 meses, com que frequência você deixou de fazer o que era esperado por causa do uso de ${sub}?` },
    { key: 'q6', opcoes: Q6_OPCOES, texto: (sub: string) => `Um amigo, familiar ou alguém se preocupou com seu uso de ${sub}?` },
    { key: 'q7', opcoes: Q7_OPCOES, texto: (sub: string) => `Você já tentou controlar, diminuir ou parar o uso de ${sub} e não conseguiu?` },
  ]

  function setResposta(chave: string, valor: number) {
    setRespostas(r => ({ ...r, [chave]: valor }))
  }

  function avancarQ1() {
    const usadas = SUBSTANCIAS.filter(s => respostas[`q1_${s.id}`] === 1)
    if (usadas.length === 0) {
      setPasso('q8')
    } else {
      setSubstanciaIdx(0)
      setQuestaoIdx(0)
      setPasso('perSubstancia')
    }
  }

  function avancarQuestaoSubstancia() {
    const questaoKey = `${questoesPorSubstancia[questaoIdx].key}_${substanciaAtual.id}`
    if (respostas[questaoKey] === undefined) return

    if (questaoIdx < questoesPorSubstancia.length - 1) {
      setQuestaoIdx(q => q + 1)
    } else if (substanciaIdx < substanciasUsadas.length - 1) {
      setSubstanciaIdx(i => i + 1)
      setQuestaoIdx(0)
    } else {
      setPasso('q8')
    }
  }

  function voltarQuestaoSubstancia() {
    if (questaoIdx > 0) {
      setQuestaoIdx(q => q - 1)
    } else if (substanciaIdx > 0) {
      setSubstanciaIdx(i => i - 1)
      setQuestaoIdx(questoesPorSubstancia.length - 1)
    } else {
      setPasso('q1')
    }
  }

  function calcularResultados() {
    const novosScores: ScoreSubstancia[] = substanciasUsadas.map(s => {
      const score = calcularScoreSubstancia(s.id, respostas)
      return { substanciaId: s.id, label: s.label, score, nivel: classificarRiscoAssist(s.id, score) }
    })
    setScores(novosScores)
    setPasso('resultado')
  }

  async function salvar() {
    if (!profile || !acolhidoId) return
    setSalvando(true)

    const scoreTotal = scores.reduce((acc, s) => acc + s.score, 0)
    const nivelMaisAlto = scores.some(s => s.nivel === 'alto')
      ? 'alto'
      : scores.some(s => s.nivel === 'moderado')
      ? 'moderado'
      : 'baixo'

    const { data: triagem, error } = await supabase
      .from('triagens')
      .insert({
        acolhido_id: acolhidoId,
        tenant_id: profile.tenant_id,
        tipo: 'assist',
        realizada_por: profile.id,
        score_total: scoreTotal,
        nivel_risco: nivelMaisAlto as 'baixo' | 'moderado' | 'alto' | 'muito_alto',
        observacoes: observacoes || null,
      })
      .select()
      .single()

    if (error || !triagem) { setSalvando(false); return }

    // Salvar respostas individuais
    const respostasArr = Object.entries(respostas).map(([questao_id, resposta]) => ({
      triagem_id: triagem.id,
      questao_id,
      resposta,
    }))
    if (q8 !== null) respostasArr.push({ triagem_id: triagem.id, questao_id: 'q8', resposta: q8 })
    await supabase.from('triagem_respostas').insert(respostasArr)

    // Salvar scores por substância
    const scoresArr = scores.map(s => ({
      triagem_id: triagem.id,
      substancia: s.substanciaId,
      score: s.score,
      nivel_risco: s.nivel as 'baixo' | 'moderado' | 'alto' | 'muito_alto',
    }))
    if (scoresArr.length > 0) await supabase.from('assist_scores_substancia').insert(scoresArr)

    setSalvando(false)
    navigate(`/acolhidos/${acolhidoId}`)
  }

  // ── Renderização por passo ──────────────────────────────────

  if (passo === 'instrucoes') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 rounded-lg"><ClipboardList size={22} className="text-primary-600" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ASSIST</h1>
              <p className="text-sm text-gray-500">Alcohol, Smoking and Substance Involvement Screening Test — OMS</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            O ASSIST é um instrumento de triagem desenvolvido pela Organização Mundial da Saúde para identificar o envolvimento com substâncias psicoativas.
          </p>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 mb-6">
            <li>Abrange 10 substâncias (tabaco, álcool, cannabis e outras)</li>
            <li>8 questões no total, algumas aplicadas por substância</li>
            <li>Duração estimada: 5 a 10 minutos</li>
            <li>Gera score e classificação de risco por substância</li>
          </ul>
          <button
            onClick={() => setPasso('q1')}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg py-3 text-sm transition-colors"
          >
            Iniciar triagem
          </button>
        </div>
      </div>
    )
  }

  if (passo === 'q1') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => setPasso('instrucoes')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Questão 1 de 8</p>
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            Durante toda a sua vida, qual das seguintes substâncias você já usou alguma vez? (Não inclua medicamentos usados conforme prescrição médica.)
          </h2>
          <div className="space-y-2">
            {SUBSTANCIAS.map(s => {
              const selecionado = respostas[`q1_${s.id}`] === 1
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setResposta(`q1_${s.id}`, selecionado ? 0 : 1)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    selecionado
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{s.label}</span>
                  <span className="text-gray-400 text-xs ml-2">({s.exemplos})</span>
                </button>
              )
            })}
          </div>
          <button
            onClick={avancarQ1}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg py-3 text-sm transition-colors"
          >
            Continuar <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (passo === 'perSubstancia' && substanciaAtual) {
    const questaoAtual = questoesPorSubstancia[questaoIdx]
    const chave = `${questaoAtual.key}_${substanciaAtual.id}`
    const respostaAtual = respostas[chave]
    const totalQuestoes = substanciasUsadas.length * questoesPorSubstancia.length
    const questaoNum = substanciaIdx * questoesPorSubstancia.length + questaoIdx + 2

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={voltarQuestaoSubstancia} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Questão {questaoNum} · {substanciaAtual.label}</p>
            <p className="text-xs text-gray-400">{substanciaIdx * questoesPorSubstancia.length + questaoIdx + 1}/{totalQuestoes}</p>
          </div>
          {/* Barra de progresso */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
            <div
              className="bg-primary-500 h-1.5 rounded-full transition-all"
              style={{ width: `${((substanciaIdx * questoesPorSubstancia.length + questaoIdx + 1) / totalQuestoes) * 100}%` }}
            />
          </div>

          <h2 className="text-base font-semibold text-gray-900 mb-5">
            {questaoAtual.texto(substanciaAtual.label.toLowerCase())}
          </h2>
          <div className="space-y-2">
            {questaoAtual.opcoes.map(op => (
              <OpcaoBtn
                key={op.valor}
                selecionado={respostaAtual === op.valor}
                onClick={() => setResposta(chave, op.valor)}
              >
                {op.label}
              </OpcaoBtn>
            ))}
          </div>
          <button
            disabled={respostaAtual === undefined}
            onClick={avancarQuestaoSubstancia}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-medium rounded-lg py-3 text-sm transition-colors"
          >
            Continuar <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (passo === 'q8') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => substanciasUsadas.length > 0 ? setPasso('perSubstancia') : setPasso('q1')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Questão 8 de 8</p>
          <h2 className="text-base font-semibold text-gray-900 mb-5">
            Você já usou alguma droga por injeção?
          </h2>
          <div className="space-y-2">
            {Q8_OPCOES.map(op => (
              <OpcaoBtn key={op.valor} selecionado={q8 === op.valor} onClick={() => setQ8(op.valor)}>
                {op.label}
              </OpcaoBtn>
            ))}
          </div>
          <button
            disabled={q8 === null}
            onClick={calcularResultados}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-medium rounded-lg py-3 text-sm transition-colors"
          >
            Ver resultado <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (passo === 'resultado') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Resultado ASSIST</h1>
          <p className="text-sm text-gray-500 mb-5">Scores e classificação de risco por substância</p>

          {scores.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">Nenhuma substância relatada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map(s => (
                <div key={s.substanciaId} className={`border rounded-lg p-4 ${RISCO_COR[s.nivel]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{s.label}</span>
                    <span className="font-bold text-lg">{s.score}</span>
                  </div>
                  <p className="text-sm font-medium">{RISCO_LABEL[s.nivel]}</p>
                  <p className="text-xs mt-1 opacity-80">{RISCO_INTERVENCAO[s.nivel]}</p>
                </div>
              ))}
            </div>
          )}

          {q8 !== null && q8 > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-700">Uso injetável relatado</p>
              <p className="text-xs text-red-600 mt-1">Avaliação de risco para HIV, hepatite B e C recomendada.</p>
            </div>
          )}

          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações do aplicador</label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Observações sobre a aplicação da triagem..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPasso('q8')}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Revisar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            <Check size={16} />
            {salvando ? 'Salvando...' : 'Salvar triagem'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
