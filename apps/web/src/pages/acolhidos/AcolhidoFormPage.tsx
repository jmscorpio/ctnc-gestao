import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { uploadFoto, getFotoUrl } from '../../lib/storage'
import { maskCPF, maskTelefone, maskCEP } from '../../lib/masks'
import { useAuth } from '../../contexts/AuthContext'

const schema = z.object({
  nome: z.string().min(3, 'Nome obrigatório'),
  nome_social: z.string().optional(),
  data_nascimento: z.string().min(1, 'Data de nascimento obrigatória'),
  sexo: z.enum(['masculino', 'feminino', 'outro']),
  estado_civil: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'outro']).optional(),
  escolaridade: z.enum(['sem_escolaridade','fundamental_incompleto','fundamental_completo','medio_incompleto','medio_completo','superior_incompleto','superior_completo','pos_graduacao']).optional(),
  profissao: z.string().optional(),
  naturalidade: z.string().optional(),
  nacionalidade: z.string().default('Brasileira'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  rg_orgao_emissor: z.string().optional(),
  data_acolhimento: z.string().min(1, 'Data de acolhimento obrigatória'),
  observacoes: z.string().optional(),
  // Contato
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  endereco_logradouro: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_estado: z.string().optional(),
  endereco_cep: z.string().optional(),
  // Responsável
  responsavel_nome: z.string().optional(),
  responsavel_parentesco: z.string().optional(),
  responsavel_celular: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
    />
  )
}

function Select({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white ${className}`}
    />
  )
}

export function AcolhidoFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nacionalidade: 'Brasileira', sexo: 'masculino', data_acolhimento: new Date().toISOString().slice(0, 10) },
  })

  useEffect(() => {
    if (!isEdit || !id) return
    async function load() {
      const { data: acolhido } = await supabase.from('acolhidos').select('*').eq('id', id!).single()
      if (!acolhido) return
      const { data: contato } = await supabase.from('acolhidos_contato').select('*').eq('acolhido_id', id!).single()
      const { data: responsaveis } = await supabase.from('responsaveis').select('*').eq('acolhido_id', id!).limit(1)
      const resp = responsaveis?.[0]
      reset({
        ...acolhido,
        estado_civil: acolhido.estado_civil ?? undefined,
        escolaridade: acolhido.escolaridade ?? undefined,
        nome_social: acolhido.nome_social ?? '',
        profissao: acolhido.profissao ?? '',
        naturalidade: acolhido.naturalidade ?? '',
        cpf: acolhido.cpf ?? '',
        rg: acolhido.rg ?? '',
        rg_orgao_emissor: acolhido.rg_orgao_emissor ?? '',
        observacoes: acolhido.observacoes ?? '',
        telefone: contato?.telefone ?? '',
        celular: contato?.celular ?? '',
        email: contato?.email ?? '',
        endereco_logradouro: contato?.endereco_logradouro ?? '',
        endereco_numero: contato?.endereco_numero ?? '',
        endereco_bairro: contato?.endereco_bairro ?? '',
        endereco_cidade: contato?.endereco_cidade ?? '',
        endereco_estado: contato?.endereco_estado ?? '',
        endereco_cep: contato?.endereco_cep ?? '',
        responsavel_nome: resp?.nome ?? '',
        responsavel_parentesco: resp?.parentesco ?? '',
        responsavel_celular: resp?.celular ?? '',
      })
      setFotoUrl(acolhido.foto_url)
      getFotoUrl(acolhido.foto_url).then(setFotoPreview)
    }
    load()
  }, [id, isEdit, reset])

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingFoto(true)
    try {
      const path = await uploadFoto(profile.tenant_id, file)
      setFotoUrl(path)
      setFotoPreview(URL.createObjectURL(file))
    } finally {
      setUploadingFoto(false)
    }
  }

  async function onSubmit(data: FormData) {
    if (!profile) return
    setSaving(true)
    try {
      if (isEdit && id) {
        await supabase.from('acolhidos').update({
          nome: data.nome,
          nome_social: data.nome_social || null,
          data_nascimento: data.data_nascimento,
          sexo: data.sexo,
          estado_civil: data.estado_civil || null,
          escolaridade: data.escolaridade || null,
          profissao: data.profissao || null,
          naturalidade: data.naturalidade || null,
          nacionalidade: data.nacionalidade,
          cpf: data.cpf || null,
          rg: data.rg || null,
          rg_orgao_emissor: data.rg_orgao_emissor || null,
          data_acolhimento: data.data_acolhimento,
          observacoes: data.observacoes || null,
          foto_url: fotoUrl,
        }).eq('id', id)

        await supabase.from('acolhidos_contato').upsert({
          acolhido_id: id,
          tenant_id: profile.tenant_id,
          telefone: data.telefone || null,
          celular: data.celular || null,
          email: data.email || null,
          endereco_logradouro: data.endereco_logradouro || null,
          endereco_numero: data.endereco_numero || null,
          endereco_bairro: data.endereco_bairro || null,
          endereco_cidade: data.endereco_cidade || null,
          endereco_estado: data.endereco_estado || null,
          endereco_cep: data.endereco_cep || null,
        }, { onConflict: 'acolhido_id' })

        navigate(`/acolhidos/${id}`)
      } else {
        const { data: novo, error } = await supabase.from('acolhidos').insert({
          tenant_id: profile.tenant_id,
          status: 'ativo',
          nome: data.nome,
          nome_social: data.nome_social || null,
          data_nascimento: data.data_nascimento,
          sexo: data.sexo,
          estado_civil: data.estado_civil || null,
          escolaridade: data.escolaridade || null,
          profissao: data.profissao || null,
          naturalidade: data.naturalidade || null,
          nacionalidade: data.nacionalidade,
          cpf: data.cpf || null,
          rg: data.rg || null,
          rg_orgao_emissor: data.rg_orgao_emissor || null,
          data_acolhimento: data.data_acolhimento,
          observacoes: data.observacoes || null,
          foto_url: fotoUrl,
          created_by: profile.id,
        }).select().single()

        if (error || !novo) throw error

        if (data.telefone || data.celular || data.email || data.endereco_logradouro) {
          await supabase.from('acolhidos_contato').insert({
            acolhido_id: novo.id,
            tenant_id: profile.tenant_id,
            telefone: data.telefone || null,
            celular: data.celular || null,
            email: data.email || null,
            endereco_logradouro: data.endereco_logradouro || null,
            endereco_numero: data.endereco_numero || null,
            endereco_bairro: data.endereco_bairro || null,
            endereco_cidade: data.endereco_cidade || null,
            endereco_estado: data.endereco_estado || null,
            endereco_cep: data.endereco_cep || null,
          })
        }

        if (data.responsavel_nome) {
          await supabase.from('responsaveis').insert({
            acolhido_id: novo.id,
            tenant_id: profile.tenant_id,
            nome: data.responsavel_nome,
            parentesco: data.responsavel_parentesco ?? '',
            celular: data.responsavel_celular || null,
            principal: true,
          })
        }

        navigate(`/acolhidos/${novo.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Acolhido' : 'Novo Acolhido'}</h1>
          <p className="text-gray-500 text-sm">Preencha os dados do prontuário</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Foto */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Foto</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Foto do acolhido" className="w-full h-full object-cover" />
              ) : (
                <Upload size={24} className="text-gray-400" />
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="text-sm border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {uploadingFoto ? 'Enviando...' : 'Selecionar foto'}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WEBP</p>
            </div>
          </div>
        </div>

        {/* Dados pessoais */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome completo *" error={errors.nome?.message}>
              <Input {...register('nome')} placeholder="Nome completo" />
            </Field>
            <Field label="Nome social">
              <Input {...register('nome_social')} placeholder="Se houver" />
            </Field>
            <Field label="Data de nascimento *" error={errors.data_nascimento?.message}>
              <Input type="date" {...register('data_nascimento')} />
            </Field>
            <Field label="Sexo *" error={errors.sexo?.message}>
              <Select {...register('sexo')}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </Select>
            </Field>
            <Field label="Estado civil">
              <Select {...register('estado_civil')}>
                <option value="">Selecione</option>
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
                <option value="uniao_estavel">União estável</option>
                <option value="outro">Outro</option>
              </Select>
            </Field>
            <Field label="Escolaridade">
              <Select {...register('escolaridade')}>
                <option value="">Selecione</option>
                <option value="sem_escolaridade">Sem escolaridade</option>
                <option value="fundamental_incompleto">Fundamental incompleto</option>
                <option value="fundamental_completo">Fundamental completo</option>
                <option value="medio_incompleto">Médio incompleto</option>
                <option value="medio_completo">Médio completo</option>
                <option value="superior_incompleto">Superior incompleto</option>
                <option value="superior_completo">Superior completo</option>
                <option value="pos_graduacao">Pós-graduação</option>
              </Select>
            </Field>
            <Field label="Profissão">
              <Input {...register('profissao')} placeholder="Profissão" />
            </Field>
            <Field label="Naturalidade">
              <Input {...register('naturalidade')} placeholder="Cidade/UF" />
            </Field>
            <Field label="Nacionalidade">
              <Input {...register('nacionalidade')} placeholder="Brasileira" />
            </Field>
            <Field label="CPF">
              <Input {...register('cpf')} onChange={e => setValue('cpf', maskCPF(e.target.value))} inputMode="numeric" maxLength={14} placeholder="000.000.000-00" />
            </Field>
            <Field label="RG">
              <Input {...register('rg')} placeholder="Número do RG" />
            </Field>
            <Field label="Órgão emissor RG">
              <Input {...register('rg_orgao_emissor')} placeholder="SSP/UF" />
            </Field>
            <Field label="Data de acolhimento *" error={errors.data_acolhimento?.message}>
              <Input type="date" {...register('data_acolhimento')} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Observações">
              <textarea
                {...register('observacoes')}
                rows={3}
                placeholder="Observações gerais sobre o acolhimento..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </Field>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Contato e Endereço</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefone">
              <Input {...register('telefone')} onChange={e => setValue('telefone', maskTelefone(e.target.value))} inputMode="numeric" maxLength={15} placeholder="(00) 0000-0000" />
            </Field>
            <Field label="Celular">
              <Input {...register('celular')} onChange={e => setValue('celular', maskTelefone(e.target.value))} inputMode="numeric" maxLength={15} placeholder="(00) 90000-0000" />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register('email')} placeholder="email@exemplo.com" />
            </Field>
            <Field label="CEP">
              <Input {...register('endereco_cep')} onChange={e => setValue('endereco_cep', maskCEP(e.target.value))} inputMode="numeric" maxLength={9} placeholder="00000-000" />
            </Field>
            <Field label="Logradouro">
              <Input {...register('endereco_logradouro')} placeholder="Rua, Av..." />
            </Field>
            <Field label="Número">
              <Input {...register('endereco_numero')} placeholder="Nº" />
            </Field>
            <Field label="Bairro">
              <Input {...register('endereco_bairro')} placeholder="Bairro" />
            </Field>
            <Field label="Cidade">
              <Input {...register('endereco_cidade')} placeholder="Cidade" />
            </Field>
            <Field label="Estado (UF)">
              <Input {...register('endereco_estado')} placeholder="UF" maxLength={2} />
            </Field>
          </div>
        </div>

        {/* Responsável */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Responsável / Familiar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Nome do responsável">
              <Input {...register('responsavel_nome')} placeholder="Nome completo" />
            </Field>
            <Field label="Parentesco">
              <Input {...register('responsavel_parentesco')} placeholder="Mãe, Pai, Cônjuge..." />
            </Field>
            <Field label="Celular">
              <Input {...register('responsavel_celular')} onChange={e => setValue('responsavel_celular', maskTelefone(e.target.value))} inputMode="numeric" maxLength={15} placeholder="(00) 90000-0000" />
            </Field>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-700 rounded-lg px-5 py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
