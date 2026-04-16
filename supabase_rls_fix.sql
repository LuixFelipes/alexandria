-- ============================================================
-- ALEXANDRIA — RESET E RECONFIGURAÇÃO SEGURA
-- Execute este arquivo no SQL Editor do Supabase
-- Funciona mesmo que as tabelas já existam
-- ============================================================

-- 1. Remover todas as policies antigas (sem erro se não existirem)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('papiros', 'estudiosos', 'concessoes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Criar (ou substituir) a função anti-recursão
CREATE OR REPLACE FUNCTION is_bibliothecarius()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM estudiosos
    WHERE id = auth.uid()
    AND vinculo = 'Bibliothecarius'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Garantir que RLS está ativo
ALTER TABLE papiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiosos ENABLE ROW LEVEL SECURITY;
ALTER TABLE concessoes ENABLE ROW LEVEL SECURITY;

-- 4. Recriar todas as policies corretas

-- PAPIROS
CREATE POLICY "papiros_select_all"   ON papiros FOR SELECT USING (TRUE);
CREATE POLICY "papiros_admin_insert" ON papiros FOR INSERT WITH CHECK (is_bibliothecarius());
CREATE POLICY "papiros_admin_update" ON papiros FOR UPDATE USING (is_bibliothecarius());
CREATE POLICY "papiros_admin_delete" ON papiros FOR DELETE USING (is_bibliothecarius());

-- ESTUDIOSOS (sem recursão)
CREATE POLICY "estudiosos_select"      ON estudiosos FOR SELECT USING (id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "estudiosos_insert_self" ON estudiosos FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "estudiosos_update_self" ON estudiosos FOR UPDATE USING (id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "estudiosos_delete_admin"ON estudiosos FOR DELETE USING (is_bibliothecarius());

-- CONCESSOES
CREATE POLICY "concessoes_select" ON concessoes FOR SELECT USING (estudioso_id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "concessoes_insert" ON concessoes FOR INSERT WITH CHECK (estudioso_id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "concessoes_update" ON concessoes FOR UPDATE USING (estudioso_id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "concessoes_delete" ON concessoes FOR DELETE USING (is_bibliothecarius());

-- 5. Verificar resultado
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('papiros', 'estudiosos', 'concessoes')
ORDER BY tablename, policyname;
