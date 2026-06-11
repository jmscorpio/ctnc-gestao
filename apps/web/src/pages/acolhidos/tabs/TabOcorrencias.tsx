import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, ShieldAlert } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

type IntercorrenciaTipo = 'saude' | 'comportamental' | 'fuga' | 'agressao' | 'acidente' | 'outro'
type Gravidade = 'leve' | 'moderada' | 'grave'

interface Intercorrencia {
  id: string
  tipo: IntercorrenciaTipo
  gravidade: Gravidade
  data_ocorrencia: string
  hora_ocorrencia: string | null
  descricao: string
  medidas_tomadas: string | null
  encaminhamento: string | null
}

interface Advertencia {
  id: string
  tipo: string
  descricao: string
  data_ocorrencia: string
}

const TIPO_LABEL: Record<IntercorrenciaTipo, string> = {
  saude: 'Saúde', comportamental: 'Comportamental',
  fuga: 'Fuga/Evasão', agressao: 'Agressão', acidente: 'Acidente', outro: 'Outro',
}

const GRAVIDADE_COR: Record<Gravidade, string> = {
  leve: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  moderada: 'bg-orange-50 border-orange-200 text-orange-700',
  grave: 'bg-red-50 border-red-200 text-red-700',
}

const GRAVIDADE_LABEL: Record<Gravidade, string> = {
  leve: 'Leve', moderada: 'Moderada', grave: 'Grave',
}

interface Props { acolhidoId: string }

export function TabOcorrencias({ acolhidoId }: Props) {
  const { profile } = useAuth()
  const [intercorrencias, setIntercorrencias] = useState<Intercorrencia[]>([])
  const [advertencias, setAdvertencias] = useState<Advertencia[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'intercorrencias' | 'advertencias'>('intercorrencias')
  const [criando, setCriando] = useState(false)

  const [formInter, setFormInter] = useState({
    tipo: 'saude' as IntercorrenciaTipo, gravidade: 'leve' as Gravidade,
    data_ocorrencia: new Date().toISOString().slice(0, 10), hora_ocorrencia: '',
    descricao: '', medidas_tomadas: '', encaminhamento: '',
  })
  const [formAdv, setFormAdv] = useState({
    tipo: '', descricao: '', data_ocorrencia: new Date().toISOString().slice(0, 10),
  })
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    const [inter, adv] = await Promise.all([
      supabase.from('intercorrencias').select('id, tipo, gravidade, data_ocorrencia, hora_ocorrencia, descricao, medidas_tomadas, encaminhamento')
        .eq('acolhido_id', acolhidoId).order('data_ocorrencia', { ascending: false }),
      supabase.from('advertencias').select('id, tipo, descricao, data_ocorrencia')
        .eq('acolhido_id', acolhidoId).order('data_ocorrencia', { ascending: false }),
    ])
    setIntercorrencias((inter.data ?? []) as Intercorrencia[])
    setAdvertencias((adv.data ?? []) as Advertencia[])
  }

  useEffect(() => { carregar() }, [acolhidoId])

  async function salvarIntercorrencia() {
    if (!profile || !formInter.descricao.trim()) return
    setSalvando(true)
    await supabase.from('intercorrencias').insert({
      acolhido_id: acolhidoId,
      tenant_id: profile.tenant_id,
      tipo: formInter.tipo,
      gravidade: formInter.gravidade,
      data_ocorrencia: formInter.data_ocorrencia,
      hora_ocorrencia: formInter.hora_ocorrencia || null,
      descricao: formInter.descricao,
      medidas_tomadas: formInter.medidas_tomadas || null,
      encaminhamento: formInter.encaminhamento || null,
      registrado_por: profile.id,
    })
    setFormInter({ tipo: 'saude', gravidade: 'leve', data_ocorrencia: new Date().toISOString().slice(0,10), hora_ocorrencia: '', descricao: '', medidas_tomadas: '', encaminhamento: '' })
    setCriando(false)
    setSalvando(false)
    await carregar()
  }

  async function salvarAdvertencia() {
    if (!profile || !formAdv.descricao.trim()) return
    setSalvando(true)
    await supabase.from('advertencias').insert({
      acolhido_id: acolhidoId,
      tenant_id: profile.tenant_id,
      tipo: formAdv.tipo || 'geral',
      descricao: formAdv.descricao,
      data_ocorrencia: formAdv.data_ocorrencia,
      registrado_por: profile.id,
    })
    setFormAdv({ tipo: '', descricao: '', data_ocorrencia: new Date().toISOString().slice(0,10) })
    setCriando(false)
    setSalvando(false)
    await carregar()
  }

  return (
    <div className="space-y-4">
      {/* Sub-abas */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => { setAbaAtiva('intercorrencias'); setCriando(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${abaAtiva === 'intercorrencias' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <AlertTriangle size={14} /> Intercorrências
            {intercorrencias.length > 0 && <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded-full">{intercorrencias.length}</span>}
          </button>
          <button
            onClick={() => { setAbaAtiva('advertencias'); setCriando(false) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${abaAtiva === 'advertencias' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ShieldAlert size={14} /> Advertências
            {advertencias.length > 0 && <span className="ml-1 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{advertencias.length}</span>}
          </button>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} /> {abaAtiva === 'intercorrencias' ? 'Nova intercorrência' : 'Nova advertência'}
        </button>
      </div>

      {/* ── Intercorrências ── */}
      {abaAtiva === 'intercorrencias' && (
        <>
          {criando && (
            <div className="bg-white rounded-xl border border-orange-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Nova Intercorrência</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                  <select value={formInter.tipo} onChange={e => setFormInter(f => ({ ...f, tipo: e.target.value as IntercorrenciaTipo }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {(Object.keys(TIPO_LABEL) as IntercorrenciaTipo[]).map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Gravidade</label>
                  <select value={formInter.gravidade} onChange={e => setFormInter(f => ({ ...f, gravidade: e.target.value as Gravidade }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="grave">Grave</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data</label>
                  <input type="date" value={formInter.data_ocorrencia} onChange={e => setFormInter(f => ({ ...f, data_ocorrencia: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hora</label>
                  <input type="time" value={formInter.hora_ocorrencia} onChange={e => setFormInter(f => ({ ...f, hora_ocorrencia: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Descrição *</label>
                  <textarea value={formInter.descricao} onChange={e => setFormInter(f => ({ ...f, descricao: e.target.value }))} rows={3}
                    placeholder="Descreva o que ocorreu..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Medidas tomadas</label>
                  <textarea value={formInter.medidas_tomadas} onChange={e => setFormInter(f => ({ ...f, medidas_tomadas: e.target.value }))} rows={2}
                    placeholder="Ações tomadas imediatamente..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Encaminhamento</label>
                  <input value={formInter.encaminhamento} onChange={e => setFormInter(f => ({ ...f, encaminhamento: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: Encaminhado à UPA, médico acionado..." />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCriando(false)} className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={salvarIntercorrencia} disabled={salvando || !formInter.descricao.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
                  {salvando ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </div>
          )}

          {intercorrencias.length === 0 && !criando ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Nenhuma intercorrência registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {intercorrencias.map(i => (
                <div key={i.id} className={`border rounded-xl p-4 ${GRAVIDADE_COR[i.gravidade]}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{TIPO_LABEL[i.tipo]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${GRAVIDADE_COR[i.gravidade]}`}>{GRAVIDADE_LABEL[i.gravidade]}</span>
                    </div>
                    <p className="text-xs shrink-0 opacity-70">
                      {new Date(i.data_ocorrencia + 'T00:00:00').toLocaleDateString('pt-BR')}
                      {i.hora_ocorrencia ? ` às ${i.hora_ocorrencia.slice(0,5)}` : ''}
                    </p>
                  </div>
                  <p className="text-sm">{i.descricao}</p>
                  {i.medidas_tomadas && <p className="text-xs mt-2 opacity-80"><strong>Medidas:</strong> {i.medidas_tomadas}</p>}
                  {i.encaminhamento && <p className="text-xs mt-1 opacity-80"><strong>Encaminhamento:</strong> {i.encaminhamento}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Advertências ── */}
      {abaAtiva === 'advertencias' && (
        <>
          {criando && (
            <div className="bg-white rounded-xl border border-red-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Nova Advertência</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                  <input value={formAdv.tipo} onChange={e => setFormAdv(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: Verbal, Escrita, Suspensão" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Data</label>
                  <input type="date" value={formAdv.data_ocorrencia} onChange={e => setFormAdv(f => ({ ...f, data_ocorrencia: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Descrição *</label>
                  <textarea value={formAdv.descricao} onChange={e => setFormAdv(f => ({ ...f, descricao: e.target.value }))} rows={3}
                    placeholder="Descreva o motivo da advertência..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setCriando(false)} className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={salvarAdvertencia} disabled={salvando || !formAdv.descricao.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium">
                  {salvando ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </div>
          )}

          {advertencias.length === 0 && !criando ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <ShieldAlert size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Nenhuma advertência registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {advertencias.map(a => (
                <div key={a.id} className="border border-red-100 bg-red-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-red-700">{a.tipo}</span>
                    <span className="text-xs text-red-400 shrink-0">
                      {new Date(a.data_ocorrencia + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-red-800">{a.descricao}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
