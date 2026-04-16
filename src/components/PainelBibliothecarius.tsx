'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Users, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react'

interface Stats {
  totalPapiros: number
  totalEstudiosos: number
  concessoesAtivas: number
  atrasadas: number
}

interface EstudiosoComPendencia {
  id: string
  nome_completo: string
  vinculo: string
  status_pendencia: boolean
  total_emprestimos: number
}

export default function PainelBibliothecarius() {
  const [stats, setStats] = useState<Stats>({ totalPapiros: 0, totalEstudiosos: 0, concessoesAtivas: 0, atrasadas: 0 })
  const [estudiososPendentes, setEstudiososPendentes] = useState<EstudiosoComPendencia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDados()
  }, [])

  async function fetchDados() {
    setLoading(true)

    const [papiros, estudiosos, ativas, atrasadas] = await Promise.all([
      supabase.from('papiros').select('id', { count: 'exact', head: true }),
      supabase.from('estudiosos').select('id', { count: 'exact', head: true }),
      supabase.from('concessoes').select('id', { count: 'exact', head: true }).eq('devolvido', false),
      supabase.from('concessoes').select('id', { count: 'exact', head: true })
        .eq('devolvido', false).lt('data_devolucao_prevista', new Date().toISOString()),
    ])

    setStats({
      totalPapiros: papiros.count ?? 0,
      totalEstudiosos: estudiosos.count ?? 0,
      concessoesAtivas: ativas.count ?? 0,
      atrasadas: atrasadas.count ?? 0,
    })

    // Estudiosos com pendência
    const { data: pendentes } = await supabase
      .from('estudiosos')
      .select('id, nome_completo, vinculo, status_pendencia')
      .eq('status_pendencia', true)

    setEstudiososPendentes((pendentes as unknown as EstudiosoComPendencia[]) || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3 animate-pulse">🏛️</div>
        <p className="font-cinzel text-ink-mid text-sm tracking-widest">Carregando painel...</p>
      </div>
    )
  }

  const ocupacao = stats.totalPapiros > 0
    ? Math.round((stats.concessoesAtivas / stats.totalPapiros) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Resumo de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Papiros', value: stats.totalPapiros, icon: <BookOpen size={20} />, color: 'text-ink-dark', bg: 'rgba(44,24,16,0.08)' },
          { label: 'Estudiosos', value: stats.totalEstudiosos, icon: <Users size={20} />, color: 'text-ink-mid', bg: 'rgba(92,61,46,0.08)' },
          { label: 'Emprestados', value: stats.concessoesAtivas, icon: <TrendingUp size={20} />, color: 'text-gold', bg: 'rgba(201,168,76,0.12)' },
          { label: 'Em Atraso', value: stats.atrasadas, icon: <AlertTriangle size={20} />, color: 'text-purple-royal', bg: 'rgba(107,45,139,0.12)' },
        ].map(s => (
          <div key={s.label} className="scroll-card px-5 py-5 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ background: s.bg }}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <div className={`font-cinzel font-bold text-3xl ${s.color}`}>{s.value}</div>
            <div className="font-garamond text-ink-light text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de ocupação */}
      <div className="scroll-card px-6 py-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-ink-mid">Taxa de Circulação da Biblioteca</h3>
          <span className="font-cinzel font-bold text-ink-dark text-lg">{ocupacao}%</span>
        </div>
        <div className="w-full h-3 rounded-full" style={{ background: 'rgba(44,24,16,0.1)' }}>
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${ocupacao}%`,
              background: ocupacao > 70
                ? 'linear-gradient(to right, #C9A84C, #8B1A1A)'
                : 'linear-gradient(to right, #C9A84C, #DAA520)',
            }}
          />
        </div>
        <p className="font-garamond text-ink-light text-xs mt-1 italic">
          {stats.concessoesAtivas} de {stats.totalPapiros} pergaminhos em circulação
        </p>
      </div>

      {/* Estudiosos com pendência */}
      <div>
        <h3 className="font-cinzel font-bold text-purple-royal text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle size={14} />
          Estudiosos com Pendência ({estudiososPendentes.length})
        </h3>

        {estudiososPendentes.length === 0 ? (
          <div className="scroll-card px-6 py-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-garamond text-green-ok italic">Nenhum estudioso com pendência!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {estudiososPendentes.map(e => (
              <div key={e.id} className="scroll-card px-5 py-4 flex items-center justify-between"
                style={{ borderColor: 'var(--purple-light)' }}>
                <div>
                  <p className="font-cinzel font-semibold text-ink-dark text-sm">👤 {e.nome_completo}</p>
                  <p className="font-garamond text-ink-light text-sm italic">{e.vinculo}</p>
                </div>
                <span className="badge-pendente text-xs font-cinzel px-3 py-1 rounded">
                  ⚠ Pendente
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
