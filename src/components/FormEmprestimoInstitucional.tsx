'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  Building2, Plus, X, Save, ChevronDown, ChevronUp,
  BookOpen, Search, CheckSquare, Square, History,
  Calendar, Phone, User, Trash2, Clock, CheckCircle, AlertTriangle
} from 'lucide-react'

/* Entidades */
interface Papiro {
  id: string
  titulo: string
  autor: string
  genero: string
  status: string
}

interface Instituicao {
  id: string
  nome: string
  responsavel: string | null
  telefone: string | null
  endereco: string | null
}

/* Icons */
const GENRE_ICONS: Record<string, string> = {
  'Filosofia': '🧠', 'Epopeia': '⚔️', 'Matemática': '📐',
  'Astronomia': '🌟', 'Poesia': '🎭', 'Estratégia': '🗺️',
  'História': '📖', 'Medicina': '⚕️', 'Retórica': '🗣️',
  'Teatro': '🎪', 'Ciências Naturais': '🌿',
}

const EMPTY_INST = { nome: '', responsavel: '', telefone: '', endereco: '' }

export default function FormEmprestimoInstitucional() {
  const [papiros, setPapiros] = useState<Papiro[]>([])
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([])
  const [buscaPapiro, setBuscaPapiro] = useState('')
  const [buscaInst, setBuscaInst] = useState('')
  
  const [modoInst, setModoInst] = useState<'existente' | 'novo'>('existente')
  const [instSelecionada, setInstSelecionada] = useState<Instituicao | null>(null)
  const [novaInst, setNovaInst] = useState(EMPTY_INST)
  
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  
  const [loading, setLoading] = useState(false)
  const [dataDevolucao, setDataDevolucao] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  
  // Renovação
  const [confirmandoRenovacao, setConfirmandoRenovacao] = useState<any | null>(null)
  const [diasRenovacao, setDiasRenovacao] = useState(14)
  const [renovando, setRenovando] = useState(false)

  useEffect(() => {
    fetchDados()
  }, [])

  async function fetchDados() {
    const [{ data: paps }, { data: insts }] = await Promise.all([
      supabase.from('papiros').select('*').order('titulo'),
      supabase.from('instituicoes').select('*').order('nome')
    ])
    setPapiros(paps || [])
    setInstituicoes(insts || [])
  }

  async function fetchHistorico() {
    if (!instSelecionada) return
    const { data } = await supabase
      .from('emprestimos_institucionais')
      .select('*')
      .eq('nome_instituicao', instSelecionada.nome)
      .order('created_at', { ascending: false })
      .limit(10)
    setHistorico(data || [])
  }

  useEffect(() => {
    if (instSelecionada) fetchHistorico()
  }, [instSelecionada])

  const instsFiltradas = instituicoes.filter(i => 
    i.nome.toLowerCase().includes(buscaInst.toLowerCase())
  )

  const papirosFiltrados = papiros.filter(p =>
    p.titulo.toLowerCase().includes(buscaPapiro.toLowerCase()) ||
    p.autor.toLowerCase().includes(buscaPapiro.toLowerCase())
  )

  async function cadastrarInstituicao() {
    if (!novaInst.nome) return
    const { data, error } = await supabase.from('instituicoes').insert([novaInst]).select().single()
    if (!error && data) {
      await fetchDados()
      setInstSelecionada(data)
      setModoInst('existente')
      setNovaInst(EMPTY_INST)
    }
  }

  async function registrarEmprestimo() {
    if (!instSelecionada || selecionados.length === 0 || !dataDevolucao) {
      setErro('Preencha os campos e selecione os pergaminhos.')
      return
    }
    setLoading(true)
    const { data: emp, error } = await supabase.from('emprestimos_institucionais').insert({
      nome_instituicao: instSelecionada.nome,
      responsavel: instSelecionada.responsavel,
      telefone: instSelecionada.telefone,
      quantidade_livros: selecionados.length,
      data_retirada: new Date().toISOString(),
      data_devolucao_prevista: new Date(dataDevolucao).toISOString(),
      devolvido: false
    }).select().single()

    if (!error && emp) {
      const links = selecionados.map(pid => ({ emprestimo_id: emp.id, papiro_id: pid }))
      await supabase.from('emprestimo_institucional_papiros').insert(links)
      setSucesso('Empréstimo registrado!')
      setSelecionados([]); setDataDevolucao(''); await fetchHistorico()
      setTimeout(() => setSucesso(''), 3000)
    }
    setLoading(false)
  }

  async function marcarDevolvido(id: string) {
    if (!confirm('Confirmar devolução institucional?')) return
    await supabase.from('emprestimos_institucionais').update({ devolvido: true }).eq('id', id)
    await fetchHistorico()
  }

  async function confirmarRenovacao() {
    if (!confirmandoRenovacao) return
    setRenovando(true)
    const novaData = new Date(confirmandoRenovacao.data_devolucao_prevista)
    novaData.setDate(novaData.getDate() + diasRenovacao)
    await supabase.from('emprestimos_institucionais').update({ data_devolucao_prevista: novaData.toISOString() }).eq('id', confirmandoRenovacao.id)
    await fetchHistorico()
    setConfirmandoRenovacao(null); setRenovando(false)
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <div className="scroll-card px-8 py-8">
          <div className="text-center mb-6">
            <h2 className="font-cinzel font-bold text-ink-dark text-xl">Concessão entre Instituições</h2>
            <div className="ornament-divider mt-2" />
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setModoInst('existente')} className={`flex-1 py-2 font-cinzel text-[10px] rounded border transition-all ${modoInst === 'existente' ? 'bg-papyrus-dark border-gold' : 'opacity-50'}`}>🏛️ Existente</button>
                <button onClick={() => setModoInst('novo')} className={`flex-1 py-2 font-cinzel text-[10px] rounded border transition-all ${modoInst === 'novo' ? 'bg-papyrus-dark border-gold' : 'opacity-50'}`}>+ Nova Instituição</button>
              </div>

              {modoInst === 'existente' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" size={14} />
                    <input type="text" placeholder="Buscar instituição..." value={buscaInst} onChange={e => setBuscaInst(e.target.value)} className="input-papyrus w-full pl-9" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {instsFiltradas.map(i => (
                      <button key={i.id} onClick={() => setInstSelecionada(i)} className={`text-left p-3 rounded border text-xs font-cinzel transition-all ${instSelecionada?.id === i.id ? 'bg-papyrus-mid border-gold' : 'bg-white/30 border-papyrus-border opacity-70'}`}>
                        🏛️ {i.nome}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded border border-gold/20 bg-gold/5 grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Nome *" className="input-papyrus col-span-2" value={novaInst.nome} onChange={e => setNovaInst({...novaInst, nome: e.target.value})} />
                  <input type="text" placeholder="Responsável" className="input-papyrus" value={novaInst.responsavel || ''} onChange={e => setNovaInst({...novaInst, responsavel: e.target.value})} />
                  <input type="text" placeholder="Telefone" className="input-papyrus" value={novaInst.telefone || ''} onChange={e => setNovaInst({...novaInst, telefone: e.target.value})} />
                  <button onClick={cadastrarInstituicao} className="btn-primary col-span-2 text-[10px] py-2">Salvar Instituição</button>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-papyrus-border">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" size={14} />
                <input type="text" placeholder="Buscar pergaminho..." value={buscaPapiro} onChange={e => setBuscaPapiro(e.target.value)} className="input-papyrus w-full pl-9" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {papirosFiltrados.map(p => {
                  const sel = selecionados.includes(p.id); const indisponivel = p.status !== 'disponivel'
                  return (
                    <button key={p.id} disabled={indisponivel && !sel} onClick={() => setSelecionados(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])}
                      className={`flex items-center gap-3 p-2 rounded border text-left transition-all ${sel ? 'bg-papyrus-dark border-gold' : 'bg-white/20 border-papyrus-border opacity-60'} ${indisponivel && !sel ? 'opacity-20 cursor-not-allowed' : ''}`}>
                      <div className="w-8 h-10 flex items-center justify-center bg-papyrus-mid rounded border border-gold/10 text-xl">{GENRE_ICONS[p.genero] || '📜'}</div>
                      <div className="min-w-0"><p className="font-cinzel text-[10px] font-bold truncate">{p.titulo}</p></div>
                      {sel && <CheckSquare size={14} className="ml-auto text-gold" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="date" className="input-papyrus w-full" value={dataDevolucao} onChange={e => setDataDevolucao(e.target.value)} />
              <button onClick={registrarEmprestimo} disabled={loading || !instSelecionada} className="btn-primary w-full py-3 text-xs">{loading ? '...' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="scroll-card px-6 py-6 h-full min-h-[500px]">
          <h3 className="font-cinzel font-bold text-sm border-b border-gold/30 pb-3 flex items-center gap-2"><History size={16} className="text-gold" /> Prontuário</h3>
          {instSelecionada && (
            <div className="mt-6 space-y-6">
              <div className="p-3 bg-papyrus-dark/20 rounded border border-gold/10 text-xs font-garamond"><p className="font-cinzel text-gold text-sm mb-1">{instSelecionada.nome}</p></div>
              <div className="space-y-2">
                {historico.map(h => (
                  <div key={h.id} className="p-3 rounded bg-white/30 border border-papyrus-border flex justify-between items-center text-[10px]">
                    <div><p className="font-cinzel">{h.quantidade_livros} livros</p><p className="opacity-60">{new Date(h.data_retirada).toLocaleDateString()}</p></div>
                    <div className="flex gap-1">
                      {!h.devolvido && <button onClick={() => setConfirmandoRenovacao(h)} className="p-1 hover:text-gold"><History size={12}/></button>}
                      {!h.devolvido ? <button onClick={() => marcarDevolvido(h.id)} className="p-1 hover:text-green-ok"><CheckCircle size={12}/></button> : <CheckCircle size={12} className="text-green-ok"/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {confirmandoRenovacao && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmandoRenovacao(null)}>
            <div className="scroll-card p-8 max-w-sm w-full space-y-4 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="font-cinzel font-bold">Renovar Prazo</h3>
              <input type="range" min={7} max={60} step={7} value={diasRenovacao} onChange={e => setDiasRenovacao(Number(e.target.value))} className="w-full accent-gold" />
              <p className="font-cinzel text-[10px]">Mais {diasRenovacao} dias</p>
              <div className="flex gap-2"><button onClick={confirmarRenovacao} className="btn-primary flex-1 py-2">Firma</button><button onClick={() => setConfirmandoRenovacao(null)} className="flex-1 py-2 border border-papyrus-border">Voltar</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
