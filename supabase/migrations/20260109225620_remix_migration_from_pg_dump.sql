CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'manager',
    'user'
);


--
-- Name: generate_activation_key(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_activation_key() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..4 LOOP
    IF i > 1 THEN
      result := result || '-';
    END IF;
    FOR j IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  RETURN result;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: activation_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activation_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_value text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    duration_days integer DEFAULT 30 NOT NULL,
    hwid text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_hwid_reset_at timestamp with time zone,
    hwid_reset_count_today integer DEFAULT 0 NOT NULL,
    last_reset_date date,
    created_by uuid,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone
);


--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    admin_username text NOT NULL,
    action_type text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'admin'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    license_quota integer DEFAULT 0,
    licenses_created integer DEFAULT 0
);


--
-- Name: hwid_reset_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hwid_reset_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activation_key_id uuid NOT NULL,
    reset_by text NOT NULL,
    reset_at timestamp with time zone DEFAULT now() NOT NULL,
    days_deducted integer DEFAULT 0 NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL
);


--
-- Name: activation_keys activation_keys_key_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_key_value_key UNIQUE (key_value);


--
-- Name: activation_keys activation_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_pkey PRIMARY KEY (id);


--
-- Name: activation_keys activation_keys_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activation_keys
    ADD CONSTRAINT activation_keys_username_key UNIQUE (username);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: admin_accounts admin_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_accounts admin_accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_username_key UNIQUE (username);


--
-- Name: hwid_reset_log hwid_reset_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hwid_reset_log
    ADD CONSTRAINT hwid_reset_log_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: hwid_reset_log hwid_reset_log_activation_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hwid_reset_log
    ADD CONSTRAINT hwid_reset_log_activation_key_id_fkey FOREIGN KEY (activation_key_id) REFERENCES public.activation_keys(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: activation_keys Allow delete for all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for all" ON public.activation_keys FOR DELETE USING (true);


--
-- Name: activity_log Allow insert activity_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert activity_log" ON public.activity_log FOR INSERT WITH CHECK (true);


--
-- Name: admin_accounts Allow insert for admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for admin" ON public.admin_accounts FOR INSERT WITH CHECK (true);


--
-- Name: activation_keys Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.activation_keys FOR INSERT WITH CHECK (true);


--
-- Name: hwid_reset_log Allow insert hwid log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert hwid log" ON public.hwid_reset_log FOR INSERT WITH CHECK (true);


--
-- Name: admin_accounts Allow public read for admin login; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read for admin login" ON public.admin_accounts FOR SELECT USING (true);


--
-- Name: activation_keys Allow public read for login; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read for login" ON public.activation_keys FOR SELECT USING (true);


--
-- Name: activity_log Allow read activity_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read activity_log" ON public.activity_log FOR SELECT USING (true);


--
-- Name: hwid_reset_log Allow read hwid log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read hwid log" ON public.hwid_reset_log FOR SELECT USING (true);


--
-- Name: user_roles Allow read user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read user_roles" ON public.user_roles FOR SELECT USING (true);


--
-- Name: admin_accounts Allow update for admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for admin" ON public.admin_accounts FOR UPDATE USING (true);


--
-- Name: activation_keys Allow update for all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for all" ON public.activation_keys FOR UPDATE USING (true);


--
-- Name: activation_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: hwid_reset_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hwid_reset_log ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;