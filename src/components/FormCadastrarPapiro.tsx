'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Plus, Pencil, Trash2, Save, X, BookPlus, Hash, AlertTriangle, CheckCircle, FileText } from 'lucide-react'

type PapiroStatus = 'disponivel' | 'emprestado' | 'restauro'

interface Papiro {
  id: string
  titulo: string
  autor: string
  genero: string
  status: PapiroStatus
  imagem_url: string | null
  descricao: string | null
  isbn: string | null
}

const GENEROS = ['Filosofia', 'Epopeia', 'Matemática', 'Astronomia', 'Poesia', 'Estratégia', 'História', 'Medicina', 'Retórica', 'Teatro', 'Ciências Naturais', 'Outro']

const EMPTY_FORM = {
  titulo: '',
  autor: '',
  genero: 'Filosofia',
  status: 'disponivel' as PapiroStatus,
  imagem_url: '',
  descricao: '',
  isbn: '',
}

export default function FormCadastrarPapiro() {
  const [papiros, setPapiros] = useState<Papiro[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucessoMsg, setSucessoMsg] = useState('')
  
  // Novo sistema de confirmação interna
  const [confirmarAcao, setConfirmarAcao] = useState<{ type: 'save' | 'delete', id?: string, titulo?: string } | null>(null)

  useEffect(() => { fetchPapiros() }, [])

  async function fetchPapiros() {
    setLoading(true)
    const { data } = await supabase.from('papiros').select('*').order('titulo')
    setPapiros((data as Papiro[]) || [])
    setLoading(false)
  }

  function abrirNovo() {
    setForm(EMPTY_FORM); setEditando(null); setShowForm(true); setErro('')
  }

  function abrirEdicao(p: Papiro) {
    setForm({
      titulo: p.titulo, autor: p.autor, genero: p.genero, status: p.status as PapiroStatus,
      imagem_url: p.imagem_url || '', descricao: p.descricao || '', isbn: p.isbn || '',
    })
    setEditando(p.id); setShowForm(true); setErro('')
  }

  function cancelar() {
    setShowForm(false); setEditando(null); setForm(EMPTY_FORM); setErro('')
  }

  async function executarSalvamento() {
    setConfirmarAcao(null)
    setSalvando(true)
    setErro('')

    try {
      const payload = {
        titulo: form.titulo.trim(),
        autor: form.autor.trim(),
        genero: form.genero,
        status: form.status,
        imagem_url: form.imagem_url?.trim() || null,
        descricao: form.descricao?.trim() || null,
        isbn: form.isbn?.trim() || null,
      }

      if (editando) {
        const { error } = await supabase.from('papiros').update(payload).eq('id', editando)
        if (error) throw error
        setSucessoMsg('Pergaminho atualizado!')
      } else {
        const { error } = await supabase.from('papiros').insert(payload)
        if (error) throw error
        setSucessoMsg('Pergaminho cadastrado!')
      }

      await fetchPapiros()
      cancelar()
      setTimeout(() => setSucessoMsg(''), 3000)
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function executarExclusao() {
    if (!confirmarAcao?.id) return
    const { error } = await supabase.from('papiros').delete().eq('id', confirmarAcao.id)
    if (error) alert(error.message)
    else fetchPapiros()
    setConfirmarAcao(null)
  }

  const GENRE_ICONS: Record<string, string> = {
    'Filosofia': '🧠', 'Epopeia': '⚔️', 'Matemática': '📐', 'Astronomia': '🌟', 'Poesia': '🎭',
    'Estratégia': '🗺️', 'História': '📖', 'Medicina': '⚕️', 'Retórica': '🗣️', 'Teatro': '🎪', 'Ciências Naturais': '🌿',
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="scroll-card px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-cinzel font-bold text-ink-dark text-lg flex items-center gap-2">
            <BookPlus size={20} /> Gestão do Acervo
          </h2>
          <p className="font-garamond text-ink-light text-sm italic">{papiros.length} pergaminhos catalogados</p>
        </div>
        {!showForm && <button onClick={abrirNovo} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs"><Plus size={14} /> Novo</button>}
      </div>

      {sucessoMsg && (
        <div className="scroll-card px-5 py-3 border-green-ok/30 bg-green-ok/5 flex items-center gap-2">
          <CheckCircle size={14} className="text-green-ok" />
          <span className="text-green-ok font-cinzel text-xs">{sucessoMsg}</span>
        </div>
      )}

      {showForm && (
        <div className="scroll-card px-8 py-8 border-gold/20">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={(e) => e.preventDefault()}>
            <div className="md:col-span-2">
              <label className="label-papyrus">Título *</label>
              <input type="text" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="input-papyrus w-full" />
            </div>
            <div>
              <label className="label-papyrus">Autor *</label>
              <input type="text" value={form.autor} onChange={e => setForm({...form, autor: e.target.value})} className="input-papyrus w-full" />
            </div>
            <div>
              <label className="label-papyrus">ISBN</label>
              <input type="text" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} className="input-papyrus w-full" />
            </div>
            <div>
              <label className="label-papyrus">Gênero</label>
              <select value={form.genero} onChange={e => setForm({...form, genero: e.target.value})} className="input-papyrus w-full">
                {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label-papyrus">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as PapiroStatus})} className="input-papyrus w-full">
                <option value="disponivel">Disponível</option>
                <option value="restauro">Em Restauro</option>
              </select>
            </div>

            {/* Upload de Capa */}
            <div className="md:col-span-2 space-y-2">
              <label className="label-papyrus flex items-center gap-2">📷 Capa do Pergaminho (Imagem)</label>
              <div className="flex items-center gap-6 p-5 rounded border-2 border-dashed border-gold/20 bg-gold/5">
                <div className="w-24 h-32 flex-shrink-0 bg-papyrus-dark rounded shadow-inner overflow-hidden border border-gold/20 flex items-center justify-center">
                  {form.imagem_url ? (
                    <img src={form.imagem_url} className="w-full h-full object-cover" alt="Capa" />
                  ) : (
                    <span className="text-4xl opacity-10">📜</span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    id="upload-capa"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const fileExt = file.name.split('.').pop()
                      const fileName = `${Math.random()}.${fileExt}`
                      const filePath = `${fileName}`
                      setSalvando(true)
                      const { error: uploadError } = await supabase.storage.from('papiros-capas').upload(filePath, file)
                      if (uploadError) {
                        setErro('Erro no upload: ' + uploadError.message)
                      } else {
                        const { data: { publicUrl } } = supabase.storage.from('papiros-capas').getPublicUrl(filePath)
                        setForm(f => ({ ...f, imagem_url: publicUrl }))
                      }
                      setSalvando(false)
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <label htmlFor="upload-capa" className="btn-primary text-[10px] px-5 py-2.5 cursor-pointer inline-flex items-center gap-2">
                      {salvando ? 'Processando...' : 'Escolher Imagem'}
                    </label>
                    {form.imagem_url && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, imagem_url: '' }))} className="px-4 py-2 border border-red-alert/50 text-red-alert text-[10px] font-cinzel hover:bg-red-alert/10 transition-colors">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="label-papyrus flex items-center gap-2">
                <FileText size={12} className="text-gold" /> Sinopse / Descrição do Conteúdo
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gold/5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <textarea 
                  value={form.descricao} 
                  onChange={e => setForm({...form, descricao: e.target.value})} 
                  placeholder="Descreva aqui os segredos e saberes contidos neste pergaminho..."
                  className="input-papyrus w-full h-32 resize-none p-4 font-garamond text-base leading-relaxed italic placeholder:text-ink-light/30 focus:border-gold/50 transition-all border-gold/10"
                  style={{ background: 'rgba(245, 230, 202, 0.1)' }}
                />
              </div>
              <p className="text-[9px] font-garamond text-ink-light opacity-50 text-right italic">
                A descrição será exibida nos detalhes do catálogo para os estudiosos.
              </p>
            </div>

            {erro && <p className="md:col-span-2 text-red-alert text-xs italic">{erro}</p>}

            <div className="md:col-span-2 flex gap-3 pt-4 border-t border-gold/10">
              <button 
                type="button" 
                onClick={() => setConfirmarAcao({ type: 'save' })}
                disabled={salvando || !form.titulo || !form.autor}
                className="btn-primary flex items-center gap-2 px-6 py-2.5"
              >
                <Save size={16} /> {salvando ? 'Salvando...' : editando ? 'Atualizar Pergaminho' : 'Cadastrar Pergaminho'}
              </button>
              <button type="button" onClick={cancelar} className="px-6 py-2.5 border border-papyrus-border font-cinzel text-xs hover:bg-papyrus-mid transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="grid grid-cols-1 gap-2">
        {loading ? (
          <p className="text-center font-cinzel opacity-40 py-10">Explorando o acervo...</p>
        ) : papiros.map(p => (
          <div key={p.id} className="scroll-card p-4 flex items-center justify-between gap-4 group hover:border-gold/30 transition-all">
            <div className="flex items-center gap-3">
               <span className="text-2xl opacity-80">{GENRE_ICONS[p.genero] || '📜'}</span>
               <div>
                 <p className="font-cinzel font-bold text-sm text-ink-dark">{p.titulo}</p>
                 <p className="font-garamond text-xs italic text-ink-light">{p.autor}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] uppercase font-cinzel px-2 py-0.5 rounded-full border ${p.status === 'disponivel' ? 'border-green-ok/30 text-green-ok' : 'border-red-alert/30 text-red-alert'}`}>
                {p.status}
              </span>
              <button onClick={() => abrirEdicao(p)} className="p-2 hover:bg-gold/10 rounded text-gold transition-colors"><Pencil size={14}/></button>
              <button onClick={() => setConfirmarAcao({ type: 'delete', id: p.id, titulo: p.titulo })} className="p-2 hover:bg-red-alert/5 rounded text-red-alert transition-colors"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* NOVO MODAL DE CONFIRMAÇÃO INTERNO */}
      {confirmarAcao && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="scroll-card p-8 max-w-sm w-full text-center space-y-6 border-gold/50 shadow-2xl">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto border border-gold/20">
              {confirmarAcao.type === 'save' ? <Save className="text-gold" size={32} /> : <AlertTriangle className="text-red-alert" size={32} />}
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-ink-dark text-lg">
                {confirmarAcao.type === 'save' ? 'Confirmar Registro' : 'Confirmar Exclusão'}
              </h3>
              <p className="font-garamond text-ink-light text-sm italic mt-2">
                {confirmarAcao.type === 'save' 
                  ? `Deseja ${editando ? 'atualizar' : 'cadastrar'} o pergaminho "${form.titulo}" no acervo da biblioteca?`
                  : `Tem certeza que deseja remover permanentemente "${confirmarAcao.titulo}" de nossos registros?`
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={confirmarAcao.type === 'save' ? executarSalvamento : executarExclusao}
                className={`flex-1 py-3 font-cinzel text-xs rounded transition-all shadow-lg ${confirmarAcao.type === 'save' ? 'bg-gold text-white hover:bg-gold-dark' : 'bg-red-alert text-white hover:bg-red-dark'}`}
              >
                Sim, Confirmar
              </button>
              <button 
                onClick={() => setConfirmarAcao(null)}
                className="flex-1 py-3 font-cinzel text-xs border border-papyrus-border hover:bg-papyrus-mid"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .label-papyrus { @apply block font-cinzel text-[10px] uppercase tracking-widest text-ink-light mb-1; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
