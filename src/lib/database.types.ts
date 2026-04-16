export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      papiros: {
        Row: {
          id: string
          titulo: string
          autor: string
          genero: string
          status: 'disponivel' | 'emprestado' | 'restauro'
          imagem_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          autor: string
          genero: string
          status?: 'disponivel' | 'emprestado' | 'restauro'
          imagem_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          autor?: string
          genero?: string
          status?: 'disponivel' | 'emprestado' | 'restauro'
          imagem_url?: string | null
          created_at?: string
        }
      }
      estudiosos: {
        Row: {
          id: string
          nome_completo: string
          vinculo: 'Sábio' | 'Escriba' | 'Estudante' | 'Bibliothecarius'
          status_pendencia: boolean
          created_at: string
        }
        Insert: {
          id: string
          nome_completo: string
          vinculo?: 'Sábio' | 'Escriba' | 'Estudante'
          status_pendencia?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome_completo?: string
          vinculo?: 'Sábio' | 'Escriba' | 'Estudante'
          status_pendencia?: boolean
          created_at?: string
        }
      }
      concessoes: {
        Row: {
          id: string
          papiro_id: string
          estudioso_id: string
          data_retirada: string
          data_devolucao_prevista: string
          devolvido: boolean
          created_at: string
        }
        Insert: {
          id?: string
          papiro_id: string
          estudioso_id: string
          data_retirada?: string
          data_devolucao_prevista: string
          devolvido?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          papiro_id?: string
          estudioso_id?: string
          data_retirada?: string
          data_devolucao_prevista?: string
          devolvido?: boolean
          created_at?: string
        }
      }
    }
  }
}
