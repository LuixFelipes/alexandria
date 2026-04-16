-- ============================================================
-- ATUALIZAÇÃO: adicionar descrição e ISBN à tabela papiros
-- Cole este SQL no SQL Editor do Supabase
-- ============================================================

ALTER TABLE papiros
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS isbn TEXT;

-- Índice para busca por ISBN
CREATE INDEX IF NOT EXISTS idx_papiros_isbn ON papiros (isbn);
