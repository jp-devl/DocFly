CREATE TABLE public.modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  arquivo_nome TEXT,
  arquivo_path TEXT,
  estrutura JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.modelos TO authenticated;
GRANT ALL ON public.modelos TO service_role;
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam seus modelos" ON public.modelos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.fichas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modelo_id UUID NOT NULL REFERENCES public.modelos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL DEFAULT 'Ficha sem título',
  valores JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fichas TO authenticated;
GRANT ALL ON public.fichas TO service_role;
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam suas fichas" ON public.fichas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_modelos_user ON public.modelos(user_id, created_at DESC);
CREATE INDEX idx_fichas_user ON public.fichas(user_id, created_at DESC);
CREATE INDEX idx_fichas_modelo ON public.fichas(modelo_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_modelos_updated BEFORE UPDATE ON public.modelos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_fichas_updated BEFORE UPDATE ON public.fichas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();