'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { Session } from '@supabase/supabase-js'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-papyrus-light flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📜</div>
          <p className="font-cinzel text-ink-mid text-sm tracking-widest uppercase">
            Consultando os arquivos...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <Dashboard session={session} />
}

function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf3] flex items-center justify-center p-4 overflow-hidden relative"
      style={{
        backgroundImage: `
          radial-gradient(circle at 10% 20%, rgba(201,168,76,0.12) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(201,168,76,0.08) 0%, transparent 50%),
          url('https://www.transparenttextures.com/patterns/papyros.png')
        `
      }}
    >
      {/* Luzes de ambiente sutis */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[100px] rounded-full opacity-60" />

      <div className="w-full max-w-[420px] z-10 animate-fade-in">
        {/* Header de Prestígio */}
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-full bg-white border border-gold/30 mb-6 shadow-sm relative group">
             <div className="text-5xl relative">🏛️</div>
          </div>
          <h1 className="font-cinzel text-4xl font-bold tracking-[0.2em] text-[#2c1810] mb-2 drop-shadow-sm">
            ALEXANDRIA
          </h1>
          <p className="font-garamond text-[#8b6535] text-sm italic tracking-[0.2em] uppercase opacity-90">
            Sanctum Scientiæ
          </p>
          <div className="w-16 h-[1px] bg-[#c4a96e] mx-auto mt-4 opacity-40" />
        </div>

        {/* Card de Acesso */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gold/10 rounded-xl blur-lg"></div>
          <div className="relative scroll-card px-10 py-12 border border-gold/40 shadow-xl" 
               style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)' }}>
            
            <p className="font-cinzel text-[10px] text-center text-[#8b6535]/60 uppercase tracking-[0.2em] mb-8 font-bold">Portal de Entrada</p>
            
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#8b6535',
                      brandAccent: '#c4a96e',
                      inputBackground: '#fff',
                      inputBorder: '#d4c5a1',
                      inputBorderFocus: '#8b6535',
                      inputText: '#2c1810',
                      inputPlaceholder: '#a08b61',
                      messageText: '#8b6535',
                      anchorTextColor: '#6b2d8b',
                      dividerBackground: '#d4c5a1',
                    },
                    fonts: {
                      bodyFontFamily: 'var(--font-garamond), serif',
                      labelFontFamily: 'var(--font-cinzel), serif',
                      buttonFontFamily: 'var(--font-cinzel), serif',
                    },
                  },
                },
              }}
              providers={[]}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Endereço de E-mail',
                    password_label: 'Chave Secreta',
                    button_label: 'Entrar nos Arquivos',
                    link_text: 'Ainda não é um Estudioso? Solicite acesso',
                  },
                  sign_up: {
                    email_label: 'Seu E-mail',
                    password_label: 'Escolha uma Chave Secreta',
                    button_label: 'Tornar-se um Estudioso',
                    link_text: 'Já possui registro? Retorne ao pórtico'
                  },
                  forgotten_password: {
                     link_text: 'Retornar ao pórtico de entrada'
                  }
                },
              }}
            />
          </div>
        </div>

        <div className="mt-10 text-center space-y-2 opacity-60">
           <p className="font-garamond text-[#2c1810] text-xs italic">
             &ldquo;Que a luz da razão guie seus passos.&rdquo;
           </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .supabase-auth-ui_ui-button {
          letter-spacing: 0.1em !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          border-radius: 4px !important;
          border: 1px solid #8b6535 !important;
          transition: all 0.3s ease !important;
        }
        .supabase-auth-ui_ui-button:hover {
          background: #8b6535 !important;
          color: white !important;
        }
        .supabase-auth-ui_ui-input {
          border-radius: 4px !important;
          background: #fdfaf3 !important;
        }
        .supabase-auth-ui_ui-label {
          color: #8b6535 !important;
          opacity: 0.7 !important;
          letter-spacing: 0.1em !important;
        }
        .supabase-auth-ui_ui-anchor {
          color: #8b6535 !important;
          font-family: var(--font-garamond), serif !important;
          font-size: 13px !important;
          font-style: italic !important;
          text-decoration: none !important;
          transition: all 0.3s ease !important;
          display: block !important;
          text-align: center !important;
          margin-top: 12px !important;
          opacity: 0.6 !important;
        }
        .supabase-auth-ui_ui-anchor:hover {
          color: #c4a96e !important;
          opacity: 1 !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  )
}
