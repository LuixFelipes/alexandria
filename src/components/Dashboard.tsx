'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import ListaPapiros from './ListaPapiros'
import FormEmprestimo from './FormEmprestimo'
import FormCadastrarPapiro from './FormCadastrarPapiro'
import GerenciarEmprestimos from './GerenciarEmprestimos'
import PainelBibliothecarius from './PainelBibliothecarius'
import MinhasConcessoes from './MinhasConcessoes'
import GerenciarLeitores from './GerenciarLeitores'
import PainelNotificacoes from './PainelNotificacoes'
import FormEmprestimoInstitucional from './FormEmprestimoInstitucional'
import { 
  BookOpen, ScrollText, Bell, LayoutDashboard, 
  LogOut, User, BookPlus, ClipboardList, Building2, 
  Plus, Pencil, Users 
} from 'lucide-react'

type Estudioso = Database['public']['Tables']['estudiosos']['Row']

interface DashboardProps {
  session: Session
}

type ActiveView = 'catalogo' | 'meus_emprestimos' | 'emprestimo' | 'acervo' | 'estudiosos' | 'gerenciar_emprestimos' | 'notificacoes' | 'admin' | 'emprestimo_institucional'

export default function Dashboard({ session }: DashboardProps) {
  const [estudioso, setEstudioso] = useState<Estudioso | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('catalogo')
  const [notifsCount, setNotifsCount] = useState(0)
  
  // Perfil
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)

  // Forçando admin como true temporariamente para você testar todas as abas
  const isAdmin = true; // estudioso?.vinculo === 'Bibliothecarius'

  useEffect(() => {
    fetchEstudioso()
  }, [session.user.id])

  async function fetchEstudioso() {
    const { data, error } = await supabase
      .from('estudiosos')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (error) console.error("Erro ao buscar estudioso:", error)
    console.log("Seu estudioso no banco:", data)
    setEstudioso(data)
  }

  useEffect(() => {
    if (!isAdmin) return
    supabase
      .from('concessoes')
      .select('id', { count: 'exact' })
      .eq('devolvido', false)
      .lt('data_devolucao_prevista', new Date().toISOString())
      .then(({ count }) => setNotifsCount(count ?? 0))
  }, [isAdmin])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; adminOnly?: boolean; separator?: boolean }[] = [
    { id: 'catalogo', label: 'Catálogo', icon: <BookOpen size={16} /> },
    { id: 'emprestimo', label: 'Novo Empréstimo', icon: <ScrollText size={16} /> },
    // Admin only
    { id: 'acervo', label: 'Gerenciar Acervo', icon: <BookPlus size={16} />, adminOnly: true },
    { id: 'estudiosos', label: 'Gerenciar Leitores', icon: <Users size={16} />, adminOnly: true },
    { id: 'gerenciar_emprestimos', label: 'Todos os Empréstimos', icon: <ClipboardList size={16} />, adminOnly: true },
    { id: 'emprestimo_institucional', label: 'Empréstimo Institucional', icon: <Building2 size={16} />, adminOnly: true },
    { id: 'notificacoes', label: 'Sistema Nuntii', icon: <Bell size={16} />, adminOnly: true },
    { id: 'admin', label: 'Painel Geral', icon: <LayoutDashboard size={16} />, adminOnly: true },
  ]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5E6CA' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #3D1F0A 0%, #5C3D2E 60%, #3D1F0A 100%)',
          boxShadow: '4px 0 16px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="font-cinzel font-bold text-sm text-gold-bright leading-tight">
                Biblioteca de
              </h1>
              <h1 className="font-cinzel font-bold text-sm leading-tight" style={{ color: '#F5E6CA' }}>
                Alexandria
              </h1>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)' }}>
              <User size={14} style={{ color: '#F0D060' }} />
            </div>
            <div className="overflow-hidden flex-1">
              <div className="flex items-center justify-between">
                <p className="font-cinzel text-xs truncate" style={{ color: '#F0D060' }}>
                  {estudioso?.nome_completo || session.user.email?.split('@')[0]}
                </p>
                <button 
                  onClick={() => { setNovoNome(estudioso?.nome_completo || ''); setShowPerfilModal(true) }}
                  className="opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Pencil size={10} className="text-gold" /> 
                </button>
              </div>
              <p className="font-garamond text-xs italic" style={{ color: 'rgba(245,230,202,0.6)' }}>
                {estudioso?.vinculo || 'Estudante'}
              </p>
            </div>
          </div>
          {estudioso?.status_pendencia && (
            <div className="mt-2 px-2 py-1 rounded text-xs font-cinzel badge-pendente text-center">
              ⚠ Devolução Pendente
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {/* Itens comuns */}
          {navItems.filter(i => !i.adminOnly).map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`nav-link w-full text-left relative ${activeView === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Seção Admin */}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-1">
                <p className="font-cinzel text-xs uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.65rem' }}>
                  — Bibliothecarius —
                </p>
              </div>
              {navItems.filter(i => i.adminOnly).map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`nav-link w-full text-left relative ${activeView === item.id ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'notificacoes' && notifsCount > 0 && (
                    <span className="ml-auto bg-purple-royal text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-cinzel">
                      {notifsCount}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Realtime indicator + sign out */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="realtime-dot" />
            <span className="font-garamond text-xs italic" style={{ color: 'rgba(245,230,202,0.5)' }}>
              Atualização em tempo real
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="nav-link w-full opacity-70 hover:opacity-100"
          >
            <LogOut size={16} />
            <span>Sair da Biblioteca</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 px-8 py-4 border-b border-papyrus-border flex items-center justify-between"
          style={{
            background: 'rgba(245,230,202,0.95)',
            backdropFilter: 'blur(8px)',
          }}>
            <div>
              <h2 className="font-cinzel font-bold text-ink-dark text-lg">
                {navItems.find(i => i.id === activeView)?.label}
              </h2>
              <p className="font-garamond text-ink-light text-sm italic">
                {activeView === 'catalogo' && 'Explore os pergaminhos disponíveis na grande biblioteca'}
                {activeView === 'emprestimo' && 'Registre a concessão de um pergaminho a um estudioso'}
                {activeView === 'meus_emprestimos' && 'Seus pergaminhos retirados e histórico de leituras'}
                {activeView === 'acervo' && 'Cadastre, edite e gerencie todo o acervo da biblioteca'}
                {activeView === 'estudiosos' && 'Gerencie o cadastro e acesso dos estudiosos'}
                {activeView === 'gerenciar_emprestimos' && 'Todos os empréstimos registrados — ativos, atrasados e histórico'}
                {activeView === 'emprestimo_institucional' && 'Gerencie empréstimos de pergaminhos para outras instituições'}
                {activeView === 'notificacoes' && 'Alertas de devoluções em atraso — Sistema Nuntii'}
                {activeView === 'admin' && 'Visão geral da biblioteca — estatísticas e pendências'}
              </p>
            </div>
        </header>

        {/* View content */}
        <div className="p-8">
          {activeView === 'catalogo' && <ListaPapiros isAdmin={isAdmin} />}
          {activeView === 'emprestimo' && (
            <FormEmprestimo
              userId={session.user.id}
              isAdmin={isAdmin}
              onSuccess={() => setActiveView(isAdmin ? 'gerenciar_emprestimos' : 'meus_emprestimos')}
            />
          )}
          {activeView === 'meus_emprestimos' && (
            <MinhasConcessoes userId={session.user.id} isAdmin={isAdmin} />
          )}
          {activeView === 'acervo' && isAdmin && <FormCadastrarPapiro />}
          {activeView === 'estudiosos' && isAdmin && <GerenciarLeitores />}
          {activeView === 'gerenciar_emprestimos' && isAdmin && <GerenciarEmprestimos />}
          {activeView === 'emprestimo_institucional' && isAdmin && <FormEmprestimoInstitucional />}
          {activeView === 'notificacoes' && isAdmin && <PainelNotificacoes />}
          {activeView === 'admin' && isAdmin && <PainelBibliothecarius />}
        </div>

        {/* Modal Editar Perfil */}
        {showPerfilModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="scroll-card p-8 max-w-sm w-full space-y-6" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/30">
                  <User size={32} className="text-gold" />
                </div>
                <h3 className="font-cinzel font-bold text-ink-dark">Editar seu Perfil</h3>
                <p className="font-garamond text-ink-light text-xs italic">Como você deseja ser chamado na biblioteca?</p>
              </div>

              <div className="space-y-2">
                <label className="font-cinzel text-[10px] uppercase tracking-widest text-ink-mid">Nome Completo</label>
                <input 
                  type="text" 
                  value={novoNome} 
                  onChange={e => setNovoNome(e.target.value)}
                  className="input-papyrus w-full"
                  placeholder="Seu nome"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  disabled={salvandoPerfil}
                  onClick={async () => {
                    setSalvandoPerfil(true)
                    const { error } = await supabase.from('estudiosos').update({ nome_completo: novoNome }).eq('id', session.user.id)
                    if (!error) {
                      await fetchEstudioso()
                      setShowPerfilModal(false)
                    }
                    setSalvandoPerfil(false)
                  }}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  {salvandoPerfil ? 'Salvando...' : 'Salvar Nome'}
                </button>
                <button 
                  onClick={() => setShowPerfilModal(false)}
                  className="flex-1 py-2 text-xs font-cinzel border border-papyrus-border hover:bg-papyrus-mid"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
