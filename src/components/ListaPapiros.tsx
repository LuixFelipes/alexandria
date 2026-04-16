'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Search, BookOpen, Filter, X, Hash, FileText } from 'lucide-react'

interface Papiro {
  id: string
  titulo: string
  autor: string
  genero: string
  status: string
  imagem_url: string | null
  descricao: string | null
  isbn: string | null
}

interface ListaPapirosProps {
  isAdmin: boolean
}

const STATUS_LABELS: Record<string, string> = {
  disponivel: 'Disponível',
  emprestado: 'Emprestado',
  restauro: 'Em Restauro',
}

const GENEROS = ['Todos', 'Filosofia', 'Epopeia', 'Matemática', 'Astronomia', 'Poesia', 'Estratégia', 'História', 'Medicina', 'Retórica', 'Teatro', 'Ciências Naturais']

const GENRE_ICONS: Record<string, string> = {
  'Filosofia': '🧠', 'Epopeia': '⚔️', 'Matemática': '📐',
  'Astronomia': '🌟', 'Poesia': '🎭', 'Estratégia': '🗺️',
  'História': '📖', 'Medicina': '⚕️', 'Retórica': '🗣️',
  'Teatro': '🎪', 'Ciências Naturais': '🌿',
}

export default function ListaPapiros({ isAdmin }: ListaPapirosProps) {
  const [papiros, setPapiros] = useState<Papiro[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('Todos')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [papiroSelecionado, setPapiroSelecionado] = useState<Papiro | null>(null)

  const fetchPapiros = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('papiros').select('*').order('titulo')

    if (busca.trim()) {
      query = query.or(
        `titulo.ilike.%${busca}%,autor.ilike.%${busca}%,genero.ilike.%${busca}%,isbn.ilike.%${busca}%`
      )
    }

    if (generoFiltro !== 'Todos') query = query.eq('genero', generoFiltro)
    if (statusFiltro !== 'todos') query = query.eq('status', statusFiltro)

    const { data, error } = await query
    if (!error && data) setPapiros(data as Papiro[])
    setLoading(false)
  }, [busca, generoFiltro, statusFiltro])

  useEffect(() => { fetchPapiros() }, [fetchPapiros])

  useEffect(() => {
    const channel = supabase
      .channel('papiros-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'papiros' }, () => fetchPapiros())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchPapiros])

  const stats = {
    total: papiros.length,
    disponiveis: papiros.filter(p => p.status === 'disponivel').length,
    emprestados: papiros.filter(p => p.status === 'emprestado').length,
    restauro: papiros.filter(p => p.status === 'restauro').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats rápidos */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: '📚', color: 'text-ink-dark' },
          { label: 'Disponíveis', value: stats.disponiveis, icon: '✅', color: 'text-green-ok' },
          { label: 'Emprestados', value: stats.emprestados, icon: '📤', color: 'text-gold' },
          { label: 'Em Restauro', value: stats.restauro, icon: '🔧', color: 'text-red-alert' },
        ].map(stat => (
          <div key={stat.label} className="scroll-card px-4 py-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`font-cinzel font-bold text-2xl ${stat.color}`}>{stat.value}</div>
            <div className="font-garamond text-ink-light text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de busca e filtros */}
      <div className="scroll-card px-6 py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              placeholder="Buscar por título, autor, gênero ou ISBN..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="input-papyrus w-full pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-ink-light" />
            <select value={generoFiltro} onChange={e => setGeneroFiltro(e.target.value)} className="input-papyrus">
              {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)} className="input-papyrus">
            <option value="todos">Todos os status</option>
            <option value="disponivel">Disponíveis</option>
            <option value="emprestado">Emprestados</option>
            <option value="restauro">Em Restauro</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <div className="realtime-dot" />
            <span className="font-garamond text-ink-light text-xs italic">Tempo real</span>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 animate-bounce">📜</div>
          <p className="font-cinzel text-ink-mid text-sm tracking-widest">Consultando os arquivos...</p>
        </div>
      ) : papiros.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-cinzel text-ink-mid text-lg">Nenhum pergaminho encontrado</p>
          <p className="font-garamond text-ink-light text-sm italic mt-1">Tente outros termos de busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {papiros.map(papiro => (
            <PapiroCard
              key={papiro.id}
              papiro={papiro}
              isAdmin={isAdmin}
              onUpdate={fetchPapiros}
              onOpenDetail={() => setPapiroSelecionado(papiro)}
            />
          ))}
        </div>
      )}

      {/* Modal de detalhes */}
      {papiroSelecionado && (
        <PapiroModal
          papiro={papiroSelecionado}
          onClose={() => setPapiroSelecionado(null)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Card do livro                                                        */
/* ------------------------------------------------------------------ */
function PapiroCard({
  papiro, isAdmin, onUpdate, onOpenDetail,
}: {
  papiro: Papiro
  isAdmin: boolean
  onUpdate: () => void
  onOpenDetail: () => void
}) {
  async function toggleStatus(novoStatus: string) {
    const { error } = await supabase.from('papiros').update({ status: novoStatus }).eq('id', papiro.id)
    if (error) {
      alert(`Erro ao alterar status: ${error.message}\nVerifique se você tem permissões de 'Bibliothecarius'.`)
    } else {
      onUpdate()
    }
  }

  const statusClass = {
    disponivel: 'status-disponivel',
    emprestado: 'status-emprestado',
    restauro: 'status-restauro',
  }[papiro.status] ?? 'status-disponivel'

  return (
    <div
      className="scroll-card p-0 flex flex-col hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group"
      onClick={onOpenDetail}
    >
      {/* Capa / placeholder */}
      <div
        className="relative w-full h-44 flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(61,31,10,0.12) 100%)' }}
      >
        {papiro.imagem_url ? (
          <img
            src={papiro.imagem_url}
            alt={papiro.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl opacity-60 group-hover:scale-110 transition-transform duration-300">
            {GENRE_ICONS[papiro.genero] || '📜'}
          </span>
        )}
        {/* Badge status sobre a capa */}
        <span className={`absolute top-2 right-2 text-xs font-cinzel px-2 py-1 rounded ${statusClass}`}>
          {STATUS_LABELS[papiro.status]}
        </span>
        {/* Hint de clique */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
          <span className="text-xs font-cinzel px-3 py-1 rounded-full" style={{ background: 'rgba(245,230,202,0.9)', color: 'var(--ink-dark)' }}>
            Ver detalhes
          </span>
        </div>
      </div>

      {/* Corpo */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-cinzel font-semibold text-ink-dark text-sm leading-tight line-clamp-2">
            {papiro.titulo}
          </h3>
          <p className="font-garamond text-ink-mid text-sm italic">{papiro.autor}</p>
        </div>

        <div className="flex items-center gap-1 text-ink-light">
          <BookOpen size={12} />
          <span className="font-garamond text-xs">{papiro.genero}</span>
          {papiro.isbn && (
            <>
              <span className="mx-1 opacity-30">·</span>
              <Hash size={10} />
              <span className="font-garamond text-xs">{papiro.isbn}</span>
            </>
          )}
        </div>

        {papiro.descricao && (
          <p className="font-garamond text-ink-light text-xs italic line-clamp-2 leading-relaxed">
            {papiro.descricao}
          </p>
        )}

      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal de detalhes                                                    */
/* ------------------------------------------------------------------ */
function PapiroModal({ papiro, onClose }: { papiro: Papiro; onClose: () => void }) {
  const statusClass = {
    disponivel: 'status-disponivel',
    emprestado: 'status-emprestado',
    restauro: 'status-restauro',
  }[papiro.status] ?? 'status-disponivel'

  // fechar com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,10,5,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #F5E6CA 0%, #EDD9A3 100%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
          border: '1px solid rgba(201,168,76,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(44,24,16,0.12)', color: 'var(--ink-mid)' }}
        >
          <X size={16} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Capa */}
          <div
            className="md:w-56 flex-shrink-0 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(61,31,10,0.15) 0%, rgba(201,168,76,0.2) 100%)',
              minHeight: '240px',
            }}
          >
            {papiro.imagem_url ? (
              <img
                src={papiro.imagem_url}
                alt={papiro.titulo}
                className="w-full h-full object-cover md:max-h-80"
              />
            ) : (
              <span className="text-7xl">{GENRE_ICONS[papiro.genero] || '📜'}</span>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 p-7 flex flex-col gap-4">
            {/* Título e status */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-cinzel font-bold text-ink-dark text-xl leading-tight">
                  {papiro.titulo}
                </h2>
                <span className={`text-xs font-cinzel px-3 py-1 rounded whitespace-nowrap ${statusClass}`}>
                  {STATUS_LABELS[papiro.status]}
                </span>
              </div>
              <p className="font-garamond text-ink-mid text-base italic">{papiro.autor}</p>
            </div>

            <div className="ornament-divider" />

            {/* Metadados */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-cinzel text-xs uppercase tracking-widest text-ink-light block mb-0.5">Gênero</span>
                <span className="font-garamond text-ink-dark text-sm">
                  {GENRE_ICONS[papiro.genero] || '📜'} {papiro.genero}
                </span>
              </div>

              {papiro.isbn && (
                <div>
                  <span className="font-cinzel text-xs uppercase tracking-widest text-ink-light block mb-0.5">ISBN</span>
                  <span className="font-garamond text-ink-dark text-sm flex items-center gap-1">
                    <Hash size={12} className="text-ink-light" />
                    {papiro.isbn}
                  </span>
                </div>
              )}
            </div>

            {/* Descrição */}
            {papiro.descricao ? (
              <div>
                <span className="font-cinzel text-xs uppercase tracking-widest text-ink-light block mb-1 flex items-center gap-1">
                  <FileText size={11} /> Sinopse
                </span>
                <p className="font-garamond text-ink-mid text-sm leading-relaxed italic">
                  {papiro.descricao}
                </p>
              </div>
            ) : (
              <p className="font-garamond text-ink-light text-sm italic opacity-60">
                Nenhuma descrição cadastrada para este pergaminho.
              </p>
            )}

            {/* Disponibilidade */}
            <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--papyrus-border)' }}>
              {papiro.status === 'disponivel' ? (
                <p className="font-cinzel text-green-ok text-xs flex items-center gap-2">
                  ✓ Disponível para empréstimo
                </p>
              ) : papiro.status === 'emprestado' ? (
                <p className="font-cinzel text-gold text-xs flex items-center gap-2">
                  📤 Atualmente emprestado
                </p>
              ) : (
                <p className="font-cinzel text-red-alert text-xs flex items-center gap-2">
                  🔧 Em restauro — indisponível para empréstimo
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
