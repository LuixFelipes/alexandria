-- ============================================================
-- EMPRÉSTIMOS INSTITUCIONAIS — Cole este SQL no Supabase
-- ============================================================

-- Tabela principal: instituições que pegam empréstimo
CREATE TABLE IF NOT EXISTS emprestimos_institucionais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_instituicao TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  email_contato TEXT,
  telefone TEXT,
  quantidade_livros INTEGER NOT NULL DEFAULT 1 CHECK (quantidade_livros > 0),
  data_retirada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_devolucao_prevista TIMESTAMPTZ NOT NULL,
  devolvido BOOLEAN NOT NULL DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento: quais papiros fazem parte de cada empréstimo
CREATE TABLE IF NOT EXISTS emprestimo_institucional_papiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emprestimo_id UUID NOT NULL REFERENCES emprestimos_institucionais(id) ON DELETE CASCADE,
  papiro_id UUID NOT NULL REFERENCES papiros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (emprestimo_id, papiro_id)
);

-- RLS
ALTER TABLE emprestimos_institucionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE emprestimo_institucional_papiros ENABLE ROW LEVEL SECURITY;

-- Apenas admin pode ver e manipular
CREATE POLICY "ei_admin_select" ON emprestimos_institucionais FOR SELECT USING (is_bibliothecarius());
CREATE POLICY "ei_admin_insert" ON emprestimos_institucionais FOR INSERT WITH CHECK (is_bibliothecarius());
CREATE POLICY "ei_admin_update" ON emprestimos_institucionais FOR UPDATE USING (is_bibliothecarius());
CREATE POLICY "ei_admin_delete" ON emprestimos_institucionais FOR DELETE USING (is_bibliothecarius());

CREATE POLICY "eip_admin_select" ON emprestimo_institucional_papiros FOR SELECT USING (is_bibliothecarius());
CREATE POLICY "eip_admin_insert" ON emprestimo_institucional_papiros FOR INSERT WITH CHECK (is_bibliothecarius());
CREATE POLICY "eip_admin_update" ON emprestimo_institucional_papiros FOR UPDATE USING (is_bibliothecarius());
CREATE POLICY "eip_admin_delete" ON emprestimo_institucional_papiros FOR DELETE USING (is_bibliothecarius());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE emprestimos_institucionais;
