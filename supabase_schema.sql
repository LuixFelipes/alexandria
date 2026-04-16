-- ============================================================
-- BIBLIOTECA DE ALEXANDRIA — ESQUEMA DO BANCO DE DADOS
-- Cole este SQL no SQL Editor do Supabase
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- TABELA: papiros (Livros)
-- ============================================================
CREATE TABLE IF NOT EXISTS papiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  genero TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel' 
    CHECK (status IN ('disponivel', 'emprestado', 'restauro')),
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: estudiosos (Profiles - mapeado ao Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS estudiosos (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  vinculo TEXT NOT NULL DEFAULT 'Estudante'
    CHECK (vinculo IN ('Sábio', 'Escriba', 'Estudante', 'Bibliothecarius')),
  status_pendencia BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: concessoes (Empréstimos)
-- ============================================================
CREATE TABLE IF NOT EXISTS concessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  papiro_id UUID NOT NULL REFERENCES papiros(id) ON DELETE CASCADE,
  estudioso_id UUID NOT NULL REFERENCES estudiosos(id) ON DELETE CASCADE,
  data_retirada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_devolucao_prevista TIMESTAMPTZ NOT NULL,
  devolvido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNÇÃO: criar perfil automaticamente após signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.estudiosos (id, nome_completo, vinculo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Novo Estudioso'),
    COALESCE(NEW.raw_user_meta_data->>'vinculo', 'Estudante')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNÇÃO: verificar atrasos e marcar pendência (Sistema Nuntii)
-- ============================================================
CREATE OR REPLACE FUNCTION verificar_atrasos()
RETURNS void AS $$
BEGIN
  -- Marca como pendente estudiosos com concessões atrasadas
  UPDATE estudiosos
  SET status_pendencia = TRUE
  WHERE id IN (
    SELECT DISTINCT estudioso_id
    FROM concessoes
    WHERE devolvido = FALSE
      AND data_devolucao_prevista < NOW()
  );

  -- Remove pendência de quem regularizou tudo
  UPDATE estudiosos
  SET status_pendencia = FALSE
  WHERE id NOT IN (
    SELECT DISTINCT estudioso_id
    FROM concessoes
    WHERE devolvido = FALSE
      AND data_devolucao_prevista < NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: atualizar status do papiro ao emprestar/devolver
-- ============================================================
CREATE OR REPLACE FUNCTION sync_papiro_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.devolvido = FALSE THEN
    UPDATE papiros SET status = 'emprestado' WHERE id = NEW.papiro_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.devolvido = TRUE THEN
    UPDATE papiros SET status = 'disponivel' WHERE id = NEW.papiro_id;
    -- Re-verificar atrasos após devolução
    PERFORM verificar_atrasos();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_papiro_on_concessao ON concessoes;
CREATE TRIGGER sync_papiro_on_concessao
  AFTER INSERT OR UPDATE ON concessoes
  FOR EACH ROW EXECUTE FUNCTION sync_papiro_status();

-- ============================================================
-- CRON: Roda verificar_atrasos() todo dia às 00:00
-- (Requer extensão pg_cron habilitada no Supabase)
-- ============================================================
-- SELECT cron.schedule('verificar-atrasos-diario', '0 0 * * *', 'SELECT verificar_atrasos()');

-- ============================================================
-- FUNÇÃO HELPER: verifica admin sem recursão (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION is_bibliothecarius()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM estudiosos
    WHERE id = auth.uid()
    AND vinculo = 'Bibliothecarius'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE papiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiosos ENABLE ROW LEVEL SECURITY;
ALTER TABLE concessoes ENABLE ROW LEVEL SECURITY;

-- PAPIROS: todos podem ver, apenas admin insere/edita/deleta
CREATE POLICY "papiros_select_all" ON papiros FOR SELECT USING (TRUE);
CREATE POLICY "papiros_admin_insert" ON papiros FOR INSERT WITH CHECK (is_bibliothecarius());
CREATE POLICY "papiros_admin_update" ON papiros FOR UPDATE USING (is_bibliothecarius());
CREATE POLICY "papiros_admin_delete" ON papiros FOR DELETE USING (is_bibliothecarius());

-- ESTUDIOSOS: sem recursão — usa função SECURITY DEFINER
CREATE POLICY "estudiosos_select" ON estudiosos FOR SELECT
  USING (id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "estudiosos_insert_self" ON estudiosos FOR INSERT
  WITH CHECK (id = auth.uid());
CREATE POLICY "estudiosos_update_self" ON estudiosos FOR UPDATE
  USING (id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "estudiosos_delete_admin" ON estudiosos FOR DELETE
  USING (is_bibliothecarius());

-- CONCESSOES: estudioso vê as próprias, admin vê tudo
CREATE POLICY "concessoes_select" ON concessoes FOR SELECT
  USING (estudioso_id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "concessoes_insert" ON concessoes FOR INSERT
  WITH CHECK (estudioso_id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "concessoes_update" ON concessoes FOR UPDATE
  USING (estudioso_id = auth.uid() OR is_bibliothecarius());
CREATE POLICY "concessoes_delete" ON concessoes FOR DELETE
  USING (is_bibliothecarius());

-- ============================================================
-- HABILITAR REALTIME nas tabelas relevantes
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE papiros;
ALTER PUBLICATION supabase_realtime ADD TABLE concessoes;

-- ============================================================
-- DADOS DE EXEMPLO (opcional)
-- ============================================================
INSERT INTO papiros (titulo, autor, genero, status) VALUES
  ('A República', 'Platão', 'Filosofia', 'disponivel'),
  ('Ilíada', 'Homero', 'Epopeia', 'disponivel'),
  ('Elementos', 'Euclides', 'Matemática', 'disponivel'),
  ('Almagesto', 'Ptolomeu', 'Astronomia', 'restauro'),
  ('Ética a Nicômaco', 'Aristóteles', 'Filosofia', 'disponivel'),
  ('Odisseia', 'Homero', 'Epopeia', 'disponivel'),
  ('Sobre a Natureza das Coisas', 'Lucrécio', 'Poesia', 'disponivel'),
  ('A Arte da Guerra', 'Sun Tzu', 'Estratégia', 'emprestado')
ON CONFLICT DO NOTHING;
