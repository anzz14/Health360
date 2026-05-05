create table public.families (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  invite_code text not null,
  avatar_url text null,
  admin_profile_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint families_pkey primary key (id),
  constraint families_invite_code_key unique (invite_code),
  constraint families_admin_profile_fkey foreign KEY (admin_profile_id) references profiles (id)
) TABLESPACE pg_default;

-- Ensure admin_profile_id references profiles.id (profile must exist)

-- If you need the matching profiles table, example DDL (may already exist in your DB):
-- create table public.profiles (
--   id uuid not null default extensions.uuid_generate_v4 (),
--   auth_user_id uuid null,
--   full_name text not null,
--   dob date null,
--   gender public.gender_type null,
--   blood_group public.blood_group_type null,
--   height_cm numeric null,
--   weight_kg numeric null,
--   medical_notes text null,
--   conditions text[] not null default '{}'::text[],
--   avatar_url text null,
--   created_at timestamp with time zone null default now(),
--   updated_at timestamp with time zone null default now(),
--   constraint profiles_pkey primary key (id),
--   constraint profiles_auth_user_id_key unique (auth_user_id),
--   constraint profiles_auth_user_fkey foreign KEY (auth_user_id) references auth.users (id) on delete set null
-- ) TABLESPACE pg_default;
--
-- create trigger profiles_updated_at BEFORE
-- update on profiles for EACH row
-- execute FUNCTION update_updated_at ();