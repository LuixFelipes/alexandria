'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AlertTriangle, Clock, CheckCircle, RefreshCw } from 'lucide-react'

interface Concessao {
  id: string
  data_retirada: string
  data_devolucao_prevista: string
  devolvido: boolean
  papiros: { titulo: string; autor: string; genero: string } | null
  estudiosos: { nome_completo: string; vinculo: string } | null
}

export default function PainelNotificacoes() {
  const [atrasados, setAtrasados] = useState<Concessao[]>([])
  const [vencendoHoje, setVencendoHoje] = useState<Concessao[]>([])
  const [loading, setLoading] = useState(true)
  const [rodarVerificacao, setRodarVerificacao] = useState(false)

  useEffect(() => {
    fetchAtrasos()
  }, [])

  async function fetchAtrasos() {
    setLoading(true)
    const agora = new Date().toISOString()
    const amanha = new Date(Date.now() + 86400000).toISOString()

    // Já atrasados
    const { data: atrasadosData } = await supabase
      .from('concessoes')
      .select(`
        id, data_retirada, data_devolucao_prevista, devolvido,
        papiros (titulo, autor, genero),
        estudiosos (nome_completo, vinculo)
      `)
      .eq('devolvido', false)
      .lt('data_devolucao_prevista', agora)
      .order('data_devolucao_prevista')

    // Vencendo amanhã
    const { data: hojeData } = await supabase
      .from('concessoes')
      .select(`
        id, data_retirada, data_devolucao_prevista, devolvido,
        papiros (titulo, autor, genero),
        estudiosos (nome_completo, vinculo)
      `)
      .eq('devolvido', false)
      .gte('data_devolucao_prevista', agora)
      .lte('data_devolucao_prevista', amanha)
      .order('data_devolucao_prevista')

    setAtrasados((atrasadosData as unknown as Concessao[]) || [])
    setVencendoHoje((hojeData as unknown as Concessao[]) || [])
    setLoading(false)
  }

  async function triggerVerificacao() {
    setRodarVerificacao(true)
    await supabase.rpc('verificar_atrasos')
    await fetchAtrasos()
    setRodarVerificacao(false)
  }

  async function marcarDevolvido(id: string) {
    await supabase.from('concessoes').update({ devolvido: true }).eq('id', id)
    fetchAtrasos()
  }

  const diasAtraso = (data: string) => {
    const diff = new Date().getTime() - new Date(data).getTime()
    return Math.floor(diff / 86400000)
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3 animate-pulse">🔔</div>
        <p className="font-cinzel text-ink-mid text-sm tracking-widest">Consultando mensageiros...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header do Sistema Nuntii */}
      <div className="scroll-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏺</span>
            <div>
              <h2 className="font-cinzel font-bold text-ink-dark text-lg">Sistema Nuntii</h2>
              <p className="font-garamond text-ink-light text-sm italic">
                Os Mensageiros vigiam os pergaminhos em atraso
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-cinzel text-red-alert font-bold text-2xl">{atrasados.length}</div>
              <div className="font-garamond text-ink-light text-xs">em atraso</div>
            </div>
            <button
              onClick={triggerVerificacao}
              disabled={rodarVerificacao}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              <RefreshCw size={14} className={rodarVerificacao ? 'animate-spin' : ''} />
              Verificar Agora
            </button>
          </div>
        </div>
      </div>

      {/* Seção de atrasados */}
      {atrasados.length > 0 && (
        <div>
          <h3 className="font-cinzel font-bold text-red-alert text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={14} />
            Devoluções em Atraso ({atrasados.length})
          </h3>
          <div className="space-y-3">
            {atrasados.map(c => (
              <div
                key={c.id}
                className="scroll-card px-5 py-4 alert-atrasado"
                style={{ borderColor: 'var(--purple-royal)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-pendente text-xs font-cinzel px-2 py-0.5 rounded">
                        {diasAtraso(c.data_devolucao_prevista)} dia(s) em atraso
                      </span>
                    </div>
                    <p className="font-cinzel font-semibold text-ink-dark text-sm">
                      📜 {c.papiros?.titulo}
                      <span className="font-normal text-ink-light"> — {c.papiros?.autor}</span>
                    </p>
                    <p className="font-garamond text-ink-mid text-sm">
                      👤 {c.estudiosos?.nome_completo}
                      <span className="text-ink-light italic"> ({c.estudiosos?.vinculo})</span>
                    </p>
                    <div className="flex gap-4 mt-1 text-xs font-garamond text-ink-light">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        Retirada: {new Date(c.data_retirada).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-red-alert font-semibold">
                        Prevista: {new Date(c.data_devolucao_prevista).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => marcarDevolvido(c.id)}
                    className="flex items-center gap-1 text-xs font-cinzel px-3 py-2 rounded"
                    style={{ background: 'rgba(45,90,27,0.15)', color: '#2D5A1B', border: '1px solid #2D5A1B' }}
                  >
                    <CheckCircle size={12} />
                    Devolvido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vencendo hoje/amanhã */}
      {vencendoHoje.length > 0 && (
        <div>
          <h3 className="font-cinzel font-bold text-gold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock size={14} />
            Vencem nas Próximas 24h ({vencendoHoje.length})
          </h3>
          <div className="space-y-3">
            {vencendoHoje.map(c => (
              <div key={c.id} className="scroll-card px-5 py-4"
                style={{ borderColor: '#C9A84C' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-cinzel font-semibold text-ink-dark text-sm">
                      📜 {c.papiros?.titulo}
                    </p>
                    <p className="font-garamond text-ink-mid text-sm">
                      👤 {c.estudiosos?.nome_completo}
                    </p>
                    <p className="text-xs font-garamond text-gold mt-1">
                      ⏰ Devolução: {new Date(c.data_devolucao_prevista).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => marcarDevolvido(c.id)}
                    className="flex items-center gap-1 text-xs font-cinzel px-3 py-2 rounded"
                    style={{ background: 'rgba(45,90,27,0.15)', color: '#2D5A1B', border: '1px solid #2D5A1B' }}
                  >
                    <CheckCircle size={12} />
                    Devolvido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado ideal */}
      {atrasados.length === 0 && vencendoHoje.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🕊️</div>
          <h3 className="font-cinzel font-bold text-green-ok text-xl mb-2">
            Todos os pergaminhos em dia!
          </h3>
          <p className="font-garamond text-ink-light italic">
            Os mensageiros descansam. Nenhuma devolução atrasada.
          </p>
        </div>
      )}
    </div>
  )
}
