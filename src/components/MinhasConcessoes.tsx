'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { CheckCircle, Clock, BookOpen, RotateCcw, X } from 'lucide-react'

interface Concessao {
  id: string
  data_retirada: string
  data_devolucao_prevista: string
  devolvido: boolean
  papiros: { titulo: string; autor: string; genero: string } | null
}

interface MinhasConcessoesProps {
  userId: string
  isAdmin: boolean
}

export default function MinhasConcessoes({ userId, isAdmin }: MinhasConcessoesProps) {
  const [ativas, setAtivas] = useState<Concessao[]>([])
  const [historico, setHistorico] = useState<Concessao[]>([])
  const [loading, setLoading] = useState(true)

  // Modais
  const [confirmandoDevolucao, setConfirmandoDevolucao] = useState<Concessao | null>(null)
  const [confirmandoRenovacao, setConfirmandoRenovacao] = useState<Concessao | null>(null)
  const [diasRenovacao, setDiasRenovacao] = useState(14)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    fetchConcessoes()
    const channel = supabase
      .channel('minhas-concessoes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'concessoes' }, fetchConcessoes)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function fetchConcessoes() {
    setLoading(true)
    const { data } = await supabase
      .from('concessoes')
      .select('id, data_retirada, data_devolucao_prevista, devolvido, papiros (titulo, autor, genero)')
      .eq('estudioso_id', userId)
      .order('data_retirada', { ascending: false })

    if (data) {
      setAtivas((data as unknown as Concessao[]).filter(c => !c.devolvido))
      setHistorico((data as unknown as Concessao[]).filter(c => c.devolvido))
    }
    setLoading(false)
  }

  async function confirmarDevolucao() {
    if (!confirmandoDevolucao) return
    setProcessando(true)
    await supabase.from('concessoes').update({ devolvido: true }).eq('id', confirmandoDevolucao.id)
    setConfirmandoDevolucao(null)
    setProcessando(false)
    fetchConcessoes()
  }

  async function confirmarRenovacao() {
    if (!confirmandoRenovacao) return
    setProcessando(true)

    const base = new Date(confirmandoRenovacao.data_devolucao_prevista)
    const ref = base > new Date() ? base : new Date()
    ref.setDate(ref.getDate() + diasRenovacao)

    await supabase.from('concessoes')
      .update({ data_devolucao_prevista: ref.toISOString() })
      .eq('id', confirmandoRenovacao.id)

    setConfirmandoRenovacao(null)
    setDiasRenovacao(14)
    setProcessando(false)
    fetchConcessoes()
  }

  const isAtrasado = (data: string) => new Date(data) < new Date()

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3 animate-bounce">📖</div>
        <p className="font-cinzel text-ink-mid text-sm tracking-widest">Carregando seus pergaminhos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Empréstimos ativos */}
      <div>
        <h3 className="font-cinzel font-bold text-ink-dark text-base uppercase tracking-widest mb-4 flex items-center gap-2">
          <BookOpen size={16} /> Pergaminhos em Mãos ({ativas.length})
        </h3>

        {ativas.length === 0 ? (
          <div className="scroll-card px-6 py-8 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="font-garamond text-ink-light italic">Você não possui pergaminhos retirados.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ativas.map(c => {
              const atrasado = isAtrasado(c.data_devolucao_prevista)
              return (
                <div key={c.id}
                  className={`scroll-card px-5 py-4 ${atrasado ? 'alert-atrasado' : ''}`}
                  style={atrasado ? { borderColor: 'var(--purple-royal)' } : {}}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-cinzel font-semibold text-ink-dark text-sm">
                        📜 {c.papiros?.titulo}
                      </p>
                      <p className="font-garamond text-ink-mid text-sm italic">
                        {c.papiros?.autor} — {c.papiros?.genero}
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1 text-xs font-garamond text-ink-light">
                          <Clock size={10} />
                          Retirada: {new Date(c.data_retirada).toLocaleDateString('pt-BR')}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-garamond font-semibold ${atrasado ? 'text-red-alert' : 'text-green-ok'}`}>
                          {atrasado ? '⚠ ATRASADO' : '✓'} Devolução: {new Date(c.data_devolucao_prevista).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--papyrus-border)' }}>
                    {/* Renovar — apenas admin pode ou se não estiver atrasado */}
                    {(isAdmin || !atrasado) && (
                      <button
                        onClick={() => { setConfirmandoRenovacao(c); setDiasRenovacao(14) }}
                        className="flex items-center gap-1 text-xs font-cinzel px-3 py-1.5 rounded flex-1 justify-center transition-all"
                        style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--ink-dark)', border: '1px solid var(--gold)' }}
                      >
                        <RotateCcw size={11} /> Renovar
                      </button>
                    )}

                    {/* Confirmar devolução */}
                    <button
                      onClick={() => setConfirmandoDevolucao(c)}
                      className="flex items-center gap-1 text-xs font-cinzel px-3 py-1.5 rounded flex-1 justify-center transition-all"
                      style={{ background: 'rgba(45,90,27,0.15)', color: '#2D5A1B', border: '1px solid #2D5A1B' }}
                    >
                      <CheckCircle size={11} /> Confirmar Devolução
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div>
          <h3 className="font-cinzel font-bold text-ink-mid text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckCircle size={14} /> Histórico de Leituras ({historico.length})
          </h3>
          <div className="space-y-2">
            {historico.map(c => (
              <div key={c.id} className="scroll-card px-5 py-3 opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-cinzel text-ink-mid text-sm">📜 {c.papiros?.titulo}</span>
                    <span className="font-garamond text-ink-light text-sm italic"> — {c.papiros?.autor}</span>
                  </div>
                  <span className="text-xs font-garamond text-green-ok flex items-center gap-1">
                    <CheckCircle size={10} />
                    Devolvido em {new Date(c.data_devolucao_prevista).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Confirmar Devolução */}
      {confirmandoDevolucao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(20,10,5,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setConfirmandoDevolucao(null)}>
          <div className="scroll-card px-8 py-7 max-w-sm w-full space-y-5 relative"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setConfirmandoDevolucao(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-papyrus-mid">
              <X size={16} className="text-ink-mid" />
            </button>

            <div className="text-center">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="font-cinzel font-bold text-ink-dark text-lg">Confirmar Devolução</h3>
              <p className="font-garamond text-ink-light text-sm italic mt-1">
                Você está devolvendo este pergaminho?
              </p>
            </div>

            <div className="scroll-card px-4 py-3" style={{ background: 'rgba(201,168,76,0.08)' }}>
              <p className="font-cinzel font-semibold text-ink-dark text-sm">
                📜 {confirmandoDevolucao.papiros?.titulo}
              </p>
              <p className="font-garamond text-ink-mid text-sm italic">{confirmandoDevolucao.papiros?.autor}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={confirmarDevolucao} disabled={processando}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle size={14} />
                {processando ? 'Processando...' : 'Confirmar'}
              </button>
              <button onClick={() => setConfirmandoDevolucao(null)}
                className="flex-1 text-xs font-cinzel px-4 py-2 rounded"
                style={{ border: '1px solid var(--papyrus-border)', color: 'var(--ink-mid)', background: 'transparent' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Renovar */}
      {confirmandoRenovacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(20,10,5,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={() => setConfirmandoRenovacao(null)}>
          <div className="scroll-card px-8 py-7 max-w-sm w-full space-y-5 relative"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setConfirmandoRenovacao(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-papyrus-mid">
              <X size={16} className="text-ink-mid" />
            </button>

            <div className="text-center">
              <div className="text-4xl mb-2">🔄</div>
              <h3 className="font-cinzel font-bold text-ink-dark text-lg">Renovar Empréstimo</h3>
              <p className="font-garamond text-ink-light text-sm italic mt-1">Estender o prazo de devolução</p>
            </div>

            <div className="scroll-card px-4 py-3" style={{ background: 'rgba(201,168,76,0.08)' }}>
              <p className="font-cinzel font-semibold text-ink-dark text-sm">
                📜 {confirmandoRenovacao.papiros?.titulo}
              </p>
              <p className="font-garamond text-ink-light text-xs mt-1">
                Vencimento atual: {new Date(confirmandoRenovacao.data_devolucao_prevista).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div>
              <label className="block font-cinzel text-xs uppercase tracking-widest text-ink-mid mb-2">
                Adicionar: <span className="text-gold font-bold">{diasRenovacao} dias</span>
              </label>
              <input type="range" min={7} max={60} step={7}
                value={diasRenovacao}
                onChange={e => setDiasRenovacao(Number(e.target.value))}
                className="w-full accent-gold" />
              <div className="flex justify-between font-garamond text-ink-light text-xs mt-1">
                <span>7 dias</span>
                <span className="font-semibold text-ink-mid">
                  Novo vencimento: {(() => {
                    const base = new Date(confirmandoRenovacao.data_devolucao_prevista)
                    const ref = base > new Date() ? base : new Date()
                    ref.setDate(ref.getDate() + diasRenovacao)
                    return ref.toLocaleDateString('pt-BR')
                  })()}
                </span>
                <span>60 dias</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={confirmarRenovacao} disabled={processando}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <RotateCcw size={14} />
                {processando ? 'Renovando...' : 'Renovar'}
              </button>
              <button onClick={() => setConfirmandoRenovacao(null)}
                className="flex-1 text-xs font-cinzel px-4 py-2 rounded"
                style={{ border: '1px solid var(--papyrus-border)', color: 'var(--ink-mid)', background: 'transparent' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
