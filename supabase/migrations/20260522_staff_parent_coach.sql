-- Migration: Ajout de la relation coach adjoint -> coach principal
-- Date: 2026-05-22
-- Description: Ajoute la colonne parent_coach_id pour lier un entraineur adjoint a son entraineur principal

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS parent_coach_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.staff.parent_coach_id IS 'Reference du coach principal pour les coachs adjoints';
