-- Families and Family Members schema
-- This migration creates the core tables with properly designed RLS policies
-- that avoid infinite recursion by keeping policies simple and non-circular.

-- 1) Create families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Create family_members table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT DEFAULT 'Member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- 3) Enable RLS on families table
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- 4) Enable RLS on family_members table
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies for families table
-- Policy: Users can view families they admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'families'
      AND policyname = 'Users can view families they admin'
  ) THEN
    CREATE POLICY "Users can view families they admin"
      ON public.families FOR SELECT
      USING (auth.uid() = admin_user_id);
  END IF;
END $$;

-- Policy: Users can insert families they own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'families'
      AND policyname = 'Users can insert families'
  ) THEN
    CREATE POLICY "Users can insert families"
      ON public.families FOR INSERT
      WITH CHECK (auth.uid() = admin_user_id);
  END IF;
END $$;

-- Policy: Users can update families they admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'families'
      AND policyname = 'Users can update families they admin'
  ) THEN
    CREATE POLICY "Users can update families they admin"
      ON public.families FOR UPDATE
      USING (auth.uid() = admin_user_id)
      WITH CHECK (auth.uid() = admin_user_id);
  END IF;
END $$;

-- 6) RLS Policies for family_members table
-- Policy: Users can view their own member record OR view all members of families they admin
-- This avoids recursion by NOT checking family_members in the policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'family_members'
      AND policyname = 'Users can view their own records or admin records'
  ) THEN
    CREATE POLICY "Users can view their own records or admin records"
      ON public.family_members FOR SELECT
      USING (
        user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.families
          WHERE public.families.id = family_id
          AND public.families.admin_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: Users can insert family members to families they admin
-- Check the families table directly without RLS to avoid recursion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'family_members'
      AND policyname = 'Users can insert family members to their families'
  ) THEN
    CREATE POLICY "Users can insert family members to their families"
      ON public.family_members FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.families
          WHERE public.families.id = family_id
          AND public.families.admin_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: Users can update their own member record or admins can update any member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'family_members'
      AND policyname = 'Users can update family members'
  ) THEN
    CREATE POLICY "Users can update family members"
      ON public.family_members FOR UPDATE
      USING (
        user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.families
          WHERE public.families.id = family_id
          AND public.families.admin_user_id = auth.uid()
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.families
          WHERE public.families.id = family_id
          AND public.families.admin_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 7) Triggers for updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_families_updated_at'
  ) THEN
    CREATE TRIGGER update_families_updated_at
    BEFORE UPDATE ON public.families
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_family_members_updated_at'
  ) THEN
    CREATE TRIGGER update_family_members_updated_at
    BEFORE UPDATE ON public.family_members
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
  END IF;
END $$;

-- 8) Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_families_admin_user_id ON public.families(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_families_invite_code ON public.families(invite_code);
