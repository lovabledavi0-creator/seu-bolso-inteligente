
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profissao text,
  ADD COLUMN IF NOT EXISTS idade integer;

ALTER TABLE public.investimentos
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'acao_br',
  ADD COLUMN IF NOT EXISTS moeda text NOT NULL DEFAULT 'BRL';
