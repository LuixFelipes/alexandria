'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Users, Search, Pencil, Trash2, X, Save, UserPlus, Phone, MapPin, Hash } from 'lucide-react'

interface Leitor {
  id: string
  nome_completo: string
  cpf: string | null
  telefone: string | null
  endereco: string | null
  created_at: string
}

export default function GerenciarLeitores() {
  const [leitores, setLeitores] = useState<Leitor[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Modais
  const [leitorEditando, setLeitorEditando] = useState<Leitor | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetchLeitores()
  }, [])

  async function fetchLeitores() {
    setLoading(true)
    const { data } = await supabase.from('leitores_externos').select('*').order('nome_completo')
    setLeitores(data || [])
    setLoading(false)
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    if (!leitorEditando) return
    setSalvando(true)
    
    const { error } = await supabase
      .from('leitores_externos')
      .update({
        nome_completo: leitorEditando.nome_completo,
        cpf: leitorEditando.cpf,
        telefone: leitorEditando.telefone,
        endereco: leitorEditando.endereco
      })
      .eq('id', leitorEditando.id)

    if (!error) {
      await fetchLeitores()
      setLeitorEditando(null)
    }
    setSalvando(false)
  }

  async function excluirLeitor(id: string, nome: string) {
    if (!confirm(`Deseja remover o cadastro de "${nome}"? Esta ação removerá o histórico também.`)) return
    const { error } = await supabase.from('leitores_externos').delete().eq('id', id)
    if (!error) fetchLeitores()
    else alert('Erro ao excluir: ' + error.message)
  }

  const filtrados = leitores.filter(l => 
    l.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
    l.cpf?.includes(busca)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="scroll-card px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel font-bold text-ink-dark text-lg flex items-center gap-2">
            <Users size={20} /> Gestão de Leitores
          </h2>
          <p className="font-garamond text-ink-light text-sm italic">
            Administração de usuários externos da biblioteca
          </p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input-papyrus w-full pl-9"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-10 text-center font-cinzel opacity-40">Consultando registros...</div>
        ) : filtrados.length === 0 ? (
          <div className="col-span-full py-10 text-center font-garamond italic opacity-50">Nenhum leitor encontrado.</div>
        ) : filtrados.map(l => (
          <div key={l.id} className="scroll-card p-5 space-y-3 flex flex-col justify-between">
            <div>
               <div className="flex justify-between items-start">
                 <p className="font-cinzel font-bold text-ink-dark text-sm">{l.nome_completo}</p>
                 <div className="flex gap-2">
                   <button onClick={() => setLeitorEditando(l)} className="p-1.5 rounded hover:bg-gold/10 text-gold transition-colors"><Pencil size={12}/></button>
                   <button onClick={() => excluirLeitor(l.id, l.nome_completo)} className="p-1.5 rounded hover:bg-red-alert/10 text-red-alert transition-colors"><Trash2 size={12}/></button>
                 </div>
               </div>
               <div className="mt-2 space-y-1 text-xs font-garamond text-ink-light">
                 <p className="flex items-center gap-2"><Hash size={10}/> {l.cpf || '—'}</p>
                 <p className="flex items-center gap-2"><Phone size={10}/> {l.telefone || '—'}</p>
                 <p className="flex items-center gap-2"><MapPin size={10}/> {l.endereco || '—'}</p>
               </div>
            </div>
            <p className="text-[9px] opacity-30 font-mono mt-2">ID: {l.id.slice(0,8)}... · Desde: {new Date(l.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {/* Modal de Edição */}
      {leitorEditando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setLeitorEditando(null)}>
          <div className="scroll-card p-8 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLeitorEditando(null)} className="absolute top-4 right-4 text-ink-light"><X size={18}/></button>
            <h3 className="font-cinzel font-bold text-center mb-6">✏️ Editar Cadastro</h3>
            
            <form onSubmit={salvarEdicao} className="space-y-4">
               <div>
                  <label className="block font-cinzel text-[10px] uppercase mb-1">Nome Completo</label>
                  <input type="text" className="input-papyrus w-full" value={leitorEditando.nome_completo} onChange={e => setLeitorEditando({...leitorEditando, nome_completo: e.target.value})} required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-cinzel text-[10px] uppercase mb-1">CPF</label>
                    <input type="text" className="input-papyrus w-full text-xs" value={leitorEditando.cpf || ''} onChange={e => setLeitorEditando({...leitorEditando, cpf: e.target.value})} />
                  </div>
                  <div>
                    <label className="block font-cinzel text-[10px] uppercase mb-1">Telefone</label>
                    <input type="text" className="input-papyrus w-full text-xs" value={leitorEditando.telefone || ''} onChange={e => setLeitorEditando({...leitorEditando, telefone: e.target.value})} />
                  </div>
               </div>
               <div>
                  <label className="block font-cinzel text-[10px] uppercase mb-1">Endereço</label>
                  <input type="text" className="input-papyrus w-full text-xs" value={leitorEditando.endereco || ''} onChange={e => setLeitorEditando({...leitorEditando, endereco: e.target.value})} />
               </div>
               
               <button type="submit" disabled={salvando} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs">
                 <Save size={14}/> {salvando ? 'Salvando...' : 'Atualizar Cadastro'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
