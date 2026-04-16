-- ============================================================
-- FIX: Nome de usuário no cadastro (Trocar "Novo Estudioso")
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.estudiosos (id, nome_completo, vinculo)
  VALUES (
    NEW.id,
    -- Se não houver nome_completo na meta_data, usa a parte do e-mail antes do @
    COALESCE(
      NEW.raw_user_meta_data->>'nome_completo', 
      SPLIT_PART(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'vinculo', 'Estudante')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
