'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  AlertTriangle, RefreshCw, Search, User,
  UserPlus, X, Save, Phone, MapPin, CreditCard,
  Clock, CheckCircle, History
} from 'lucide-react'

interface Papiro {
  id: string
  titulo: string
  autor: string
  status: string
  imagem_url?: string
  genero?: string
  isbn?: string
}

interface Leitor {
  id: string
  nome_completo: string
  cpf: string | null
  telefone: string | null
  endereco: string | null
}

interface EmprestimoHistorico {
  id: string
  data_retirada: string
  devolvido: boolean
  papiros: { titulo: string } | null
}

interface FormEmprestimoProps {
  isAdmin: boolean
  userId: string // Mantido por compatibilidade de props, mas ignorado na lógica
  onSuccess: () => void
}

const EMPTY_LEITOR = {
  nome_completo: '',
  cpf: '',
  endereco: '',
  telefone: '',
}

export default function FormEmprestimo({ isAdmin, onSuccess }: FormEmprestimoProps) {
  const [papiros, setPapiros] = useState<Papiro[]>([])
  const [leitores, setLeitores] = useState<Leitor[]>([])
  
  const [papiroId, setPapiroId] = useState('')
  const [buscaLivro, setBuscaLivro] = useState('')
  const [modoLeitor, setModoLeitor] = useState<'existente' | 'novo'>('existente')
  const [buscaLeitor, setBuscaLeitor] = useState('')
  const [leitorSelecionado, setLeitorSelecionado] = useState<Leitor | null>(null)
  const [historico, setHistorico] = useState<EmprestimoHistorico[]>([])

  // Formulário novo leitor
  const [novoLeitor, setNovoLeitor] = useState(EMPTY_LEITOR)
  const [cadastrando, setCadastrando] = useState(false)
  const [erroForm, setErroForm] = useState('')

  const [diasEmprestimo, setDiasEmprestimo] = useState(14)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase.from('papiros').select('*').eq('status', 'disponivel').order('titulo')
      .then(({ data }) => setPapiros(data || []))

    fetchLeitores()
  }, [])

  async function fetchLeitores() {
    const { data } = await supabase.from('leitores_externos').select('*').order('nome_completo')
    setLeitores(data || [])
  }

  // Carregar histórico quando selecionar um leitor
  useEffect(() => {
    if (leitorSelecionado) {
      fetchHistorico(leitorSelecionado.id)
    } else {
      setHistorico([])
    }
  }, [leitorSelecionado])

  const papirosFiltrados = papiros.filter(p => 
    p.titulo.toLowerCase().includes(buscaLivro.toLowerCase()) ||
    p.autor.toLowerCase().includes(buscaLivro.toLowerCase()) ||
    p.isbn?.includes(buscaLivro)
  )

  async function fetchHistorico(leitorId: string) {
    const { data } = await supabase
      .from('concessoes')
      .select('id, data_retirada, devolvido, papiros(titulo)')
      .eq('leitor_externo_id', leitorId)
      .order('data_retirada', { ascending: false })
      .limit(5)
    setHistorico((data as any) || [])
  }

  async function cadastrarESelecionar() {
    if (!novoLeitor.nome_completo.trim()) { setErroForm('Nome é obrigatório.'); return }
    setCadastrando(true)
    
    const { data, error } = await supabase
      .from('leitores_externos')
      .insert({
        nome_completo: novoLeitor.nome_completo.trim(),
        cpf: novoLeitor.cpf.trim() || null,
        telefone: novoLeitor.telefone.trim() || null,
        endereco: novoLeitor.endereco.trim() || null,
      })
      .select().single()

    if (error) {
      setErroForm(error.message)
    } else if (data) {
      await fetchLeitores()
      setLeitorSelecionado(data)
      setModoLeitor('existente')
      setNovoLeitor(EMPTY_LEITOR)
    }
    setCadastrando(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!papiroId || !leitorSelecionado) {
      setErro('Selecione o pergaminho e o leitor.')
      return
    }

    if (!confirm(`Deseja confirmar a saída deste pergaminho para "${leitorSelecionado.nome_completo}"?`)) {
      return
    }

    setLoading(true)
    const dataDevolucao = new Date()
    dataDevolucao.setDate(dataDevolucao.getDate() + diasEmprestimo)

    const { error } = await supabase.from('concessoes').insert({
      papiro_id: papiroId,
      leitor_externo_id: leitorSelecionado.id,
      data_devolucao_prevista: dataDevolucao.toISOString(),
      devolvido: false,
    })

    if (error) {
      setErro(`Erro: ${error.message}`)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  const leitoresFiltrados = leitores.filter(l => 
    l.nome_completo.toLowerCase().includes(buscaLeitor.toLowerCase()) ||
    l.cpf?.includes(buscaLeitor)
  )

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Coluna do Formulário */}
      <div className="lg:col-span-3 space-y-6">
        <div className="scroll-card px-8 py-8">
          <div className="text-center mb-6">
            <h2 className="font-cinzel font-bold text-ink-dark text-xl">Nova Concessão</h2>
            <p className="font-garamond text-ink-light text-sm italic">Destinado exclusivamente a leitores registrados</p>
            <div className="ornament-divider mt-2" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Escolha do Leitor */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setModoLeitor('existente')}
                  className={`flex-1 py-2 font-cinzel text-xs border rounded transition-all ${modoLeitor === 'existente' ? 'bg-papyrus-dark border-gold' : 'opacity-50'}`}>
                  Leitor Existente
                </button>
                <button type="button" onClick={() => { setModoLeitor('novo'); setLeitorSelecionado(null) }}
                  className={`flex-1 py-2 font-cinzel text-xs border rounded transition-all ${modoLeitor === 'novo' ? 'bg-papyrus-dark border-gold' : 'opacity-50'}`}>
                  + Cadastrar Novo
                </button>
              </div>

              {modoLeitor === 'existente' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" size={14} />
                    <input type="text" placeholder="Buscar por Nome ou CPF..." 
                      value={buscaLeitor} onChange={e => setBuscaLeitor(e.target.value)}
                      className="input-papyrus w-full pl-9" />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {leitoresFiltrados.map(l => (
                      <button key={l.id} type="button" onClick={() => setLeitorSelecionado(l)}
                        className={`w-full text-left px-4 py-2 rounded font-garamond text-sm flex justify-between items-center border transition-all ${leitorSelecionado?.id === l.id ? 'bg-papyrus-mid border-gold' : 'bg-white/30 border-papyrus-border opacity-70'}`}>
                        <span>👤 {l.nome_completo}</span>
                        <span className="text-[10px] opacity-50">{l.cpf || 'Sem CPF'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded border border-gold/30 bg-gold/5 space-y-3">
                  <input type="text" placeholder="Nome Completo *" value={novoLeitor.nome_completo}
                    onChange={e => setNovoLeitor(n => ({...n, nome_completo: e.target.value}))}
                    className="input-papyrus w-full" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="CPF" value={novoLeitor.cpf}
                      onChange={e => setNovoLeitor(n => ({...n, cpf: e.target.value}))}
                      className="input-papyrus w-full" />
                    <input type="text" placeholder="Telefone" value={novoLeitor.telefone}
                      onChange={e => setNovoLeitor(n => ({...n, telefone: e.target.value}))}
                      className="input-papyrus w-full" />
                  </div>
                  <textarea placeholder="Endereço" value={novoLeitor.endereco}
                    onChange={e => setNovoLeitor(n => ({...n, endereco: e.target.value}))}
                    className="input-papyrus w-full resize-none" rows={2} />
                  {erroForm && <p className="text-red-alert text-xs">⚠ {erroForm}</p>}
                  <button type="button" onClick={cadastrarESelecionar} disabled={cadastrando}
                    className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2">
                    <Save size={12}/> {cadastrando ? 'Salvando...' : 'Salvar e Selecionar Leitor'}
                  </button>
                </div>
              )}
            </div>

            {/* Escolha do Livro (Busca Avançada) */}
            <div className="pt-4 border-t border-papyrus-border space-y-3">
              <label className="block font-cinzel text-xs uppercase tracking-widest text-ink-mid">
                Selecionar Pergaminho
              </label>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar pergaminho pelo título, autor ou ISBN..." 
                  value={buscaLivro}
                  onChange={e => setBuscaLivro(e.target.value)}
                  className="input-papyrus w-full pl-9"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {papirosFiltrados.length === 0 ? (
                  <p className="text-center py-4 font-garamond italic text-ink-light text-sm">Nenhum pergaminho disponível encontrado.</p>
                ) : (
                  papirosFiltrados.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPapiroId(p.id)}
                      className={`w-full text-left p-3 rounded border transition-all flex items-center gap-3 ${
                        papiroId === p.id 
                        ? 'bg-papyrus-dark border-gold ring-1 ring-gold shadow-md' 
                        : 'bg-white/30 border-papyrus-border hover:bg-white/50'
                      }`}
                    >
                      <div className="w-10 h-14 bg-papyrus-mid rounded overflow-hidden flex-shrink-0 border border-gold/10">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-30 text-xl">📜</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-cinzel font-bold text-xs truncate text-ink-dark">{p.titulo}</p>
                        <p className="font-garamond text-[10px] italic text-ink-mid truncate">{p.autor}</p>
                        <p className="text-[9px] text-ink-light font-mono mt-1 uppercase">{p.genero}</p>
                      </div>
                      {papiroId === p.id && <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Prazo */}
            <div>
              <label className="block font-cinzel text-xs mb-2">Prazo: {diasEmprestimo} dias</label>
              <input type="range" min={7} max={60} step={7} value={diasEmprestimo}
                onChange={e => setDiasEmprestimo(Number(e.target.value))} className="w-full accent-gold" />
            </div>

            {erro && <p className="p-3 bg-red-50 text-red-alert text-xs rounded border border-red-200">{erro}</p>}

            <button type="submit" disabled={loading || !leitorSelecionado || !papiroId}
              className="btn-primary w-full py-3">
              {loading ? 'Processando...' : 'Formalizar Empréstimo'}
            </button>
          </form>
        </div>
      </div>

      {/* Coluna do Histórico */}
      <div className="lg:col-span-2 space-y-6">
        <div className="scroll-card px-6 py-6 h-full min-h-[400px]">
          <h3 className="font-cinzel font-bold text-ink-dark text-sm border-b border-gold/30 pb-3 flex items-center gap-2">
            <History size={16} className="text-gold" /> Detalhes do Leitor
          </h3>

          {!leitorSelecionado ? (
            <div className="flex flex-col items-center justify-center h-64 text-center opacity-40">
              <User size={48} className="mb-2" />
              <p className="font-garamond italic text-sm">Selecione um leitor para ver o histórico</p>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {/* Info Básica */}
              <div className="space-y-1">
                <p className="font-cinzel text-xs text-ink-mid uppercase tracking-widest">Informações</p>
                <p className="font-garamond text-sm"><strong>CPF:</strong> {leitorSelecionado.cpf || 'Não informado'}</p>
                <p className="font-garamond text-sm"><strong>Tel:</strong> {leitorSelecionado.telefone || 'Não informado'}</p>
              </div>

              {/* Lista do Histórico */}
              <div className="space-y-3">
                <p className="font-cinzel text-xs text-ink-mid uppercase tracking-widest">Últimos Empréstimos</p>
                {historico.length === 0 ? (
                  <p className="font-garamond text-xs italic text-ink-light">Nenhum registro anterior.</p>
                ) : (
                  <div className="space-y-2">
                    {historico.map(h => (
                      <div key={h.id} className="p-2 rounded bg-white/40 border border-papyrus-border flex justify-between items-center group">
                        <div className="overflow-hidden">
                          <p className="font-cinzel text-[11px] text-ink-dark truncate">{h.papiros?.titulo}</p>
                          <p className="font-garamond text-[10px] text-ink-light">Em: {new Date(h.data_retirada).toLocaleDateString()}</p>
                        </div>
                        {h.devolvido ? (
                          <CheckCircle size={14} className="text-green-ok shrink-0" />
                        ) : (
                          <Clock size={14} className="text-gold shrink-0 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerta de Pendência */}
              {historico.some(h => !h.devolvido) && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded flex items-start gap-2">
                  <AlertTriangle size={14} className="text-purple-royal mt-0.5" />
                  <p className="text-[11px] text-purple-royal font-garamond italic">
                    Este leitor possui livros pendentes de devolução.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
