'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import { Session } from '@supabase/auth-js'
import ListaPapiros from './ListaPapiros'
import FormEmprestimo from './FormEmprestimo'
import FormCadastrarPapiro from './FormCadastrarPapiro'
import GerenciarLeitores from './GerenciarLeitores'
import GerenciarEmprestimos from './GerenciarEmprestimos'
import FormEmprestimoInstitucional from './FormEmprestimoInstitucional'
import PainelNotificacoes from './PainelNotificacoes'
import PainelBibliothecarius from './PainelBibliothecarius'
import { 
  BookOpen, ScrollText, Bell, LayoutDashboard, 
  LogOut, User, BookPlus, ClipboardList, Building2, 
  Users, History, Shield, Menu as MenuIcon, ChevronLeft, 
  ChevronRight, Pencil, X 
} from 'lucide-react'

type Estudioso = Database['public']['Tables']['estudiosos']['Row']
type ActiveView = 'catalogo' | 'concessoes' | 'acervo' | 'leitores' | 'emprestimos' | 'institucional' | 'notificacoes' | 'admin'

interface DashboardProps {
  session: Session
}

export default function Dashboard({ session }: DashboardProps) {
  const [estudioso, setEstudioso] = useState<Estudioso | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('catalogo')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)

  const isAdmin = true; // Forçado para testes

  useEffect(() => {
    fetchEstudioso()
  }, [session.user.id])

  async function fetchEstudioso() {
    const { data } = await supabase.from('estudiosos').select('*').eq('id', session.user.id).single()
    setEstudioso(data)
  }

  async function atualizarPerfil() {
    if (!novoNome.trim()) return
    setSalvandoPerfil(true)
    const { error } = await supabase.from('estudiosos').update({ nome_completo: novoNome }).eq('id', session.user.id)
    if (!error) {
      setEstudioso(prev => prev ? { ...prev, nome_completo: novoNome } : null)
      setShowPerfilModal(false)
    }
    setSalvandoPerfil(false)
  }

  const menuItems = [
    { id: 'catalogo', label: 'Catálogo', icon: <BookOpen size={18} /> },
    { id: 'concessoes', label: 'Meus Empréstimos', icon: <ScrollText size={18} /> },
    { id: 'acervo', label: 'Gerenciar Acervo', icon: <BookPlus size={18} />, adminOnly: true },
    { id: 'leitores', label: 'Gestão de Leitores', icon: <Users size={18} />, adminOnly: true },
    { id: 'emprestimos', label: 'Empréstimos Externos', icon: <History size={18} />, adminOnly: true },
    { id: 'institucional', label: 'Empréstimo Institucional', icon: <Shield size={18} />, adminOnly: true },
  ]

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <div className="flex h-screen bg-[#F5E6CA] overflow-hidden font-garamond relative">
      {/* Mobile Toggle Button */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-[#3D1F0A] text-white rounded shadow-lg"
        >
          <MenuIcon size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[#3D1F0A] flex flex-col transition-all duration-300 ease-in-out shadow-2xl
          ${isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}
        style={{ background: 'linear-gradient(180deg, #3D1F0A 0%, #5C3D2E 60%, #3D1F0A 100%)' }}
      >
        <div className="p-6 border-b border-gold/20 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'lg:hidden'}`}>
             <span className="text-3xl">🏛️</span>
             <h1 className="font-cinzel font-bold text-sm text-[#F0D060]">Alexandria</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:block p-1.5 text-gold/60 hover:text-gold">
            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gold/60"><X size={24} /></button>
        </div>

        <div className="px-4 py-6 border-b border-gold/10">
          <div className={`flex items-center gap-3 group relative ${!isSidebarOpen && 'lg:justify-center'}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gold/20 border border-gold/40">
              <User size={18} className="text-[#F0D060]" />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-cinzel text-xs font-bold text-gold truncate">
                  {estudioso?.nome_completo || 'Estudioso'}
                </p>
                <div className="flex items-center gap-2">
                   <p className="font-garamond text-[10px] italic text-white/60 truncate uppercase">Bibliothecarius</p>
                   <button onClick={() => { setNovoNome(estudioso?.nome_completo || ''); setShowPerfilModal(true) }} className="opacity-0 group-hover:opacity-100"><Pencil size={10} className="text-gold" /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {filteredMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id as ActiveView); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-cinzel text-[10px] tracking-widest transition-all
                ${activeView === item.id ? 'bg-gold text-[#3D1F0A] shadow-lg font-bold' : 'text-white/70 hover:bg-gold/10 hover:text-gold'}
                ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}
               title={!isSidebarOpen ? item.label : ''}
            >
              {item.icon}
              {(isSidebarOpen || window.innerWidth < 1024) && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gold/10 text-center">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 text-white/40 hover:text-red-alert font-cinzel text-[9px] mx-auto">
            <LogOut size={16} /> {isSidebarOpen && <span>SAIR DO ARQUIVO</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto relative">
        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" />}
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          {activeView === 'catalogo' && <ListaPapiros isAdmin={isAdmin} />}
          {activeView === 'acervo' && <FormCadastrarPapiro />}
          {activeView === 'leitores' && <GerenciarLeitores />}
          {activeView === 'emprestimos' && <GerenciarEmprestimos />}
          {activeView === 'institucional' && <FormEmprestimoInstitucional />}
          {activeView === 'concessoes' && <div className="p-10 text-center font-cinzel italic text-ink-light">Área de Meus Empréstimos em breve...</div>}
        </div>
      </main>

      {/* Modal Perfil */}
      {showPerfilModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-[#FDFAF3] p-8 rounded-lg shadow-2xl border border-gold/30 max-w-md w-full animate-fade-in">
            <h3 className="font-cinzel font-bold text-ink-dark text-lg mb-6">🏛️ Editar Identidade</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-cinzel text-[10px] uppercase text-ink-light mb-2">Seu Nome de Estudioso</label>
                <input type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full bg-[#f4ece0] border-b border-gold/50 p-3 font-garamond focus:outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={atualizarPerfil} disabled={salvandoPerfil} className="flex-1 bg-gold text-white py-3 font-cinzel text-xs hover:bg-[#b89548] transition-colors">{salvandoPerfil ? 'Atualizando...' : 'Confirmar Alteração'}</button>
                <button onClick={() => setShowPerfilModal(false)} className="flex-1 border border-gold/20 py-3 font-cinzel text-xs hover:bg-gold/5">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
