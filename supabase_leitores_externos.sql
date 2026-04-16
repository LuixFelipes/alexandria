-- ============================================================
-- MIGRAÇÃO: Leitores Externos (sem conta no sistema)
-- Cole este SQL no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de leitores externos (nome, CPF, endereço, telefone — sem auth)
CREATE TABLE IF NOT EXISTS leitores_externos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_completo TEXT NOT NULL,
  cpf           TEXT,
  endereco      TEXT,
  telefone      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar coluna leitor_externo_id em concessoes
ALTER TABLE concessoes
  ADD COLUMN IF NOT EXISTS leitor_externo_id UUID
    REFERENCES leitores_externos(id) ON DELETE SET NULL;

-- 3. Tornar estudioso_id nullable (leitores externos não têm conta)
ALTER TABLE concessoes
  ALTER COLUMN estudioso_id DROP NOT NULL;

-- 4. Garantir que pelo menos um dos dois é preenchido
ALTER TABLE concessoes
  DROP CONSTRAINT IF EXISTS check_leitor;

ALTER TABLE concessoes
  ADD CONSTRAINT check_leitor CHECK (
    estudioso_id IS NOT NULL OR leitor_externo_id IS NOT NULL
  );

-- 5. Corrigir verificar_atrasos() para ignorar linhas sem estudioso_id
CREATE OR REPLACE FUNCTION verificar_atrasos()
RETURNS void AS $$
BEGIN
  UPDATE estudiosos
  SET status_pendencia = TRUE
  WHERE id IN (
    SELECT DISTINCT estudioso_id
    FROM concessoes
    WHERE devolvido = FALSE
      AND data_devolucao_prevista < NOW()
      AND estudioso_id IS NOT NULL
  );

  UPDATE estudiosos
  SET status_pendencia = FALSE
  WHERE id NOT IN (
    SELECT DISTINCT estudioso_id
    FROM concessoes
    WHERE devolvido = FALSE
      AND data_devolucao_prevista < NOW()
      AND estudioso_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS para leitores_externos (somente admin)
ALTER TABLE leitores_externos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "le_select" ON leitores_externos;
DROP POLICY IF EXISTS "le_insert" ON leitores_externos;
DROP POLICY IF EXISTS "le_update" ON leitores_externos;
DROP POLICY IF EXISTS "le_delete" ON leitores_externos;

CREATE POLICY "le_select" ON leitores_externos FOR SELECT USING (is_bibliothecarius());
CREATE POLICY "le_insert" ON leitores_externos FOR INSERT WITH CHECK (is_bibliothecarius());
CREATE POLICY "le_update" ON leitores_externos FOR UPDATE USING (is_bibliothecarius());
CREATE POLICY "le_delete" ON leitores_externos FOR DELETE USING (is_bibliothecarius());

-- 7. Atualizar políticas de concessoes para lidar com estudioso_id nullable
DROP POLICY IF EXISTS "concessoes_select" ON concessoes;
DROP POLICY IF EXISTS "concessoes_insert" ON concessoes;
DROP POLICY IF EXISTS "concessoes_update" ON concessoes;

CREATE POLICY "concessoes_select" ON concessoes FOR SELECT
  USING (
    (estudioso_id IS NOT NULL AND estudioso_id = auth.uid())
    OR is_bibliothecarius()
  );

CREATE POLICY "concessoes_insert" ON concessoes FOR INSERT
  WITH CHECK (
    (estudioso_id = auth.uid() AND leitor_externo_id IS NULL)
    OR is_bibliothecarius()
  );

CREATE POLICY "concessoes_update" ON concessoes FOR UPDATE
  USING (
    (estudioso_id IS NOT NULL AND estudioso_id = auth.uid())
    OR is_bibliothecarius()
  );

-- 8. Realtime para leitores_externos
ALTER PUBLICATION supabase_realtime ADD TABLE leitores_externos;
