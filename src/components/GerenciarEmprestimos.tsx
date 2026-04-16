'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Search, CheckCircle, Clock, Users, RotateCcw, X, UserCheck, History } from 'lucide-react'

interface LeitorExterno {
  id: string
  nome_completo: string
  cpf: string | null
  telefone: string | null
}

interface EmprestimoAtivo {
  id: string
  data_retirada: string
  data_devolucao_prevista: string
  devolvido: boolean
  estudioso_id: string | null
  leitor_externo_id: string | null
  papiros: { id: string; titulo: string; autor: string; genero: string } | null
  estudiosos: { id: string; nome_completo: string; vinculo: string; status_pendencia: boolean } | null
  leitores_externos: LeitorExterno | null
}

function nomeLeitor(c: EmprestimoAtivo): string {
  return c.leitores_externos?.nome_completo ?? c.estudiosos?.nome_completo ?? '—'
}

function vinculoLeitor(c: EmprestimoAtivo): string {
  if (c.leitores_externos) return 'Leitor Externo'
  if (c.estudiosos) return c.estudiosos.vinculo
  return ''
}

export default function GerenciarEmprestimos() {
  const [emprestimos, setEmprestimos] = useState<EmprestimoAtivo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'ativos' | 'atrasados' | 'todos'>('ativos')
  const [buscaLeitor, setBuscaLeitor] = useState('')

  const [confirmandoDevolucao, setConfirmandoDevolucao] = useState<EmprestimoAtivo | null>(null)
  const [devolvendo, setDevolvendo] = useState<string | null>(null)
  const [renovando, setRenovando] = useState<string | null>(null)
  const [diasRenovacao, setDiasRenovacao] = useState(14)
  const [confirmandoRenovacao, setConfirmandoRenovacao] = useState<EmprestimoAtivo | null>(null)
  const [leitorHistorico, setLeitorHistorico] = useState<{ leitor: any; concessoes: any[] } | null>(null)

  const fetchEmprestimos = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('concessoes')
      .select(`
        id, data_retirada, data_devolucao_prevista, devolvido,
        estudioso_id, leitor_externo_id,
        papiros (id, titulo, autor, genero),
        estudiosos (id, nome_completo, vinculo, status_pendencia),
        leitores_externos (id, nome_completo, cpf, telefone)
      `)
      .order('data_retirada', { ascending: false })

    if (filtro === 'ativos') query = query.eq('devolvido', false)
    else if (filtro === 'atrasados') {
      query = query.eq('devolvido', false).lt('data_devolucao_prevista', new Date().toISOString())
    }

    const { data, error } = await query
    if (!error) setEmprestimos((data as unknown as EmprestimoAtivo[]) || [])
    setLoading(false)
  }, [filtro])

  useEffect(() => { fetchEmprestimos() }, [fetchEmprestimos])

  useEffect(() => {
    const channel = supabase.channel('gerenciar-emprestimos-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'concessoes' }, () => fetchEmprestimos()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchEmprestimos])

  async function confirmarDevolucao() {
    if (!confirmandoDevolucao) return
    setDevolvendo(confirmandoDevolucao.id)
    await supabase.from('concessoes').update({ devolvido: true }).eq('id', confirmandoDevolucao.id)
    setConfirmandoDevolucao(null)
    setDevolvendo(null)
    fetchEmprestimos()
  }

  async function confirmarRenovacao() {
    if (!confirmandoRenovacao) return
    setRenovando(confirmandoRenovacao.id)
    const novaData = new Date(confirmandoRenovacao.data_devolucao_prevista)
    const base = novaData > new Date() ? novaData : new Date()
    base.setDate(base.getDate() + diasRenovacao)
    await supabase.from('concessoes').update({ data_devolucao_prevista: base.toISOString() }).eq('id', confirmandoRenovacao.id)
    setConfirmandoRenovacao(null)
    setRenovando(null)
    fetchEmprestimos()
  }

  async function verHistorico(leitorId: string, nome: string) {
    const { data } = await supabase.from('concessoes').select('id, data_retirada, data_devolucao_prevista, devolvido, papiros(titulo, autor)').eq('leitor_externo_id', leitorId).order('data_retirada', { ascending: false })
    setLeitorHistorico({ leitor: { nome_completo: nome }, concessoes: data || [] })
  }

  const isAtrasado = (data: string) => !devolvendo && new Date(data) < new Date()
  const filteredEmprestimos = emprestimos.filter(c => nomeLeitor(c).toLowerCase().includes(buscaLeitor.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Barra de Busca e Filtros */}
      <div className="scroll-card px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
          <input type="text" placeholder="Buscar por nome do leitor..." value={buscaLeitor} onChange={e => setBuscaLeitor(e.target.value)} className="input-papyrus w-full pl-9" />
        </div>
        <div className="flex gap-2">
          {(['ativos', 'atrasados', 'todos'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} className={`text-xs font-cinzel px-3 py-1.5 rounded border transition-all ${filtro === f ? 'bg-papyrus-dark border-gold text-gold' : 'border-papyrus-border opacity-70'}`}>
              {f === 'ativos' ? 'Ativos' : f === 'atrasados' ? 'Atrasados' : 'Todos'}
            </button>
          ))}
        </div>
        <button onClick={fetchEmprestimos} className="ml-auto text-ink-light hover:text-gold transition-colors"><RotateCcw size={16} /></button>
      </div>

      {/* Lista de Empréstimos */}
      <div className="space-y-3">
        {loading ? (
           <div className="text-center py-10 opacity-50 font-cinzel text-sm">Consultando arquivos...</div>
        ) : filteredEmprestimos.length === 0 ? (
           <div className="text-center py-10 opacity-50 font-garamond italic">Nenhum registro encontrado.</div>
        ) : filteredEmprestimos.map(c => {
          const atrasado = !c.devolvido && isAtrasado(c.data_devolucao_prevista)
          return (
            <div key={c.id} className={`scroll-card px-5 py-4 transition-all ${atrasado ? 'border-red-alert/50 bg-red-alert/5' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[250px] grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase text-ink-light font-cinzel mb-1">Pergaminho</p>
                    <p className="font-cinzel font-bold text-ink-dark text-sm leading-tight">{c.papiros?.titulo}</p>
                    <p className="font-garamond text-xs italic opacity-70">{c.papiros?.autor}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-ink-light font-cinzel mb-1">Leitor</p>
                    <button onClick={() => c.leitor_externo_id && verHistorico(c.leitor_externo_id, nomeLeitor(c))}
                      className="font-cinzel font-bold text-gold hover:underline text-sm flex items-center gap-1">
                      <UserCheck size={12}/> {nomeLeitor(c)}
                    </button>
                    <p className="text-[10px] opacity-60">{vinculoLeitor(c)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                   <div className="text-center">
                      <p className="text-[10px] opacity-50">Prazo</p>
                      <p className={`font-mono ${atrasado ? 'text-red-alert font-bold' : ''}`}>
                        {new Date(c.data_devolucao_prevista).toLocaleDateString()}
                      </p>
                   </div>
                   <div className="flex gap-2">
                     {!c.devolvido ? (
                       <>
                         <button onClick={() => setConfirmandoRenovacao(c)} className="p-2 rounded border border-gold/30 text-gold hover:bg-gold/10 transition-colors" title="Renovar"><RotateCcw size={14}/></button>
                         <button onClick={() => setConfirmandoDevolucao(c)} className="px-3 py-1.5 rounded bg-green-ok/10 text-green-ok border border-green-ok/30 hover:bg-green-ok/20 transition-all font-cinzel text-[10px]" >Devolver</button>
                       </>
                     ) : (
                       <span className="text-green-ok font-cinzel text-[10px] flex items-center gap-1"><CheckCircle size={12}/> Devolvido</span>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Histórico */}
      {leitorHistorico && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setLeitorHistorico(null)}>
          <div className="scroll-card w-full max-w-2xl px-8 py-8 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLeitorHistorico(null)} className="absolute top-4 right-4 text-ink-light"><X size={20}/></button>
            <div className="text-center mb-6">
              <History size={32} className="mx-auto text-gold mb-2"/>
              <h3 className="font-cinzel text-xl font-bold">Resumo do Leitor</h3>
              <p className="font-garamond text-gold italic">{leitorHistorico.leitor.nome_completo}</p>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {leitorHistorico.concessoes.map(h => (
                <div key={h.id} className="p-3 bg-white/40 border border-papyrus-border rounded flex justify-between items-center group">
                  <div>
                    <p className="font-cinzel text-sm text-ink-dark">{h.papiros?.titulo}</p>
                    <p className="text-[10px] opacity-60">Retirado em {new Date(h.data_retirada).toLocaleDateString()}</p>
                  </div>
                  {h.devolvido ? <CheckCircle size={14} className="text-green-ok"/> : <Clock size={14} className="text-gold animate-pulse"/>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Devolução */}
      {confirmandoDevolucao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmandoDevolucao(null)}>
          <div className="scroll-card px-8 py-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-cinzel font-bold text-center">Confirmar Devolução?</h3>
            <p className="font-garamond text-sm text-center italic">"{confirmandoDevolucao.papiros?.titulo}"</p>
            <div className="flex gap-3 pt-2">
              <button onClick={confirmarDevolucao} className="btn-primary flex-1 py-2">Confirmar</button>
              <button onClick={() => setConfirmandoDevolucao(null)} className="flex-1 py-2 border border-papyrus-border text-xs font-cinzel">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renovação */}
      {confirmandoRenovacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmandoRenovacao(null)}>
          <div className="scroll-card px-8 py-6 max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-cinzel font-bold text-center">Renovar Prazo</h3>
            <p className="font-garamond text-xs text-center">Adicionar {diasRenovacao} dias ao prazo atual.</p>
            <input type="range" min={7} max={30} step={7} value={diasRenovacao} onChange={e => setDiasRenovacao(Number(e.target.value))} className="w-full accent-gold" />
            <div className="flex gap-3 pt-2">
              <button onClick={confirmarRenovacao} className="btn-primary flex-1 py-2">Renovar</button>
              <button onClick={() => setConfirmandoRenovacao(null)} className="flex-1 py-2 border border-papyrus-border text-xs font-cinzel">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
