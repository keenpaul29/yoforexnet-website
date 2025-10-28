--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: prevent_journal_modifications(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.prevent_journal_modifications() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'Journal entries are immutable and cannot be modified or deleted';
END;
$$;


ALTER FUNCTION public.prevent_journal_modifications() OWNER TO neondb_owner;

--
-- Name: update_wallet_balance(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.update_wallet_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Lock wallet row for update
  SELECT balance INTO current_balance
  FROM user_wallet
  WHERE wallet_id = NEW.wallet_id
  FOR UPDATE;

  -- Validate balance_before matches current balance
  IF NEW.balance_before <> current_balance THEN
    RAISE EXCEPTION 'Balance mismatch: expected %, got %', current_balance, NEW.balance_before;
  END IF;

  -- Calculate new balance based on direction
  IF NEW.direction = 'credit' THEN
    new_balance := current_balance + NEW.amount;
  ELSIF NEW.direction = 'debit' THEN
    new_balance := current_balance - NEW.amount;
  ELSE
    RAISE EXCEPTION 'Invalid direction: %', NEW.direction;
  END IF;

  -- Validate balance_after matches calculation
  IF NEW.balance_after <> new_balance THEN
    RAISE EXCEPTION 'Balance calculation error: expected %, got %', new_balance, NEW.balance_after;
  END IF;

  -- Prevent overdraft
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Overdraft prevented: wallet % would have balance %', NEW.wallet_id, new_balance;
  END IF;

  -- Update wallet balance
  UPDATE user_wallet
  SET balance = new_balance, updated_at = NOW()
  WHERE wallet_id = NEW.wallet_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_wallet_balance() OWNER TO neondb_owner;

--
-- Name: validate_balanced_ledger(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.validate_balanced_ledger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  entry_count INTEGER;
  total_signed INTEGER;
BEGIN
  -- Only validate on transition to 'closed'
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status <> 'closed') THEN
    -- Count entries
    SELECT COUNT(*) INTO entry_count
    FROM coin_journal_entries
    WHERE ledger_transaction_id = NEW.id;

    -- Require at least 2 entries
    IF entry_count < 2 THEN
      RAISE EXCEPTION 'Ledger transaction % must have at least 2 entries, found %', NEW.id, entry_count;
    END IF;

    -- Calculate sum with direction signs
    SELECT SUM(
      CASE
        WHEN direction = 'credit' THEN amount
        WHEN direction = 'debit' THEN -amount
      END
    ) INTO total_signed
    FROM coin_journal_entries
    WHERE ledger_transaction_id = NEW.id;

    -- Ensure balanced (sum = 0)
    IF total_signed <> 0 THEN
      RAISE EXCEPTION 'Ledger transaction % is unbalanced: sum = %', NEW.id, total_signed;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.validate_balanced_ledger() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ab_tests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ab_tests (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    variants jsonb[] DEFAULT '{}'::jsonb[],
    traffic_allocation jsonb NOT NULL,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    winner_variant character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ab_tests OWNER TO neondb_owner;

--
-- Name: ab_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ab_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ab_tests_id_seq OWNER TO neondb_owner;

--
-- Name: ab_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ab_tests_id_seq OWNED BY public.ab_tests.id;


--
-- Name: achievements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    icon character varying(50) NOT NULL,
    requirement integer NOT NULL,
    category character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.achievements OWNER TO neondb_owner;

--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.achievements_id_seq OWNER TO neondb_owner;

--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: activity_feed; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_feed (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    activity_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_feed OWNER TO neondb_owner;

--
-- Name: admin_actions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_actions (
    id integer NOT NULL,
    admin_id character varying NOT NULL,
    action_type character varying NOT NULL,
    target_type character varying NOT NULL,
    target_id character varying,
    details jsonb,
    ip_address character varying,
    user_agent character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_actions OWNER TO neondb_owner;

--
-- Name: admin_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admin_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_actions_id_seq OWNER TO neondb_owner;

--
-- Name: admin_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admin_actions_id_seq OWNED BY public.admin_actions.id;


--
-- Name: admin_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_roles (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    role character varying NOT NULL,
    permissions jsonb NOT NULL,
    granted_by character varying NOT NULL,
    granted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_roles OWNER TO neondb_owner;

--
-- Name: admin_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admin_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_roles_id_seq OWNER TO neondb_owner;

--
-- Name: admin_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admin_roles_id_seq OWNED BY public.admin_roles.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying NOT NULL,
    content text NOT NULL,
    type character varying DEFAULT 'info'::character varying NOT NULL,
    target_audience character varying DEFAULT 'all'::character varying NOT NULL,
    segment_id integer,
    display_type character varying DEFAULT 'banner'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.announcements OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    key character varying NOT NULL,
    name character varying NOT NULL,
    user_id character varying NOT NULL,
    permissions text[] DEFAULT '{}'::text[],
    rate_limit integer DEFAULT 60 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_used timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_keys OWNER TO neondb_owner;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_keys_id_seq OWNER TO neondb_owner;

--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.automation_rules (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    trigger_type character varying NOT NULL,
    trigger_config jsonb NOT NULL,
    action_type character varying NOT NULL,
    action_config jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    execution_count integer DEFAULT 0 NOT NULL,
    last_executed timestamp without time zone,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.automation_rules OWNER TO neondb_owner;

--
-- Name: automation_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.automation_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.automation_rules_id_seq OWNER TO neondb_owner;

--
-- Name: automation_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.automation_rules_id_seq OWNED BY public.automation_rules.id;


--
-- Name: broker_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.broker_reviews (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    broker_id character varying NOT NULL,
    user_id character varying NOT NULL,
    rating integer NOT NULL,
    review_title text NOT NULL,
    review_body text NOT NULL,
    is_scam_report boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    date_posted timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.broker_reviews OWNER TO neondb_owner;

--
-- Name: brokers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.brokers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    website_url text,
    logo_url text,
    year_founded integer,
    regulation text,
    regulation_summary text,
    platform text,
    spread_type text,
    min_spread numeric(10,2),
    overall_rating integer DEFAULT 0,
    review_count integer DEFAULT 0 NOT NULL,
    scam_report_count integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.brokers OWNER TO neondb_owner;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying(200) NOT NULL,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    discount_percent integer,
    discount_code character varying(50),
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    uses integer DEFAULT 0 NOT NULL,
    revenue integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.campaigns OWNER TO neondb_owner;

--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaigns_id_seq OWNER TO neondb_owner;

--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: coin_journal_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coin_journal_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    ledger_transaction_id character varying NOT NULL,
    wallet_id character varying NOT NULL,
    direction text NOT NULL,
    amount integer NOT NULL,
    balance_before integer NOT NULL,
    balance_after integer NOT NULL,
    memo text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_amount_positive CHECK ((amount > 0))
);


ALTER TABLE public.coin_journal_entries OWNER TO neondb_owner;

--
-- Name: coin_ledger_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coin_ledger_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    type text NOT NULL,
    context json,
    external_ref text,
    initiator_user_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    closed_at timestamp without time zone,
    status text DEFAULT 'pending'::text NOT NULL
);


ALTER TABLE public.coin_ledger_transactions OWNER TO neondb_owner;

--
-- Name: coin_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coin_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.coin_transactions OWNER TO neondb_owner;

--
-- Name: content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    author_id character varying NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price_coins integer DEFAULT 0 NOT NULL,
    is_free boolean DEFAULT true NOT NULL,
    category text NOT NULL,
    platform text,
    version text,
    tags text[],
    files jsonb,
    images jsonb,
    broker_compat text[],
    min_deposit integer,
    hedging boolean,
    changelog text,
    license text,
    equity_curve_image text,
    profit_factor integer,
    drawdown_percent integer,
    win_percent integer,
    broker text,
    months_tested integer,
    file_url text,
    image_url text,
    image_urls text[],
    post_logo_url text,
    views integer DEFAULT 0 NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    average_rating integer,
    review_count integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    slug text NOT NULL,
    focus_keyword text,
    auto_meta_description text,
    auto_image_alt_texts text[],
    sales_score integer DEFAULT 0 NOT NULL,
    last_sales_update timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content OWNER TO neondb_owner;

--
-- Name: content_likes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_likes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    content_id character varying NOT NULL,
    user_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_likes OWNER TO neondb_owner;

--
-- Name: content_purchases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_purchases (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    content_id character varying NOT NULL,
    buyer_id character varying NOT NULL,
    seller_id character varying NOT NULL,
    price_coins integer NOT NULL,
    transaction_id character varying NOT NULL,
    purchased_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_purchases OWNER TO neondb_owner;

--
-- Name: content_replies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_replies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    content_id character varying NOT NULL,
    user_id character varying NOT NULL,
    parent_id character varying,
    body text NOT NULL,
    rating integer,
    image_urls text[],
    helpful integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_replies OWNER TO neondb_owner;

--
-- Name: content_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_reviews (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    content_id character varying NOT NULL,
    user_id character varying NOT NULL,
    rating integer NOT NULL,
    review text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reward_given boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_reviews OWNER TO neondb_owner;

--
-- Name: content_revisions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.content_revisions (
    id integer NOT NULL,
    content_type character varying NOT NULL,
    content_id character varying NOT NULL,
    revision_number integer NOT NULL,
    data jsonb NOT NULL,
    changed_fields text[] DEFAULT '{}'::text[],
    changed_by character varying NOT NULL,
    change_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.content_revisions OWNER TO neondb_owner;

--
-- Name: content_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.content_revisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.content_revisions_id_seq OWNER TO neondb_owner;

--
-- Name: content_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.content_revisions_id_seq OWNED BY public.content_revisions.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    participant1_id character varying NOT NULL,
    participant2_id character varying NOT NULL,
    last_message_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.conversations OWNER TO neondb_owner;

--
-- Name: daily_activity_limits; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.daily_activity_limits (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    activity_date timestamp without time zone DEFAULT now() NOT NULL,
    replies_count integer DEFAULT 0 NOT NULL,
    reports_count integer DEFAULT 0 NOT NULL,
    backtests_count integer DEFAULT 0 NOT NULL,
    last_checkin_at timestamp without time zone,
    consecutive_days integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_activity_limits OWNER TO neondb_owner;

--
-- Name: dashboard_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.dashboard_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    widget_order text[] NOT NULL,
    enabled_widgets text[] NOT NULL,
    layout_type text DEFAULT 'default'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dashboard_preferences OWNER TO neondb_owner;

--
-- Name: dashboard_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.dashboard_settings (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    layout json,
    theme character varying(20) DEFAULT 'light'::character varying,
    auto_refresh boolean DEFAULT true,
    refresh_interval integer DEFAULT 30,
    favorites json,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dashboard_settings OWNER TO neondb_owner;

--
-- Name: dashboard_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.dashboard_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dashboard_settings_id_seq OWNER TO neondb_owner;

--
-- Name: dashboard_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.dashboard_settings_id_seq OWNED BY public.dashboard_settings.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    template_key character varying NOT NULL,
    subject character varying NOT NULL,
    html_body text NOT NULL,
    text_body text NOT NULL,
    variables text[] DEFAULT '{}'::text[],
    category character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_by character varying,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_templates OWNER TO neondb_owner;

--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_templates_id_seq OWNER TO neondb_owner;

--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feature_flags (
    id integer NOT NULL,
    flag_key character varying NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    rollout_percentage integer DEFAULT 0 NOT NULL,
    target_users text[] DEFAULT '{}'::text[],
    target_segments integer[] DEFAULT '{}'::integer[],
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feature_flags OWNER TO neondb_owner;

--
-- Name: feature_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feature_flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feature_flags_id_seq OWNER TO neondb_owner;

--
-- Name: feature_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feature_flags_id_seq OWNED BY public.feature_flags.id;


--
-- Name: forum_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.forum_categories (
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    color text DEFAULT 'bg-primary'::text NOT NULL,
    thread_count integer DEFAULT 0 NOT NULL,
    post_count integer DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    parent_slug text
);


ALTER TABLE public.forum_categories OWNER TO neondb_owner;

--
-- Name: forum_replies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.forum_replies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    thread_id character varying NOT NULL,
    user_id character varying NOT NULL,
    parent_id character varying,
    body text NOT NULL,
    slug text NOT NULL,
    meta_description text,
    image_urls text[],
    helpful integer DEFAULT 0 NOT NULL,
    is_accepted boolean DEFAULT false NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.forum_replies OWNER TO neondb_owner;

--
-- Name: forum_threads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.forum_threads (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    author_id character varying NOT NULL,
    category_slug text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    slug text NOT NULL,
    focus_keyword text,
    meta_description text,
    is_pinned boolean DEFAULT false NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    is_solved boolean DEFAULT false NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    reply_count integer DEFAULT 0 NOT NULL,
    last_activity_at timestamp without time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'approved'::text NOT NULL,
    engagement_score integer DEFAULT 0 NOT NULL,
    last_score_update timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    subcategory_slug text,
    thread_type text DEFAULT 'discussion'::text NOT NULL,
    seo_excerpt text,
    primary_keyword text,
    language text DEFAULT 'en'::text NOT NULL,
    instruments text[] DEFAULT '{}'::text[],
    timeframes text[] DEFAULT '{}'::text[],
    strategies text[] DEFAULT '{}'::text[],
    platform text,
    broker text,
    risk_note text,
    hashtags text[] DEFAULT '{}'::text[],
    review_target text,
    review_version text,
    review_rating integer,
    review_pros text[],
    review_cons text[],
    question_summary text,
    accepted_answer_id character varying,
    attachment_urls text[] DEFAULT '{}'::text[],
    like_count integer DEFAULT 0 NOT NULL,
    bookmark_count integer DEFAULT 0 NOT NULL,
    share_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.forum_threads OWNER TO neondb_owner;

--
-- Name: goals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    goal_type character varying(50) NOT NULL,
    target_value integer NOT NULL,
    current_value integer DEFAULT 0 NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.goals OWNER TO neondb_owner;

--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goals_id_seq OWNER TO neondb_owner;

--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: ip_bans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ip_bans (
    id integer NOT NULL,
    ip_address character varying NOT NULL,
    reason text NOT NULL,
    ban_type character varying DEFAULT 'permanent'::character varying NOT NULL,
    expires_at timestamp without time zone,
    banned_by character varying NOT NULL,
    banned_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.ip_bans OWNER TO neondb_owner;

--
-- Name: ip_bans_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.ip_bans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ip_bans_id_seq OWNER TO neondb_owner;

--
-- Name: ip_bans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.ip_bans_id_seq OWNED BY public.ip_bans.id;


--
-- Name: ledger_reconciliation_runs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ledger_reconciliation_runs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    status text NOT NULL,
    drift_count integer DEFAULT 0 NOT NULL,
    max_delta integer DEFAULT 0 NOT NULL,
    report json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.ledger_reconciliation_runs OWNER TO neondb_owner;

--
-- Name: media_library; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.media_library (
    id integer NOT NULL,
    filename character varying NOT NULL,
    original_filename character varying NOT NULL,
    file_path character varying NOT NULL,
    file_size integer NOT NULL,
    mime_type character varying NOT NULL,
    width integer,
    height integer,
    alt_text character varying,
    tags text[] DEFAULT '{}'::text[],
    uploaded_by character varying NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.media_library OWNER TO neondb_owner;

--
-- Name: media_library_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.media_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_library_id_seq OWNER TO neondb_owner;

--
-- Name: media_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.media_library_id_seq OWNED BY public.media_library.id;


--
-- Name: message_reactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_reactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    message_id character varying NOT NULL,
    user_id character varying NOT NULL,
    emoji character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.message_reactions OWNER TO neondb_owner;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying NOT NULL,
    sender_id character varying NOT NULL,
    recipient_id character varying NOT NULL,
    body text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    delivered_at timestamp without time zone,
    read_at timestamp without time zone
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: moderation_queue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.moderation_queue (
    id integer NOT NULL,
    content_type character varying NOT NULL,
    content_id character varying NOT NULL,
    author_id character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    priority_score integer DEFAULT 0 NOT NULL,
    spam_score numeric(3,2),
    sentiment_score numeric(3,2),
    flagged_reasons text[] DEFAULT '{}'::text[],
    reviewed_by character varying,
    reviewed_at timestamp without time zone,
    review_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.moderation_queue OWNER TO neondb_owner;

--
-- Name: moderation_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.moderation_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.moderation_queue_id_seq OWNER TO neondb_owner;

--
-- Name: moderation_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.moderation_queue_id_seq OWNED BY public.moderation_queue.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    action_url text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.performance_metrics (
    id integer NOT NULL,
    metric_type character varying NOT NULL,
    metric_name character varying NOT NULL,
    value numeric(10,2) NOT NULL,
    unit character varying NOT NULL,
    metadata jsonb,
    recorded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.performance_metrics OWNER TO neondb_owner;

--
-- Name: performance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.performance_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_metrics_id_seq OWNER TO neondb_owner;

--
-- Name: performance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.performance_metrics_id_seq OWNED BY public.performance_metrics.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    cover_photo text,
    bio text,
    trading_level character varying(50),
    trading_style json,
    trading_platform json,
    trading_since date,
    specialties json,
    telegram character varying(100),
    discord character varying(100),
    twitter character varying(100),
    youtube character varying(200),
    tradingview character varying(200),
    website character varying(200),
    profile_layout character varying(20) DEFAULT 'professional'::character varying,
    custom_slug character varying(100),
    is_public boolean DEFAULT true,
    is_premium boolean DEFAULT false,
    brand_colors json,
    show_revenue boolean DEFAULT true,
    show_sales boolean DEFAULT true,
    show_followers boolean DEFAULT true,
    show_activity boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profiles OWNER TO neondb_owner;

--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profiles_id_seq OWNER TO neondb_owner;

--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: recharge_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recharge_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    coin_amount integer NOT NULL,
    price_usd integer NOT NULL,
    payment_method text NOT NULL,
    payment_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.recharge_orders OWNER TO neondb_owner;

--
-- Name: referrals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.referrals (
    id integer NOT NULL,
    referrer_id character varying NOT NULL,
    referred_user_id character varying NOT NULL,
    referral_code character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    total_earnings integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.referrals OWNER TO neondb_owner;

--
-- Name: referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referrals_id_seq OWNER TO neondb_owner;

--
-- Name: referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;


--
-- Name: reported_content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reported_content (
    id integer NOT NULL,
    reporter_id character varying NOT NULL,
    content_type character varying NOT NULL,
    content_id character varying NOT NULL,
    report_reason character varying NOT NULL,
    description text NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    assigned_to character varying,
    resolution text,
    action_taken character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone
);


ALTER TABLE public.reported_content OWNER TO neondb_owner;

--
-- Name: reported_content_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.reported_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reported_content_id_seq OWNER TO neondb_owner;

--
-- Name: reported_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.reported_content_id_seq OWNED BY public.reported_content.id;


--
-- Name: scheduled_jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.scheduled_jobs (
    id integer NOT NULL,
    job_key character varying NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    schedule character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_run timestamp without time zone,
    next_run timestamp without time zone,
    last_status character varying,
    last_error text,
    execution_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.scheduled_jobs OWNER TO neondb_owner;

--
-- Name: scheduled_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.scheduled_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scheduled_jobs_id_seq OWNER TO neondb_owner;

--
-- Name: scheduled_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.scheduled_jobs_id_seq OWNED BY public.scheduled_jobs.id;


--
-- Name: security_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.security_events (
    id integer NOT NULL,
    event_type character varying NOT NULL,
    severity character varying NOT NULL,
    user_id character varying,
    ip_address character varying NOT NULL,
    details jsonb NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_by character varying,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.security_events OWNER TO neondb_owner;

--
-- Name: security_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.security_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_events_id_seq OWNER TO neondb_owner;

--
-- Name: security_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.security_events_id_seq OWNED BY public.security_events.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_tickets (
    id integer NOT NULL,
    ticket_number character varying NOT NULL,
    user_id character varying NOT NULL,
    subject character varying NOT NULL,
    description text NOT NULL,
    status character varying DEFAULT 'open'::character varying NOT NULL,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    category character varying NOT NULL,
    assigned_to character varying,
    replies jsonb[] DEFAULT '{}'::jsonb[],
    tags text[] DEFAULT '{}'::text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone
);


ALTER TABLE public.support_tickets OWNER TO neondb_owner;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.support_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_tickets_id_seq OWNER TO neondb_owner;

--
-- Name: support_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.support_tickets_id_seq OWNED BY public.support_tickets.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    setting_key character varying NOT NULL,
    setting_value jsonb NOT NULL,
    category character varying NOT NULL,
    description text,
    updated_by character varying,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO neondb_owner;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO neondb_owner;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    achievement_id integer NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    unlocked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_achievements OWNER TO neondb_owner;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_achievements_id_seq OWNER TO neondb_owner;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_badges (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    badge_type text NOT NULL,
    awarded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_badges OWNER TO neondb_owner;

--
-- Name: user_follows; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_follows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    follower_id character varying NOT NULL,
    following_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_follows OWNER TO neondb_owner;

--
-- Name: user_segments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_segments (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text NOT NULL,
    rules jsonb NOT NULL,
    user_count integer DEFAULT 0 NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_segments OWNER TO neondb_owner;

--
-- Name: user_segments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_segments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_segments_id_seq OWNER TO neondb_owner;

--
-- Name: user_segments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_segments_id_seq OWNED BY public.user_segments.id;


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_settings (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    notification_preferences json,
    privacy_settings json,
    display_settings json,
    communication_settings json,
    publishing_defaults json,
    advanced_settings json,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_settings OWNER TO neondb_owner;

--
-- Name: user_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_settings_id_seq OWNER TO neondb_owner;

--
-- Name: user_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_settings_id_seq OWNED BY public.user_settings.id;


--
-- Name: user_wallet; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_wallet (
    wallet_id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    available_balance integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_wallet OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    total_coins integer DEFAULT 0 NOT NULL,
    weekly_earned integer DEFAULT 0 NOT NULL,
    rank integer,
    youtube_url text,
    instagram_handle text,
    telegram_handle text,
    myfxbook_link text,
    investor_id text,
    investor_password text,
    is_verified_trader boolean DEFAULT false NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    has_youtube_reward boolean DEFAULT false NOT NULL,
    has_myfxbook_reward boolean DEFAULT false NOT NULL,
    has_investor_reward boolean DEFAULT false NOT NULL,
    badges text[] DEFAULT '{}'::text[],
    onboarding_completed boolean DEFAULT false,
    onboarding_dismissed boolean DEFAULT false,
    onboarding_progress json DEFAULT '{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}'::json,
    reputation_score integer DEFAULT 0 NOT NULL,
    last_reputation_update timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    location character varying(100),
    CONSTRAINT chk_user_coins_nonnegative CHECK ((total_coins >= 0))
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.webhooks (
    id integer NOT NULL,
    url character varying NOT NULL,
    events text[] DEFAULT '{}'::text[],
    secret character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_triggered timestamp without time zone,
    success_count integer DEFAULT 0 NOT NULL,
    failure_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.webhooks OWNER TO neondb_owner;

--
-- Name: webhooks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.webhooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhooks_id_seq OWNER TO neondb_owner;

--
-- Name: webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.webhooks_id_seq OWNED BY public.webhooks.id;


--
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.withdrawal_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    amount integer NOT NULL,
    crypto_type text NOT NULL,
    wallet_address text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    exchange_rate numeric(20,8) NOT NULL,
    crypto_amount numeric(20,8) NOT NULL,
    processing_fee integer NOT NULL,
    transaction_hash text,
    admin_notes text,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    processed_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_withdrawal_amount_min CHECK ((amount >= 1000))
);


ALTER TABLE public.withdrawal_requests OWNER TO neondb_owner;

--
-- Name: ab_tests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ab_tests ALTER COLUMN id SET DEFAULT nextval('public.ab_tests_id_seq'::regclass);


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: admin_actions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_actions ALTER COLUMN id SET DEFAULT nextval('public.admin_actions_id_seq'::regclass);


--
-- Name: admin_roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_roles ALTER COLUMN id SET DEFAULT nextval('public.admin_roles_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: automation_rules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_rules ALTER COLUMN id SET DEFAULT nextval('public.automation_rules_id_seq'::regclass);


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: content_revisions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_revisions ALTER COLUMN id SET DEFAULT nextval('public.content_revisions_id_seq'::regclass);


--
-- Name: dashboard_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dashboard_settings ALTER COLUMN id SET DEFAULT nextval('public.dashboard_settings_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: feature_flags id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags ALTER COLUMN id SET DEFAULT nextval('public.feature_flags_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: ip_bans id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ip_bans ALTER COLUMN id SET DEFAULT nextval('public.ip_bans_id_seq'::regclass);


--
-- Name: media_library id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.media_library ALTER COLUMN id SET DEFAULT nextval('public.media_library_id_seq'::regclass);


--
-- Name: moderation_queue id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.moderation_queue ALTER COLUMN id SET DEFAULT nextval('public.moderation_queue_id_seq'::regclass);


--
-- Name: performance_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_metrics ALTER COLUMN id SET DEFAULT nextval('public.performance_metrics_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: referrals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);


--
-- Name: reported_content id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reported_content ALTER COLUMN id SET DEFAULT nextval('public.reported_content_id_seq'::regclass);


--
-- Name: scheduled_jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_jobs ALTER COLUMN id SET DEFAULT nextval('public.scheduled_jobs_id_seq'::regclass);


--
-- Name: security_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_events ALTER COLUMN id SET DEFAULT nextval('public.security_events_id_seq'::regclass);


--
-- Name: support_tickets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN id SET DEFAULT nextval('public.support_tickets_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: user_segments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_segments ALTER COLUMN id SET DEFAULT nextval('public.user_segments_id_seq'::regclass);


--
-- Name: user_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings ALTER COLUMN id SET DEFAULT nextval('public.user_settings_id_seq'::regclass);


--
-- Name: webhooks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhooks ALTER COLUMN id SET DEFAULT nextval('public.webhooks_id_seq'::regclass);


--
-- Data for Name: ab_tests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ab_tests (id, name, description, variants, traffic_allocation, status, start_date, end_date, winner_variant, created_by, created_at) FROM stdin;
1	Homepage Hero Layout	Test different hero section layouts on homepage	{"{\\"id\\": \\"A\\", \\"name\\": \\"Original\\", \\"allocation\\": 50, \\"description\\": \\"Current hero layout\\"}","{\\"id\\": \\"B\\", \\"name\\": \\"Minimal\\", \\"allocation\\": 50, \\"description\\": \\"Simplified hero with CTA\\"}"}	{"A": 50, "B": 50}	running	2025-10-21 00:50:44.526	2025-11-04 00:50:44.526	\N	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-18 00:50:44.526
2	Pricing Page CTA Button	Test button text: "Buy Now" vs "Get Started"	{"{\\"id\\": \\"A\\", \\"name\\": \\"Buy Now\\", \\"allocation\\": 50}","{\\"id\\": \\"B\\", \\"name\\": \\"Get Started\\", \\"allocation\\": 50}"}	{"A": 50, "B": 50}	completed	2025-09-28 00:50:44.526	2025-10-23 00:50:44.526	B	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-23 00:50:44.526
3	Email Subject Line Test	Test welcome email subject lines	{"{\\"id\\": \\"A\\", \\"name\\": \\"Welcome to YoForex\\", \\"allocation\\": 33}","{\\"id\\": \\"B\\", \\"name\\": \\"Start Trading with YoForex\\", \\"allocation\\": 33}","{\\"id\\": \\"C\\", \\"name\\": \\"Your Trading Journey Begins\\", \\"allocation\\": 34}"}	{"A": 33, "B": 33, "C": 34}	paused	2025-10-14 00:50:44.526	2025-11-11 00:50:44.526	\N	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-08 00:50:44.526
\.


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.achievements (id, slug, name, description, icon, requirement, category, created_at) FROM stdin;
\.


--
-- Data for Name: activity_feed; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_feed (id, user_id, activity_type, entity_type, entity_id, title, description, created_at) FROM stdin;
c1979868-a980-411f-874b-173e3b27d79e	49065260	reply_posted	reply	12ee72af-140f-4277-8e2b-c7cd7ee89f87	Reply to: Signal services – are they worth it?	Yes it is good	2025-10-28 06:06:15.203864
3c6be94b-39ab-44e7-a2b5-2bcb5f8a80af	49065260	reply_posted	reply	12ee72af-140f-4277-8e2b-c7cd7ee89f87	Replied to thread	Yes it is good	2025-10-28 06:06:15.487805
\.


--
-- Data for Name: admin_actions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_actions (id, admin_id, action_type, target_type, target_id, details, ip_address, user_agent, created_at) FROM stdin;
1	7424f4cb-3490-4b20-b08a-8728e5786303	user_ban	user	target-524	{"note": "Automated admin action", "reason": "Action 0: user_ban", "severity": "low"}	192.168.0.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-28 00:50:43.813
2	97ba45ea-c4ae-4f8d-8216-cf304ce353af	user_suspend	content	target-122	{"note": "Automated admin action", "reason": "Action 1: user_suspend", "severity": "medium"}	192.168.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 23:50:43.813
3	21ce8c06-6b65-4cab-9961-ac99121e0696	user_warn	thread	target-788	{"note": "Automated admin action", "reason": "Action 2: user_warn", "severity": "high"}	192.168.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 22:50:43.813
4	7424f4cb-3490-4b20-b08a-8728e5786303	content_approve	review	target-936	{"note": "Automated admin action", "reason": "Action 3: content_approve", "severity": "low"}	192.168.0.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 21:50:43.813
5	97ba45ea-c4ae-4f8d-8216-cf304ce353af	content_reject	withdrawal	target-227	{"note": "Automated admin action", "reason": "Action 4: content_reject", "severity": "medium"}	192.168.0.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 20:50:43.813
6	21ce8c06-6b65-4cab-9961-ac99121e0696	withdrawal_approve	setting	target-911	{"note": "Automated admin action", "reason": "Action 5: withdrawal_approve", "severity": "high"}	192.168.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 19:50:43.813
7	7424f4cb-3490-4b20-b08a-8728e5786303	withdrawal_reject	user	target-663	{"note": "Automated admin action", "reason": "Action 6: withdrawal_reject", "severity": "low"}	192.168.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 18:50:43.813
8	97ba45ea-c4ae-4f8d-8216-cf304ce353af	settings_update	content	target-335	{"note": "Automated admin action", "reason": "Action 7: settings_update", "severity": "medium"}	192.168.0.7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 17:50:43.813
9	21ce8c06-6b65-4cab-9961-ac99121e0696	role_grant	thread	target-58	{"note": "Automated admin action", "reason": "Action 8: role_grant", "severity": "high"}	192.168.0.8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 16:50:43.813
10	7424f4cb-3490-4b20-b08a-8728e5786303	user_ban	review	target-353	{"note": "Automated admin action", "reason": "Action 9: user_ban", "severity": "low"}	192.168.0.9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 15:50:43.813
11	97ba45ea-c4ae-4f8d-8216-cf304ce353af	user_suspend	withdrawal	target-97	{"note": "Automated admin action", "reason": "Action 10: user_suspend", "severity": "medium"}	192.168.0.10	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 14:50:43.813
12	21ce8c06-6b65-4cab-9961-ac99121e0696	user_warn	setting	target-752	{"note": "Automated admin action", "reason": "Action 11: user_warn", "severity": "high"}	192.168.0.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 13:50:43.813
13	7424f4cb-3490-4b20-b08a-8728e5786303	content_approve	user	target-8	{"note": "Automated admin action", "reason": "Action 12: content_approve", "severity": "low"}	192.168.0.12	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 12:50:43.813
14	97ba45ea-c4ae-4f8d-8216-cf304ce353af	content_reject	content	target-53	{"note": "Automated admin action", "reason": "Action 13: content_reject", "severity": "medium"}	192.168.0.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 11:50:43.813
15	21ce8c06-6b65-4cab-9961-ac99121e0696	withdrawal_approve	thread	target-427	{"note": "Automated admin action", "reason": "Action 14: withdrawal_approve", "severity": "high"}	192.168.0.14	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 10:50:43.813
16	7424f4cb-3490-4b20-b08a-8728e5786303	withdrawal_reject	review	target-721	{"note": "Automated admin action", "reason": "Action 15: withdrawal_reject", "severity": "low"}	192.168.0.15	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 09:50:43.813
17	97ba45ea-c4ae-4f8d-8216-cf304ce353af	settings_update	withdrawal	target-287	{"note": "Automated admin action", "reason": "Action 16: settings_update", "severity": "medium"}	192.168.0.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 08:50:43.813
18	21ce8c06-6b65-4cab-9961-ac99121e0696	role_grant	setting	target-971	{"note": "Automated admin action", "reason": "Action 17: role_grant", "severity": "high"}	192.168.0.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 07:50:43.813
19	7424f4cb-3490-4b20-b08a-8728e5786303	user_ban	user	target-476	{"note": "Automated admin action", "reason": "Action 18: user_ban", "severity": "low"}	192.168.0.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 06:50:43.813
20	97ba45ea-c4ae-4f8d-8216-cf304ce353af	user_suspend	content	target-633	{"note": "Automated admin action", "reason": "Action 19: user_suspend", "severity": "medium"}	192.168.0.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 05:50:43.813
21	21ce8c06-6b65-4cab-9961-ac99121e0696	user_warn	thread	target-911	{"note": "Automated admin action", "reason": "Action 20: user_warn", "severity": "high"}	192.168.0.20	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 04:50:43.813
22	7424f4cb-3490-4b20-b08a-8728e5786303	content_approve	review	target-197	{"note": "Automated admin action", "reason": "Action 21: content_approve", "severity": "low"}	192.168.0.21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 03:50:43.813
23	97ba45ea-c4ae-4f8d-8216-cf304ce353af	content_reject	withdrawal	target-295	{"note": "Automated admin action", "reason": "Action 22: content_reject", "severity": "medium"}	192.168.0.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 02:50:43.813
24	21ce8c06-6b65-4cab-9961-ac99121e0696	withdrawal_approve	setting	target-673	{"note": "Automated admin action", "reason": "Action 23: withdrawal_approve", "severity": "high"}	192.168.0.23	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 01:50:43.813
25	7424f4cb-3490-4b20-b08a-8728e5786303	withdrawal_reject	user	target-691	{"note": "Automated admin action", "reason": "Action 24: withdrawal_reject", "severity": "low"}	192.168.0.24	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-27 00:50:43.813
26	97ba45ea-c4ae-4f8d-8216-cf304ce353af	settings_update	content	target-272	{"note": "Automated admin action", "reason": "Action 25: settings_update", "severity": "medium"}	192.168.0.25	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 23:50:43.813
27	21ce8c06-6b65-4cab-9961-ac99121e0696	role_grant	thread	target-762	{"note": "Automated admin action", "reason": "Action 26: role_grant", "severity": "high"}	192.168.0.26	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 22:50:43.813
28	7424f4cb-3490-4b20-b08a-8728e5786303	user_ban	review	target-475	{"note": "Automated admin action", "reason": "Action 27: user_ban", "severity": "low"}	192.168.0.27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 21:50:43.813
29	97ba45ea-c4ae-4f8d-8216-cf304ce353af	user_suspend	withdrawal	target-288	{"note": "Automated admin action", "reason": "Action 28: user_suspend", "severity": "medium"}	192.168.0.28	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 20:50:43.813
30	21ce8c06-6b65-4cab-9961-ac99121e0696	user_warn	setting	target-604	{"note": "Automated admin action", "reason": "Action 29: user_warn", "severity": "high"}	192.168.0.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 19:50:43.813
31	7424f4cb-3490-4b20-b08a-8728e5786303	content_approve	user	target-859	{"note": "Automated admin action", "reason": "Action 30: content_approve", "severity": "low"}	192.168.0.30	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 18:50:43.813
32	97ba45ea-c4ae-4f8d-8216-cf304ce353af	content_reject	content	target-152	{"note": "Automated admin action", "reason": "Action 31: content_reject", "severity": "medium"}	192.168.0.31	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 17:50:43.813
33	21ce8c06-6b65-4cab-9961-ac99121e0696	withdrawal_approve	thread	target-216	{"note": "Automated admin action", "reason": "Action 32: withdrawal_approve", "severity": "high"}	192.168.0.32	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 16:50:43.813
34	7424f4cb-3490-4b20-b08a-8728e5786303	withdrawal_reject	review	target-367	{"note": "Automated admin action", "reason": "Action 33: withdrawal_reject", "severity": "low"}	192.168.0.33	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 15:50:43.813
35	97ba45ea-c4ae-4f8d-8216-cf304ce353af	settings_update	withdrawal	target-514	{"note": "Automated admin action", "reason": "Action 34: settings_update", "severity": "medium"}	192.168.0.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 14:50:43.813
36	21ce8c06-6b65-4cab-9961-ac99121e0696	role_grant	setting	target-557	{"note": "Automated admin action", "reason": "Action 35: role_grant", "severity": "high"}	192.168.0.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 13:50:43.813
37	7424f4cb-3490-4b20-b08a-8728e5786303	user_ban	user	target-600	{"note": "Automated admin action", "reason": "Action 36: user_ban", "severity": "low"}	192.168.0.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 12:50:43.813
38	97ba45ea-c4ae-4f8d-8216-cf304ce353af	user_suspend	content	target-589	{"note": "Automated admin action", "reason": "Action 37: user_suspend", "severity": "medium"}	192.168.0.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 11:50:43.813
39	21ce8c06-6b65-4cab-9961-ac99121e0696	user_warn	thread	target-978	{"note": "Automated admin action", "reason": "Action 38: user_warn", "severity": "high"}	192.168.0.38	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 10:50:43.813
40	7424f4cb-3490-4b20-b08a-8728e5786303	content_approve	review	target-982	{"note": "Automated admin action", "reason": "Action 39: content_approve", "severity": "low"}	192.168.0.39	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 09:50:43.813
41	97ba45ea-c4ae-4f8d-8216-cf304ce353af	content_reject	withdrawal	target-398	{"note": "Automated admin action", "reason": "Action 40: content_reject", "severity": "medium"}	192.168.0.40	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 08:50:43.813
42	21ce8c06-6b65-4cab-9961-ac99121e0696	withdrawal_approve	setting	target-49	{"note": "Automated admin action", "reason": "Action 41: withdrawal_approve", "severity": "high"}	192.168.0.41	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 07:50:43.813
43	7424f4cb-3490-4b20-b08a-8728e5786303	withdrawal_reject	user	target-718	{"note": "Automated admin action", "reason": "Action 42: withdrawal_reject", "severity": "low"}	192.168.0.42	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 06:50:43.813
44	97ba45ea-c4ae-4f8d-8216-cf304ce353af	settings_update	content	target-195	{"note": "Automated admin action", "reason": "Action 43: settings_update", "severity": "medium"}	192.168.0.43	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 05:50:43.813
45	21ce8c06-6b65-4cab-9961-ac99121e0696	role_grant	thread	target-554	{"note": "Automated admin action", "reason": "Action 44: role_grant", "severity": "high"}	192.168.0.44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 04:50:43.813
46	7424f4cb-3490-4b20-b08a-8728e5786303	user_ban	review	target-146	{"note": "Automated admin action", "reason": "Action 45: user_ban", "severity": "low"}	192.168.0.45	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 03:50:43.813
47	97ba45ea-c4ae-4f8d-8216-cf304ce353af	user_suspend	withdrawal	target-959	{"note": "Automated admin action", "reason": "Action 46: user_suspend", "severity": "medium"}	192.168.0.46	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 02:50:43.813
48	21ce8c06-6b65-4cab-9961-ac99121e0696	user_warn	setting	target-764	{"note": "Automated admin action", "reason": "Action 47: user_warn", "severity": "high"}	192.168.0.47	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 01:50:43.813
49	7424f4cb-3490-4b20-b08a-8728e5786303	content_approve	user	target-769	{"note": "Automated admin action", "reason": "Action 48: content_approve", "severity": "low"}	192.168.0.48	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-26 00:50:43.813
50	97ba45ea-c4ae-4f8d-8216-cf304ce353af	content_reject	content	target-303	{"note": "Automated admin action", "reason": "Action 49: content_reject", "severity": "medium"}	192.168.0.49	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36	2025-10-25 23:50:43.813
\.


--
-- Data for Name: admin_roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_roles (id, user_id, role, permissions, granted_by, granted_at) FROM stdin;
1	7424f4cb-3490-4b20-b08a-8728e5786303	super_admin	{"all": true, "users": true, "content": true, "finance": true, "security": true, "settings": true}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-07-30 00:50:43.788
2	97ba45ea-c4ae-4f8d-8216-cf304ce353af	admin	{"users": true, "content": true, "finance": true, "support": true}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-29 00:50:43.788
3	21ce8c06-6b65-4cab-9961-ac99121e0696	moderator	{"content": true, "moderation": true}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-28 00:50:43.788
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.announcements (id, title, content, type, target_audience, segment_id, display_type, is_active, start_date, end_date, created_by, created_at, views, clicks) FROM stdin;
1	Platform Maintenance Scheduled	We will be performing scheduled maintenance on Saturday, October 28th from 2:00 AM to 4:00 AM UTC. The platform may be unavailable during this time.	warning	all	\N	banner	t	2025-10-28 00:50:44.286	2025-11-04 00:50:44.286	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-28 00:50:44.286	1250	45
2	New Features Released!	Check out our latest marketplace improvements, enhanced admin dashboard, and new earning opportunities. Learn more in our blog.	success	all	\N	modal	t	2025-10-26 00:50:44.286	2025-11-27 00:50:44.286	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-26 00:50:44.286	3400	890
3	Withdrawal Processing Delays	Due to high volume, withdrawal processing may take up to 48 hours. We apologize for the inconvenience.	info	all	\N	banner	f	2025-10-18 00:50:44.286	2025-10-25 00:50:44.286	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-18 00:50:44.286	2100	120
4	Happy Holidays!	Celebrate the season with 2x coin rewards on all activities. Valid until December 31st.	success	all	\N	toast	f	2025-08-29 00:50:44.286	2025-09-28 00:50:44.286	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-29 00:50:44.286	5600	2300
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_keys (id, key, name, user_id, permissions, rate_limit, is_active, last_used, expires_at, created_at) FROM stdin;
1	yfx_live_gwtfe86a10t	Production API Key	7424f4cb-3490-4b20-b08a-8728e5786303	{read,write}	1000	t	2025-10-27 22:50:44.574	2026-10-28 00:50:44.574	2025-07-30 00:50:44.574
2	yfx_test_3xp9cp2uuqu	Testing API Key	97ba45ea-c4ae-4f8d-8216-cf304ce353af	{read}	100	t	2025-10-27 00:50:44.574	2026-01-26 00:50:44.574	2025-09-28 00:50:44.574
3	yfx_dev_povsw7n6wnd	Development Key	7424f4cb-3490-4b20-b08a-8728e5786303	{read,write,delete}	500	t	2025-10-27 23:50:44.574	\N	2025-06-30 00:50:44.574
4	yfx_archived_6mhiwkkypcx	Archived Key	97ba45ea-c4ae-4f8d-8216-cf304ce353af	{read}	60	f	2025-08-29 00:50:44.574	2025-10-18 00:50:44.574	2025-05-01 00:50:44.574
\.


--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.automation_rules (id, name, description, trigger_type, trigger_config, action_type, action_config, is_active, execution_count, last_executed, created_by, created_at) FROM stdin;
1	Welcome Email on Signup	Send welcome email when new user registers	user_signup	{"event": "user.created"}	send_email	{"delay": 0, "templateKey": "welcome_email"}	t	1523	2025-10-27 22:50:44.507	7424f4cb-3490-4b20-b08a-8728e5786303	2025-07-30 00:50:44.507
2	Award Early Adopter Badge	Give badge to users who joined in first month	user_signup	{"dateRange": {"end": "2024-01-31", "start": "2024-01-01"}}	award_badge	{"badgeType": "early_adopter"}	f	234	2025-08-29 00:50:44.507	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-09 00:50:44.507
3	Reward First Purchase	Give 100 bonus coins on first purchase	purchase_made	{"condition": "first_purchase"}	add_coins	{"amount": 100, "description": "First purchase bonus"}	t	456	2025-10-27 19:50:44.507	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-19 00:50:44.507
4	Re-engage Inactive Users	Send email to users inactive for 30 days	inactivity_detected	{"days": 30}	send_email	{"templateKey": "reengagement_email"}	t	89	2025-10-27 00:50:44.507	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-09-18 00:50:44.507
5	Notify on Content Approval	Send notification when content is approved	content_published	{"status": "approved"}	send_notification	{"type": "content_approved"}	t	678	2025-10-27 23:50:44.507	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-04 00:50:44.507
\.


--
-- Data for Name: broker_reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.broker_reviews (id, broker_id, user_id, rating, review_title, review_body, is_scam_report, status, date_posted) FROM stdin;
\.


--
-- Data for Name: brokers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.brokers (id, name, slug, website_url, logo_url, year_founded, regulation, regulation_summary, platform, spread_type, min_spread, overall_rating, review_count, scam_report_count, is_verified, status, created_at, updated_at) FROM stdin;
005bdc54-ab38-47dc-b9d5-474e440e6764	Exness	exness	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	f	pending	2025-10-28 06:11:24.975326	2025-10-28 06:11:24.975326
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.campaigns (id, user_id, name, type, status, discount_percent, discount_code, start_date, end_date, uses, revenue, created_at) FROM stdin;
\.


--
-- Data for Name: coin_journal_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.coin_journal_entries (id, ledger_transaction_id, wallet_id, direction, amount, balance_before, balance_after, memo, created_at) FROM stdin;
\.


--
-- Data for Name: coin_ledger_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.coin_ledger_transactions (id, type, context, external_ref, initiator_user_id, created_at, closed_at, status) FROM stdin;
\.


--
-- Data for Name: coin_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.coin_transactions (id, user_id, type, amount, description, status, created_at) FROM stdin;
bc0713db-62ca-48eb-b5d2-024d814ec7eb	49065260	earn	15	Onboarding reward: firstReply	completed	2025-10-28 06:06:15.55899
\.


--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content (id, author_id, type, title, description, price_coins, is_free, category, platform, version, tags, files, images, broker_compat, min_deposit, hedging, changelog, license, equity_curve_image, profit_factor, drawdown_percent, win_percent, broker, months_tested, file_url, image_url, image_urls, post_logo_url, views, downloads, likes, is_featured, average_rating, review_count, status, slug, focus_keyword, auto_meta_description, auto_image_alt_texts, sales_score, last_sales_update, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: content_likes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content_likes (id, content_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: content_purchases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content_purchases (id, content_id, buyer_id, seller_id, price_coins, transaction_id, purchased_at) FROM stdin;
\.


--
-- Data for Name: content_replies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content_replies (id, content_id, user_id, parent_id, body, rating, image_urls, helpful, is_verified, created_at) FROM stdin;
\.


--
-- Data for Name: content_reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content_reviews (id, content_id, user_id, rating, review, status, reward_given, created_at) FROM stdin;
\.


--
-- Data for Name: content_revisions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.content_revisions (id, content_type, content_id, revision_number, data, changed_fields, changed_by, change_reason, created_at) FROM stdin;
1	thread	content-0	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-28 00:50:44.71
2	content	content-0	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-27 12:50:44.71
3	profile	content-0	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-27 00:50:44.71
4	announcement	content-1	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-26 12:50:44.71
5	thread	content-1	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-26 00:50:44.71
6	content	content-1	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-25 12:50:44.71
7	profile	content-2	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-25 00:50:44.71
8	announcement	content-2	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-24 12:50:44.71
9	thread	content-2	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-24 00:50:44.71
10	content	content-3	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-23 12:50:44.71
11	profile	content-3	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-23 00:50:44.71
12	announcement	content-3	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-22 12:50:44.71
13	thread	content-4	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-22 00:50:44.71
14	content	content-4	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-21 12:50:44.71
15	profile	content-4	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-21 00:50:44.71
16	announcement	content-5	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-20 12:50:44.71
17	thread	content-5	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-20 00:50:44.71
18	content	content-5	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-19 12:50:44.71
19	profile	content-6	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-19 00:50:44.71
20	announcement	content-6	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-18 12:50:44.71
21	thread	content-6	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-18 00:50:44.71
22	content	content-7	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-17 12:50:44.71
23	profile	content-7	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-17 00:50:44.71
24	announcement	content-7	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-16 12:50:44.71
25	thread	content-8	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-16 00:50:44.71
26	content	content-8	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-15 12:50:44.71
27	profile	content-8	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-15 00:50:44.71
28	announcement	content-9	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-14 12:50:44.71
29	thread	content-9	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-14 00:50:44.711
30	content	content-9	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-13 12:50:44.711
31	profile	content-10	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-13 00:50:44.711
32	announcement	content-10	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-12 12:50:44.711
33	thread	content-10	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-12 00:50:44.711
34	content	content-11	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-11 12:50:44.711
35	profile	content-11	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-11 00:50:44.711
36	announcement	content-11	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	7424f4cb-3490-4b20-b08a-8728e5786303	Initial creation	2025-10-10 12:50:44.711
37	thread	content-12	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Fixed typos	2025-10-10 00:50:44.711
38	content	content-12	2	{"body": "This is revision 2 with updated content", "title": "Version 2 of content", "metadata": {"edited": true, "version": 2}}	{title,body,updatedAt}	21ce8c06-6b65-4cab-9961-ac99121e0696	Updated information	2025-10-09 12:50:44.711
39	profile	content-12	3	{"body": "This is revision 3 with updated content", "title": "Version 3 of content", "metadata": {"edited": true, "version": 3}}	{title,body,updatedAt}	607766e0-6d78-4482-84ba-5718d78e937f	Added more details	2025-10-09 00:50:44.711
40	announcement	content-13	1	{"body": "This is revision 1 with updated content", "title": "Version 1 of content", "metadata": {"edited": true, "version": 1}}	{title,body,updatedAt}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Corrected errors	2025-10-08 12:50:44.711
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversations (id, participant1_id, participant2_id, last_message_at, created_at) FROM stdin;
\.


--
-- Data for Name: daily_activity_limits; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.daily_activity_limits (id, user_id, activity_date, replies_count, reports_count, backtests_count, last_checkin_at, consecutive_days, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dashboard_preferences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.dashboard_preferences (id, user_id, widget_order, enabled_widgets, layout_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dashboard_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.dashboard_settings (id, user_id, layout, theme, auto_refresh, refresh_interval, favorites, updated_at) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_templates (id, template_key, subject, html_body, text_body, variables, category, is_active, updated_by, updated_at) FROM stdin;
1	welcome_email	Welcome to YoForex, {{username}}!	<h1>Welcome {{username}}!</h1><p>Thank you for joining our trading community. Start exploring EAs and earning coins today!</p>	Welcome {{username}}! Thank you for joining our trading community.	{username,email}	onboarding	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-17 14:31:43.779
2	email_verification	Verify your email address	<p>Hi {{username}}, please verify your email by clicking: {{verificationLink}}</p>	Please verify your email: {{verificationLink}}	{username,verificationLink}	onboarding	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-05 09:41:09.619
3	purchase_confirmation	Purchase Confirmed - {{itemName}}	<p>Your purchase of {{itemName}} for {{amount}} coins is confirmed.</p><p>Download link: {{downloadLink}}</p>	Purchase confirmed: {{itemName}} for {{amount}} coins. Download: {{downloadLink}}	{username,itemName,amount,downloadLink}	transactions	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-18 13:47:46.66
4	withdrawal_approved	Withdrawal Request Approved	<p>Your withdrawal of {{amount}} coins ({{cryptoAmount}} {{cryptoType}}) has been approved and is being processed.</p>	Withdrawal approved: {{amount}} coins ({{cryptoAmount}} {{cryptoType}})	{username,amount,cryptoAmount,cryptoType}	finance	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-17 12:09:21.95
5	withdrawal_rejected	Withdrawal Request Rejected	<p>Your withdrawal request has been rejected. Reason: {{reason}}</p>	Withdrawal rejected. Reason: {{reason}}	{username,amount,reason}	finance	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-07 18:11:30.735
6	password_reset	Reset Your Password	<p>Reset your password by clicking: {{resetLink}}</p><p>This link expires in 1 hour.</p>	Reset password: {{resetLink}} (expires in 1 hour)	{username,resetLink}	support	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-25 18:45:23.889
7	content_approved	Your content has been approved!	<p>Congratulations! Your {{contentType}} "{{contentTitle}}" has been approved and is now live.</p>	Your {{contentType}} "{{contentTitle}}" has been approved!	{username,contentType,contentTitle,contentUrl}	notifications	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-05 15:52:02.123
8	content_rejected	Content Review Update	<p>Your {{contentType}} was not approved. Reason: {{reason}}</p>	Content not approved. Reason: {{reason}}	{username,contentType,reason}	notifications	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-12 16:01:15.525
9	monthly_summary	Your Monthly Activity Summary	<h2>Hi {{username}},</h2><p>This month: {{earnings}} coins earned, {{posts}} posts created, {{downloads}} downloads.</p>	Monthly summary: {{earnings}} coins, {{posts}} posts, {{downloads}} downloads	{username,earnings,posts,downloads}	marketing	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-05 18:40:30.933
10	support_ticket_reply	New reply on ticket {{ticketNumber}}	<p>Your support ticket {{ticketNumber}} has a new reply from our team.</p>	New reply on ticket {{ticketNumber}}	{username,ticketNumber,replyText}	support	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-28 10:01:46.836
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feature_flags (id, flag_key, name, description, is_enabled, rollout_percentage, target_users, target_segments, created_by, created_at, updated_at) FROM stdin;
1	new_dashboard_ui	New Dashboard UI	Enable redesigned dashboard interface	t	50	{7424f4cb-3490-4b20-b08a-8728e5786303,97ba45ea-c4ae-4f8d-8216-cf304ce353af}	{}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-13 00:50:44.553	2025-10-26 00:50:44.553
2	ai_content_moderation	AI Content Moderation	Use AI to detect spam and inappropriate content	t	100	{}	{}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-28 00:50:44.553	2025-10-18 00:50:44.553
3	social_sharing	Social Media Sharing	Allow users to share content on social media	f	0	{7424f4cb-3490-4b20-b08a-8728e5786303}	{}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-23 00:50:44.553	2025-10-27 00:50:44.553
4	dark_mode	Dark Mode	Enable dark theme option	t	100	{}	{}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-13 00:50:44.553	2025-10-08 00:50:44.553
5	referral_program	Referral Program	Enable referral rewards system	t	100	{}	{}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-29 00:50:44.553	2025-09-28 00:50:44.553
\.


--
-- Data for Name: forum_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.forum_categories (slug, name, description, icon, color, thread_count, post_count, sort_order, is_active, created_at, updated_at, parent_slug) FROM stdin;
trading-strategies	Trading Strategies & Discussion	Scalping, day, swing, position, grid/marti, hedging & correlations.	TrendingUp	bg-blue-500	0	0	0	t	2025-10-27 16:19:09.884067	2025-10-27 16:19:09.884067	\N
scalping-m1-m15	Scalping Strategies (M1–M15)	Scalping Strategies (M1–M15) discussions and resources.	Zap	bg-primary	0	0	0	t	2025-10-27 16:19:09.904483	2025-10-27 16:19:09.904483	trading-strategies
xauusd-scalping	XAUUSD Scalping	XAUUSD Scalping discussions and resources.	Coins	bg-primary	0	0	0	t	2025-10-27 16:19:09.921815	2025-10-27 16:19:09.921815	trading-strategies
eurusd-scalping	EURUSD Scalping	EURUSD Scalping discussions and resources.	Euro	bg-primary	0	0	0	t	2025-10-27 16:19:09.937999	2025-10-27 16:19:09.937999	trading-strategies
crypto-scalping	Crypto Scalping	Crypto Scalping discussions and resources.	Bitcoin	bg-primary	0	0	0	t	2025-10-27 16:19:09.9548	2025-10-27 16:19:09.9548	trading-strategies
news-scalping	News Scalping	News Scalping discussions and resources.	Newspaper	bg-primary	0	0	0	t	2025-10-27 16:19:09.971102	2025-10-27 16:19:09.971102	trading-strategies
day-trading	Day Trading (M15–H4)	Day Trading (M15–H4) discussions and resources.	Sun	bg-primary	0	0	0	t	2025-10-27 16:19:09.987642	2025-10-27 16:19:09.987642	trading-strategies
swing-trading	Swing Trading (H4–D1)	Swing Trading (H4–D1) discussions and resources.	TrendingUp	bg-primary	0	0	0	t	2025-10-27 16:19:10.005329	2025-10-27 16:19:10.005329	trading-strategies
position-trading	Position Trading (D1–W1)	Position Trading (D1–W1) discussions and resources.	Target	bg-primary	0	0	0	t	2025-10-27 16:19:10.022209	2025-10-27 16:19:10.022209	trading-strategies
grid-martingale	Grid & Martingale Systems	Grid & Martingale Systems discussions and resources.	Grid3x3	bg-primary	0	0	0	t	2025-10-27 16:19:10.038701	2025-10-27 16:19:10.038701	trading-strategies
hedging	Hedging Strategies	Hedging Strategies discussions and resources.	Shield	bg-primary	0	0	0	t	2025-10-27 16:19:10.057389	2025-10-27 16:19:10.057389	trading-strategies
multi-pair-correlation	Multi-Pair Correlation	Multi-Pair Correlation discussions and resources.	Network	bg-primary	0	0	0	t	2025-10-27 16:19:10.073306	2025-10-27 16:19:10.073306	trading-strategies
ea-library	Expert Advisors (EA) Library	Robots by strategy, platform and performance tier.	Bot	bg-purple-500	0	0	0	t	2025-10-27 16:19:10.089008	2025-10-27 16:19:10.089008	\N
scalping-eas	Scalping EAs	Scalping EAs discussions and resources.	Zap	bg-primary	0	0	0	t	2025-10-27 16:19:10.104895	2025-10-27 16:19:10.104895	ea-library
grid-trading-eas	Grid Trading EAs	Grid Trading EAs discussions and resources.	Grid3x3	bg-primary	0	0	0	t	2025-10-27 16:19:10.120787	2025-10-27 16:19:10.120787	ea-library
trend-following-eas	Trend Following EAs	Trend Following EAs discussions and resources.	TrendingUp	bg-primary	0	0	0	t	2025-10-27 16:19:10.137284	2025-10-27 16:19:10.137284	ea-library
breakout-eas	Breakout EAs	Breakout EAs discussions and resources.	CircleDot	bg-primary	0	0	0	t	2025-10-27 16:19:10.162303	2025-10-27 16:19:10.162303	ea-library
news-trading-eas	News Trading EAs	News Trading EAs discussions and resources.	Newspaper	bg-primary	0	0	0	t	2025-10-27 16:19:10.177996	2025-10-27 16:19:10.177996	ea-library
mt4-eas	MT4 EAs	MT4 EAs discussions and resources.	Terminal	bg-primary	0	0	0	t	2025-10-27 16:19:10.194603	2025-10-27 16:19:10.194603	ea-library
mt5-eas	MT5 EAs	MT5 EAs discussions and resources.	Terminal	bg-primary	0	0	0	t	2025-10-27 16:19:10.210835	2025-10-27 16:19:10.210835	ea-library
ctrader-robots	cTrader Robots	cTrader Robots discussions and resources.	Bot	bg-primary	0	0	0	t	2025-10-27 16:19:10.235919	2025-10-27 16:19:10.235919	ea-library
free-eas-0	Free EAs (0 coins)	Free EAs (0 coins) discussions and resources.	Gift	bg-primary	0	0	0	t	2025-10-27 16:19:10.252463	2025-10-27 16:19:10.252463	ea-library
budget-eas-50-100	Budget EAs (50–100 coins)	Budget EAs (50–100 coins) discussions and resources.	DollarSign	bg-primary	0	0	0	t	2025-10-27 16:19:10.268142	2025-10-27 16:19:10.268142	ea-library
premium-eas-200-500	Premium EAs (200–500 coins)	Premium EAs (200–500 coins) discussions and resources.	Crown	bg-primary	0	0	0	t	2025-10-27 16:19:10.284123	2025-10-27 16:19:10.284123	ea-library
indicators-templates	Custom Indicators & Templates	Indicators & full chart templates.	Activity	bg-green-500	0	0	0	t	2025-10-27 16:19:10.30023	2025-10-27 16:19:10.30023	\N
trend-indicators	Trend Indicators	Trend Indicators discussions and resources.	TrendingUp	bg-primary	0	0	0	t	2025-10-27 16:19:10.316274	2025-10-27 16:19:10.316274	indicators-templates
oscillators-momentum	Oscillators & Momentum	Oscillators & Momentum discussions and resources.	Activity	bg-primary	0	0	0	t	2025-10-27 16:19:10.331645	2025-10-27 16:19:10.331645	indicators-templates
volume-indicators	Volume Indicators	Volume Indicators discussions and resources.	BarChart3	bg-primary	0	0	0	t	2025-10-27 16:19:10.347367	2025-10-27 16:19:10.347367	indicators-templates
sr-tools	Support/Resistance Tools	Support/Resistance Tools discussions and resources.	Ruler	bg-primary	0	0	0	t	2025-10-27 16:19:10.365642	2025-10-27 16:19:10.365642	indicators-templates
template-packs	Complete Template Packages	Complete Template Packages discussions and resources.	Package	bg-primary	0	0	0	t	2025-10-27 16:19:10.380299	2025-10-27 16:19:10.380299	indicators-templates
broker-reviews	Broker Reviews & Directory	Real user experiences: ECN, MM, spreads, leverage and warnings.	Building2	bg-orange-500	0	0	0	t	2025-10-27 16:19:10.3965	2025-10-27 16:19:10.3965	\N
ecn-brokers	ECN Brokers	ECN Brokers discussions and resources.	Building2	bg-primary	0	0	0	t	2025-10-27 16:19:10.412063	2025-10-27 16:19:10.412063	broker-reviews
market-maker-brokers	Market Maker Brokers	Market Maker Brokers discussions and resources.	Building	bg-primary	0	0	0	t	2025-10-27 16:19:10.427957	2025-10-27 16:19:10.427957	broker-reviews
low-spread-brokers	Low Spread Brokers	Low Spread Brokers discussions and resources.	TrendingDown	bg-primary	0	0	0	t	2025-10-27 16:19:10.443639	2025-10-27 16:19:10.443639	broker-reviews
high-leverage-brokers	High Leverage Brokers	High Leverage Brokers discussions and resources.	TrendingUp	bg-primary	0	0	0	t	2025-10-27 16:19:10.458319	2025-10-27 16:19:10.458319	broker-reviews
regulated-brokers	Regulated Brokers (FCA, ASIC)	Regulated Brokers (FCA, ASIC) discussions and resources.	Shield	bg-primary	0	0	0	t	2025-10-27 16:19:10.473988	2025-10-27 16:19:10.473988	broker-reviews
scam-watch	Scam Watch & Warnings	Scam Watch & Warnings discussions and resources.	AlertTriangle	bg-primary	0	0	0	t	2025-10-27 16:19:10.489642	2025-10-27 16:19:10.489642	broker-reviews
coding-dev	Coding & Development	MQL4/5, Python, backtesting & freelance gigs.	Code2	bg-indigo-500	0	0	0	t	2025-10-27 16:19:10.504878	2025-10-27 16:19:10.504878	\N
mql4	MQL4 Programming	MQL4 Programming discussions and resources.	Code	bg-primary	0	0	0	t	2025-10-27 16:19:10.522125	2025-10-27 16:19:10.522125	coding-dev
mql5	MQL5 Programming	MQL5 Programming discussions and resources.	Code2	bg-primary	0	0	0	t	2025-10-27 16:19:10.538481	2025-10-27 16:19:10.538481	coding-dev
python-bots	Python Trading Bots	Python Trading Bots discussions and resources.	FileCode	bg-primary	0	0	0	t	2025-10-27 16:19:10.554443	2025-10-27 16:19:10.554443	coding-dev
strategy-backtesting	Strategy Backtesting	Strategy Backtesting discussions and resources.	TestTube	bg-primary	0	0	0	t	2025-10-27 16:19:10.570865	2025-10-27 16:19:10.570865	coding-dev
freelance-requests	Freelance Requests	Freelance Requests discussions and resources.	Users	bg-primary	0	0	0	t	2025-10-27 16:19:10.586567	2025-10-27 16:19:10.586567	coding-dev
education	Education & Resources	Beginner to pro: TA/FA, risk & psychology.	GraduationCap	bg-yellow-500	0	0	0	t	2025-10-27 16:19:10.602543	2025-10-27 16:19:10.602543	\N
beginners-corner	Beginner's Corner	Beginner's Corner discussions and resources.	BookOpen	bg-primary	0	0	0	t	2025-10-27 16:19:10.617242	2025-10-27 16:19:10.617242	education
technical-analysis	Technical Analysis	Technical Analysis discussions and resources.	LineChart	bg-primary	0	0	0	t	2025-10-27 16:19:10.633367	2025-10-27 16:19:10.633367	education
fundamental-analysis	Fundamental Analysis	Fundamental Analysis discussions and resources.	FileText	bg-primary	0	0	0	t	2025-10-27 16:19:10.648989	2025-10-27 16:19:10.648989	education
risk-management	Risk Management	Risk Management discussions and resources.	Shield	bg-primary	0	0	0	t	2025-10-27 16:19:10.664399	2025-10-27 16:19:10.664399	education
trading-psychology	Trading Psychology	Trading Psychology discussions and resources.	Brain	bg-primary	0	0	0	t	2025-10-27 16:19:10.680967	2025-10-27 16:19:10.680967	education
journals-performance	Trading Journals & Performance	Live journals, EA performance, backtests & forward tests.	LineChart	bg-pink-500	0	0	0	t	2025-10-27 16:19:10.697289	2025-10-27 16:19:10.697289	\N
live-trading-journals	Live Trading Journals	Live Trading Journals discussions and resources.	BookOpen	bg-primary	0	0	0	t	2025-10-27 16:19:10.713678	2025-10-27 16:19:10.713678	journals-performance
ea-performance-reports	EA Performance Reports	EA Performance Reports discussions and resources.	BarChart	bg-primary	0	0	0	t	2025-10-27 16:19:10.733508	2025-10-27 16:19:10.733508	journals-performance
backtest-results	Backtest Results	Backtest Results discussions and resources.	TestTube2	bg-primary	0	0	0	t	2025-10-27 16:19:10.749091	2025-10-27 16:19:10.749091	journals-performance
forward-test-results	Forward Test Results	Forward Test Results discussions and resources.	ArrowRight	bg-primary	0	0	0	t	2025-10-27 16:19:10.764583	2025-10-27 16:19:10.764583	journals-performance
tools-services	Tools & Services	VPS, copiers, signals, calculators & utilities.	Wrench	bg-cyan-500	0	0	0	t	2025-10-27 16:19:10.780137	2025-10-27 16:19:10.780137	\N
vps-services	VPS Services	VPS Services discussions and resources.	Server	bg-primary	0	0	0	t	2025-10-27 16:19:10.796871	2025-10-27 16:19:10.796871	tools-services
trade-copiers	Trade Copiers	Trade Copiers discussions and resources.	Copy	bg-primary	0	0	0	t	2025-10-27 16:19:10.812939	2025-10-27 16:19:10.812939	tools-services
calculators-utilities	Calculators & Utilities	Calculators & Utilities discussions and resources.	Calculator	bg-primary	0	0	0	t	2025-10-27 16:19:10.843435	2025-10-27 16:19:10.843435	tools-services
signal-services	Signal Services	Signal Services discussions and resources.	Radio	bg-primary	1	7	0	t	2025-10-27 16:19:10.828651	2025-10-28 06:06:15.451872	tools-services
\.


--
-- Data for Name: forum_replies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.forum_replies (id, thread_id, user_id, parent_id, body, slug, meta_description, image_urls, helpful, is_accepted, is_verified, created_at, updated_at) FROM stdin;
b07551fe-4fd7-49a9-8915-af2191c21fb9	41868c43-34e3-470f-81ac-62741f987fee	7424f4cb-3490-4b20-b08a-8728e5786303	\N	Thanks for the detailed explanation. Very informative!	reply-help-pls-xauusd-m5-scalping-keeps-failing-1761583145152-j0ko2hr	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:05.15985	2025-10-27 16:39:05.15985
55cdf60a-e109-4dae-ab58-4311a8b751f1	41868c43-34e3-470f-81ac-62741f987fee	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Interesting approach. Have you considered adding a trend filter?	reply-help-pls-xauusd-m5-scalping-keeps-failing-1761583145177-k9o02fz	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.185312	2025-10-27 16:39:05.185312
469857d5-6678-4cdd-ace9-92d19c8a218b	6d55dbce-101b-41d3-ad25-0ead3907be4b	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	Thanks for the detailed explanation. Very informative!	reply-grid-ea-on-eurusd-is-20-pip-grid-too-tight-1761583145194-d6s323d	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:05.202442	2025-10-27 16:39:05.202442
add0b8bc-87da-432a-be05-c53547abb2c7	6d55dbce-101b-41d3-ad25-0ead3907be4b	607766e0-6d78-4482-84ba-5718d78e937f	\N	Great results! Can you share your settings?	reply-grid-ea-on-eurusd-is-20-pip-grid-too-tight-1761583145211-1uj0yye	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:05.225821	2025-10-27 16:39:05.225821
d4f737a3-6411-41ad-9c30-33cadb837ee7	6d55dbce-101b-41d3-ad25-0ead3907be4b	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Awesome! Keep us updated with your progress.	reply-grid-ea-on-eurusd-is-20-pip-grid-too-tight-1761583145234-r0sg02w	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.24226	2025-10-27 16:39:05.24226
c129b843-b346-4ed8-9670-ae9bc8ad2a0f	04c71773-162f-411e-ae3b-51884a159855	40c33800-e478-43fa-9c2c-e9e73c806541	\N	This only works in specific market conditions. Be careful.	reply-ic-markets-vs-pepperstone-for-scalping-1761583145250-zrii8up	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.260814	2025-10-27 16:39:05.260814
3a24cef8-b378-4744-beea-699ce59a5286	04c71773-162f-411e-ae3b-51884a159855	f9fab52c-da82-4291-ae6f-22e0eb8fd930	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-ic-markets-vs-pepperstone-for-scalping-1761583145277-sp8lr9q	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:05.2855	2025-10-27 16:39:05.2855
edef1173-1349-4c66-a2f9-59ca817a5c00	6ec0b6e4-6363-4c79-b0f4-3a0439a0029d	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	This only works in specific market conditions. Be careful.	reply-my-btcusd-scalping-strategy-500-pips-in-2-weeks-1761583145294-hdo4tjy	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.301784	2025-10-27 16:39:05.301784
1f35a2e2-0931-4345-b52e-df8c546c5279	6ec0b6e4-6363-4c79-b0f4-3a0439a0029d	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	Interesting approach. Have you considered adding a trend filter?	reply-my-btcusd-scalping-strategy-500-pips-in-2-weeks-1761583145310-zg3xfpg	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.317703	2025-10-27 16:39:05.317703
d83a9cfc-f95e-4aec-8aa5-af12b5121fdc	6ec0b6e4-6363-4c79-b0f4-3a0439a0029d	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for sharing! This is really helpful.	reply-my-btcusd-scalping-strategy-500-pips-in-2-weeks-1761583145326-jps5mfz	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:05.33328	2025-10-27 16:39:05.33328
3fb2c8fe-c946-45ed-ba5e-efc5751b0c15	578d8008-9584-47b6-bd04-31517b49ff14	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-mql4-vs-mql5-which-should-i-learn-first-1761583145341-2kum3ew	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:05.349426	2025-10-27 16:39:05.349426
4fa98bc2-550c-4dd6-aa33-01855d11f808	578d8008-9584-47b6-bd04-31517b49ff14	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	This only works in specific market conditions. Be careful.	reply-mql4-vs-mql5-which-should-i-learn-first-1761583145360-hjk9rqq	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.367319	2025-10-27 16:39:05.367319
e3dad9e0-6821-4e3c-9a83-a0f5fcc9f1c5	7d0b24ab-1dff-4545-8c17-397cf630df47	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-news-scalping-on-nfp-best-pairs-to-trade-1761583145375-39a21ss	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:05.384405	2025-10-27 16:39:05.384405
b9cf83bb-2dcf-48e3-b2cb-3c5971cbe4fc	7d0b24ab-1dff-4545-8c17-397cf630df47	f9fab52c-da82-4291-ae6f-22e0eb8fd930	\N	This only works in specific market conditions. Be careful.	reply-news-scalping-on-nfp-best-pairs-to-trade-1761583145392-eu16mgz	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.400661	2025-10-27 16:39:05.400661
798d1f01-68d4-4890-aa76-1e3810a3df6f	7d0b24ab-1dff-4545-8c17-397cf630df47	7424f4cb-3490-4b20-b08a-8728e5786303	\N	Great results! Can you share your settings?	reply-news-scalping-on-nfp-best-pairs-to-trade-1761583145409-ee2mc0o	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:05.41716	2025-10-27 16:39:05.41716
bf86461c-1128-49ec-a309-1e53b3928ddb	01b88c38-33ea-485b-bba8-42fa47e87c35	607766e0-6d78-4482-84ba-5718d78e937f	\N	Thanks for sharing! This is really helpful.	reply-martingale-on-eurusd-lost-my-account-again--1761583145425-xicglga	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:05.434795	2025-10-27 16:39:05.434795
3d811c8b-7383-4df3-a4a8-6a64f06d4725	01b88c38-33ea-485b-bba8-42fa47e87c35	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Awesome! Keep us updated with your progress.	reply-martingale-on-eurusd-lost-my-account-again--1761583145443-h3s2xet	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.450905	2025-10-27 16:39:05.450905
863f3983-f592-4083-9f5a-289d5e63e31d	01b88c38-33ea-485b-bba8-42fa47e87c35	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	Interesting approach. Have you considered adding a trend filter?	reply-martingale-on-eurusd-lost-my-account-again--1761583145459-qmiuia4	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.467302	2025-10-27 16:39:05.467302
727af95d-61d6-4f7b-9130-9c758a5ac3e6	01b88c38-33ea-485b-bba8-42fa47e87c35	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	Thanks for sharing! This is really helpful.	reply-martingale-on-eurusd-lost-my-account-again--1761583145475-g4gxr3w	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:05.483601	2025-10-27 16:39:05.483601
dfbb22b6-e458-4aa6-904f-b447d64bc6b8	2e52de40-a925-4ba6-a4f3-70183b085b7f	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for the detailed explanation. Very informative!	reply-trend-following-ea-70-win-rate-backtest-1761583145492-lvx20lz	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:05.499494	2025-10-27 16:39:05.499494
fe32a626-f48c-446d-851a-0ececf419157	2e52de40-a925-4ba6-a4f3-70183b085b7f	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for the detailed explanation. Very informative!	reply-trend-following-ea-70-win-rate-backtest-1761583145507-gyqqssi	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:05.515762	2025-10-27 16:39:05.515762
707b7ea3-51e2-4c8d-92a5-f9e341726dea	78029733-c50b-4a12-bc65-83b2300e35ff	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Interesting approach. Have you considered adding a trend filter?	reply-xm-broker-blocked-my-withdrawal-scam-alert-1761583145524-m16p6dc	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.532124	2025-10-27 16:39:05.532124
7e451466-b2c5-4993-8613-929f5ce9890d	f0d24926-8128-4f79-bddf-77cb60ef3a83	4167a292-537e-41f3-a8de-f77fe7ae0c29	\N	Awesome! Keep us updated with your progress.	reply-eurusd-scalping-best-indicators-1761583147906-9dcyz98	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.913924	2025-10-27 16:39:07.913924
d8201b6f-7dc2-4156-9715-1ef5f277eb98	78029733-c50b-4a12-bc65-83b2300e35ff	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	This only works in specific market conditions. Be careful.	reply-xm-broker-blocked-my-withdrawal-scam-alert-1761583145540-t71n7he	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.547449	2025-10-27 16:39:05.547449
90cbf06f-8f8c-4822-a117-7e8427aed2a4	83d76b93-8dc9-4fd4-9663-572b6deeaa82	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-day-trading-usdjpy-best-time-of-day-1761583145560-7vlxcwm	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:05.569002	2025-10-27 16:39:05.569002
5f8d6133-e64b-4534-aeff-ec0f5b787e4e	83d76b93-8dc9-4fd4-9663-572b6deeaa82	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Awesome! Keep us updated with your progress.	reply-day-trading-usdjpy-best-time-of-day-1761583145577-kltkk4n	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.585867	2025-10-27 16:39:05.585867
02002033-53dd-4889-ad80-dc91542ba9f1	83d76b93-8dc9-4fd4-9663-572b6deeaa82	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Interesting approach. Have you considered adding a trend filter?	reply-day-trading-usdjpy-best-time-of-day-1761583145594-lhv2bp3	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.601968	2025-10-27 16:39:05.601968
9c0f425b-3aab-46a4-be37-2897faa2587b	79be008c-74b4-4715-8b54-13ab70efb798	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Thanks for sharing! This is really helpful.	reply-free-scalping-ea-tested-on-demo-for-3-months-1761583145610-egboup1	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:05.618307	2025-10-27 16:39:05.618307
99d41e7e-f108-4b38-8a98-cf481175db29	79be008c-74b4-4715-8b54-13ab70efb798	607766e0-6d78-4482-84ba-5718d78e937f	\N	Great results! Can you share your settings?	reply-free-scalping-ea-tested-on-demo-for-3-months-1761583145626-16ci7xr	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:05.633135	2025-10-27 16:39:05.633135
72616c1a-f546-4108-87da-649500670c14	79be008c-74b4-4715-8b54-13ab70efb798	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-free-scalping-ea-tested-on-demo-for-3-months-1761583145641-vcjtldq	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:05.648226	2025-10-27 16:39:05.648226
ba9bae70-8992-4460-bc20-74507effade7	efdbf07f-3feb-45dd-a295-cdd68cba1065	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Awesome! Keep us updated with your progress.	reply-hedging-strategy-for-correlated-pairs-1761583145656-42f66tx	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.663189	2025-10-27 16:39:05.663189
55f5e2d8-7b0d-402a-b544-1a497149004a	efdbf07f-3feb-45dd-a295-cdd68cba1065	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	This only works in specific market conditions. Be careful.	reply-hedging-strategy-for-correlated-pairs-1761583145671-aronvff	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.679527	2025-10-27 16:39:05.679527
1215c962-f944-4473-9834-e825d3548502	efdbf07f-3feb-45dd-a295-cdd68cba1065	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Interesting approach. Have you considered adding a trend filter?	reply-hedging-strategy-for-correlated-pairs-1761583145688-9roa9cn	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.69553	2025-10-27 16:39:05.69553
c012cc9b-0583-456b-9398-bed2747410d3	0dc77b6c-ed4a-4d81-9a30-1556a1ecd3d2	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Awesome! Keep us updated with your progress.	reply-vps-recommendations-for-mt4-eas-1761583145704-2hrsb8f	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.712342	2025-10-27 16:39:05.712342
23923448-7007-4ee3-a2b7-33bbe5f5551d	0dc77b6c-ed4a-4d81-9a30-1556a1ecd3d2	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Been using this for months. Works great on trending markets.	reply-vps-recommendations-for-mt4-eas-1761583145720-wf5wd8r	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:05.72866	2025-10-27 16:39:05.72866
e3b54a43-7ceb-4ae7-9572-8bee61d5ed2d	0dc77b6c-ed4a-4d81-9a30-1556a1ecd3d2	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	Interesting approach. Have you considered adding a trend filter?	reply-vps-recommendations-for-mt4-eas-1761583145737-mwa93rb	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.744977	2025-10-27 16:39:05.744977
8308b3d2-bd5f-456f-86ed-73268e91c037	5e1267a4-e6d7-4c36-9f44-1997b77b1322	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for sharing! This is really helpful.	reply-swing-trading-on-d1-patience-is-key-1761583145753-f2h2fpu	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:05.761123	2025-10-27 16:39:05.761123
96c48251-6aaf-4094-a124-766ac75d7d6e	5e1267a4-e6d7-4c36-9f44-1997b77b1322	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-swing-trading-on-d1-patience-is-key-1761583145769-7uvfvsd	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:05.777715	2025-10-27 16:39:05.777715
4b9a051c-a9bc-447d-bc38-14a460c0967c	2311343f-70d3-4256-a250-4da5e573e890	7424f4cb-3490-4b20-b08a-8728e5786303	\N	Thanks for the detailed explanation. Very informative!	reply-oscillator-indicators-rsi-vs-stochastic-1761583145786-523vip6	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:05.79401	2025-10-27 16:39:05.79401
9fcdfd74-07bf-4d9d-99dc-16afe7483c13	2311343f-70d3-4256-a250-4da5e573e890	5de857df-a081-4082-a778-8653df02a42c	\N	This only works in specific market conditions. Be careful.	reply-oscillator-indicators-rsi-vs-stochastic-1761583145802-46jp32b	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.810066	2025-10-27 16:39:05.810066
ac111094-4098-4877-880a-ace9ecd07dbb	2311343f-70d3-4256-a250-4da5e573e890	53943ec5-cbc1-48b8-a561-9b8109476fc9	\N	Awesome! Keep us updated with your progress.	reply-oscillator-indicators-rsi-vs-stochastic-1761583145819-drvqfhu	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.83105	2025-10-27 16:39:05.83105
f4a820cf-5561-4e28-8075-b287233f3244	2311343f-70d3-4256-a250-4da5e573e890	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Interesting approach. Have you considered adding a trend filter?	reply-oscillator-indicators-rsi-vs-stochastic-1761583145839-9yqdrto	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.847353	2025-10-27 16:39:05.847353
4d333028-513d-4fb6-ab00-7e37d8a34182	d8fd8bd9-d170-4a1d-8548-3c262f688bb8	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	Interesting approach. Have you considered adding a trend filter?	reply-fp-markets-slippage-on-nfp-day-1761583145856-l1cwbgk	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:05.864091	2025-10-27 16:39:05.864091
1f92f946-a8a6-46cf-aad1-7b31d2015137	d8fd8bd9-d170-4a1d-8548-3c262f688bb8	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-fp-markets-slippage-on-nfp-day-1761583145872-ltlz9af	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:05.880043	2025-10-27 16:39:05.880043
bf13af3a-043a-4382-aab8-a5c8161586c4	d8fd8bd9-d170-4a1d-8548-3c262f688bb8	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Awesome! Keep us updated with your progress.	reply-fp-markets-slippage-on-nfp-day-1761583145888-omt5jk5	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.895188	2025-10-27 16:39:05.895188
2484e6fe-8491-41f1-9c0d-75c089ac491f	d8fd8bd9-d170-4a1d-8548-3c262f688bb8	5de857df-a081-4082-a778-8653df02a42c	\N	Been using this for months. Works great on trending markets.	reply-fp-markets-slippage-on-nfp-day-1761583145903-mqrmy35	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:05.912558	2025-10-27 16:39:05.912558
1bb8923b-a310-4984-8b33-c63f573600ac	64d66744-88d4-4159-bdf0-300dc69394c8	607766e0-6d78-4482-84ba-5718d78e937f	\N	Been using this for months. Works great on trending markets.	reply-position-trading-on-w1-holding-for-months-1761583145921-q7xyzht	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:05.930499	2025-10-27 16:39:05.930499
b65f5289-8a04-4bcd-9ec2-9e9ed50b744b	64d66744-88d4-4159-bdf0-300dc69394c8	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	This only works in specific market conditions. Be careful.	reply-position-trading-on-w1-holding-for-months-1761583145940-7d7xlkl	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.948221	2025-10-27 16:39:05.948221
2495222a-09af-4abe-86dc-1cb1cc371518	ea537a7d-eab4-478b-bf66-d422928a86c1	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	This only works in specific market conditions. Be careful.	reply-python-trading-bot-for-mt5-anyone-tried-it-1761583145956-cedthcu	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:05.964377	2025-10-27 16:39:05.964377
e38991b1-94d1-45b3-a572-a80c6962644b	ea537a7d-eab4-478b-bf66-d422928a86c1	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-python-trading-bot-for-mt5-anyone-tried-it-1761583145973-ndangnf	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:05.980945	2025-10-27 16:39:05.980945
56baf50e-0f6e-4d73-affa-cd6c2df0355c	3111638e-f07d-4e26-ba83-3e1f6f9276fd	5de857df-a081-4082-a778-8653df02a42c	\N	Awesome! Keep us updated with your progress.	reply-backtesting-results-vs-forward-testing-huge-difference-1761583145989-payrvxm	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:05.996383	2025-10-27 16:39:05.996383
e4045e92-dfe6-425b-8cb4-f4c59855a068	3111638e-f07d-4e26-ba83-3e1f6f9276fd	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Awesome! Keep us updated with your progress.	reply-backtesting-results-vs-forward-testing-huge-difference-1761583146005-hpmimql	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:06.013578	2025-10-27 16:39:06.013578
5287cafa-09ee-4cfd-9b9a-f1aca0d2f6b6	3111638e-f07d-4e26-ba83-3e1f6f9276fd	607766e0-6d78-4482-84ba-5718d78e937f	\N	Thanks for sharing! This is really helpful.	reply-backtesting-results-vs-forward-testing-huge-difference-1761583146022-zo1zzhr	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:06.030084	2025-10-27 16:39:06.030084
af65c8ff-16b6-4283-9e0f-35785a660f58	3111638e-f07d-4e26-ba83-3e1f6f9276fd	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-backtesting-results-vs-forward-testing-huge-difference-1761583146038-pgpg0qt	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:06.047066	2025-10-27 16:39:06.047066
cfc1d253-fc4a-4dc3-a8a2-f57cedb96456	c89a1a6b-d29f-4ec8-b7d4-96382e884a21	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Interesting approach. Have you considered adding a trend filter?	reply-trading-psychology-how-to-handle-losing-streaks-1761583146055-yydko7e	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:06.063721	2025-10-27 16:39:06.063721
74c27434-b3b0-4ddf-84b5-e41e386b91e7	c89a1a6b-d29f-4ec8-b7d4-96382e884a21	607766e0-6d78-4482-84ba-5718d78e937f	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-trading-psychology-how-to-handle-losing-streaks-1761583146072-l2s7n90	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:06.079656	2025-10-27 16:39:06.079656
bd1995d6-68a0-467a-9f92-1ea1585bd828	a6bb27f8-fdcf-46ee-95c7-0b7b48099038	7424f4cb-3490-4b20-b08a-8728e5786303	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-support-and-resistance-indicators-do-they-work-1761583146088-y8jtfyi	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:06.097064	2025-10-27 16:39:06.097064
017587c7-1042-4776-95e2-9aac52f1ffe3	a6bb27f8-fdcf-46ee-95c7-0b7b48099038	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-support-and-resistance-indicators-do-they-work-1761583146105-zp6spm8	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:06.113553	2025-10-27 16:39:06.113553
5c60c15d-4d7d-4e1f-81b8-1e501cc32e80	a6bb27f8-fdcf-46ee-95c7-0b7b48099038	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	This only works in specific market conditions. Be careful.	reply-support-and-resistance-indicators-do-they-work-1761583146124-l5benr2	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:06.1325	2025-10-27 16:39:06.1325
c04b0551-06e2-4ba7-b09c-bd78c8e05741	a6bb27f8-fdcf-46ee-95c7-0b7b48099038	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	This only works in specific market conditions. Be careful.	reply-support-and-resistance-indicators-do-they-work-1761583146141-od0pua8	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:06.15208	2025-10-27 16:39:06.15208
8e60d443-12c0-4174-b271-d78bffb79f68	01b8d856-3ef6-4883-8074-36ecdac6c340	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Interesting approach. Have you considered adding a trend filter?	reply-exness-withdrawal-instant-to-crypto-wallet-1761583146160-ds647ev	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:06.168586	2025-10-27 16:39:06.168586
9506a9cc-b11c-4c4a-95c1-5effdad50a73	01b8d856-3ef6-4883-8074-36ecdac6c340	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	\N	Interesting approach. Have you considered adding a trend filter?	reply-exness-withdrawal-instant-to-crypto-wallet-1761583146177-8jywmpd	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:06.185075	2025-10-27 16:39:06.185075
3efda49d-3890-441b-9d73-24ffef13fa51	4317f3bc-bb9f-4d95-a5b1-e006c4be8a26	607766e0-6d78-4482-84ba-5718d78e937f	\N	Thanks for the detailed explanation. Very informative!	reply-risk-management-calculator-excel-vs-app-1761583146194-0br30ka	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:06.202072	2025-10-27 16:39:06.202072
6ad8ebbe-25f4-4480-b1b1-b86cb630d7e1	4317f3bc-bb9f-4d95-a5b1-e006c4be8a26	7424f4cb-3490-4b20-b08a-8728e5786303	\N	Thanks for sharing! This is really helpful.	reply-risk-management-calculator-excel-vs-app-1761583146213-69dwbae	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:06.2215	2025-10-27 16:39:06.2215
5d7b7ed3-4139-4c38-a363-c8a921fc9c16	4317f3bc-bb9f-4d95-a5b1-e006c4be8a26	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	Thanks for the detailed explanation. Very informative!	reply-risk-management-calculator-excel-vs-app-1761583146230-vp1jeqp	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:06.237914	2025-10-27 16:39:06.237914
ac497645-c93b-4771-af66-8e940d63a0be	3d5206ce-a13c-447f-adf9-17bf307a2e4e	4167a292-537e-41f3-a8de-f77fe7ae0c29	\N	Awesome! Keep us updated with your progress.	reply-mt4-ea-keeps-crashing-on-vps-1761583146247-z3xeie4	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:06.254821	2025-10-27 16:39:06.254821
645f27a0-b274-491c-a662-d9dfe569eb33	3d5206ce-a13c-447f-adf9-17bf307a2e4e	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-mt4-ea-keeps-crashing-on-vps-1761583146266-4dxrbqz	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:06.274386	2025-10-27 16:39:06.274386
9a9747b3-720d-4383-b48b-412058dd47a2	220ea047-1dc8-41d3-a927-7632002beff4	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Thanks for sharing! This is really helpful.	reply-live-trading-journal-xauusd-scalping-results-1761583146283-nc62cri	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:06.2909	2025-10-27 16:39:06.2909
6cf44628-ddc0-41c2-a85c-77004e07daa6	220ea047-1dc8-41d3-a927-7632002beff4	5de857df-a081-4082-a778-8653df02a42c	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-live-trading-journal-xauusd-scalping-results-1761583146299-r3nzowf	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:06.317685	2025-10-27 16:39:06.317685
c2cb4ab7-08b6-4509-8144-f5a10a20e72c	220ea047-1dc8-41d3-a927-7632002beff4	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Been using this for months. Works great on trending markets.	reply-live-trading-journal-xauusd-scalping-results-1761583146326-7g9ggpy	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.334	2025-10-27 16:39:06.334
ef9faf5a-7ccf-41a2-bb4f-4b2cd7cbbd65	ce7b0506-ab3c-4cb9-9f34-a22e3935b57f	5de857df-a081-4082-a778-8653df02a42c	\N	Thanks for the detailed explanation. Very informative!	reply-fundamental-analysis-for-forex-does-it-matter-1761583146342-3yds837	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:06.350501	2025-10-27 16:39:06.350501
607f2a80-b332-46fd-9335-9b82b44eb56e	ce7b0506-ab3c-4cb9-9f34-a22e3935b57f	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Thanks for the detailed explanation. Very informative!	reply-fundamental-analysis-for-forex-does-it-matter-1761583146359-8ce3kqt	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:06.366822	2025-10-27 16:39:06.366822
6636fd4d-42b2-45f0-860e-ff597f30bd76	ce7b0506-ab3c-4cb9-9f34-a22e3935b57f	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	Been using this for months. Works great on trending markets.	reply-fundamental-analysis-for-forex-does-it-matter-1761583146375-q0agxqh	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.383133	2025-10-27 16:39:06.383133
29d1d91d-0a51-444d-8f95-fc434726fc3a	1e71371c-8025-4df2-89b1-485c63ec8bd1	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-trade-copier-software-which-one-is-best-1761583146392-68gx495	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:06.400491	2025-10-27 16:39:06.400491
89b104b6-3952-4eff-a342-46f3ef72f2a1	1e71371c-8025-4df2-89b1-485c63ec8bd1	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-trade-copier-software-which-one-is-best-1761583146409-0dyvnkv	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:06.416923	2025-10-27 16:39:06.416923
aa99109b-b035-4973-b8a1-dcb7055b03df	1e71371c-8025-4df2-89b1-485c63ec8bd1	607766e0-6d78-4482-84ba-5718d78e937f	\N	Great results! Can you share your settings?	reply-trade-copier-software-which-one-is-best-1761583146425-jdblwu2	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:06.433536	2025-10-27 16:39:06.433536
9b58183f-4935-49e2-ab3b-f0de90d79736	e9c44b64-6462-43a8-b1eb-b1c390ea531f	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-regulated-brokers-is-fca-really-better-1761583146442-qqkiedv	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:06.449806	2025-10-27 16:39:06.449806
77dede59-59c7-468a-99db-5473ac879a5f	e9c44b64-6462-43a8-b1eb-b1c390ea531f	5de857df-a081-4082-a778-8653df02a42c	\N	Awesome! Keep us updated with your progress.	reply-regulated-brokers-is-fca-really-better-1761583146458-rog0o2w	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:06.466168	2025-10-27 16:39:06.466168
f99bf4dd-0e9d-4506-9b7d-afdfdec6ed97	e9c44b64-6462-43a8-b1eb-b1c390ea531f	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-regulated-brokers-is-fca-really-better-1761583146476-ts5ljts	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:06.483776	2025-10-27 16:39:06.483776
1c2c6b38-cecb-4158-a31b-d144a3d65a58	e9c44b64-6462-43a8-b1eb-b1c390ea531f	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Thanks for the detailed explanation. Very informative!	reply-regulated-brokers-is-fca-really-better-1761583146495-evly1en	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:06.504704	2025-10-27 16:39:06.504704
93186e8d-ac1a-4c15-bff8-806e512f94bd	3bcae42f-2cf3-44b7-880a-9585fa2f383a	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Thanks for the detailed explanation. Very informative!	reply-technical-analysis-course-free-resources-1761583146514-35i0ibr	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:06.522238	2025-10-27 16:39:06.522238
938be615-aea3-4fd7-9515-8d9aff9770ea	3bcae42f-2cf3-44b7-880a-9585fa2f383a	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Been using this for months. Works great on trending markets.	reply-technical-analysis-course-free-resources-1761583146531-uu3y0yn	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.539325	2025-10-27 16:39:06.539325
ab91cc0f-fc8f-42fe-ab4a-b91f9c5437fd	b8146177-7c1f-4743-b564-fcfdfa36e6f4	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	This only works in specific market conditions. Be careful.	reply-breakout-ea-on-gbpusd-15-monthly-returns-1761583146557-eemdo3r	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:06.566735	2025-10-27 16:39:06.566735
124cb8da-1dce-4e4f-a7a5-794bd2a60a00	b8146177-7c1f-4743-b564-fcfdfa36e6f4	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	\N	Awesome! Keep us updated with your progress.	reply-breakout-ea-on-gbpusd-15-monthly-returns-1761583146578-t6fcgcy	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:06.586109	2025-10-27 16:39:06.586109
28c68ebb-cb67-45fb-8b2a-08d393e7b2fb	eab533f8-4895-453b-b302-7410861db0ba	53943ec5-cbc1-48b8-a561-9b8109476fc9	\N	Been using this for months. Works great on trending markets.	reply-signal-services-are-they-worth-it-1761583146594-z8pj5i2	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.602678	2025-10-27 16:39:06.602678
1db995c8-fb5c-494b-8dcb-d97f6a0a5ffe	eab533f8-4895-453b-b302-7410861db0ba	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Interesting approach. Have you considered adding a trend filter?	reply-signal-services-are-they-worth-it-1761583146611-z8c5rd6	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:06.618227	2025-10-27 16:39:06.618227
63646de9-8468-4faf-a156-e5e144c7d676	eab533f8-4895-453b-b302-7410861db0ba	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Awesome! Keep us updated with your progress.	reply-signal-services-are-they-worth-it-1761583146628-pv1lk39	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:06.635813	2025-10-27 16:39:06.635813
53b00bfc-c0ba-49fb-9e05-b4b6f1c4aa6b	eab533f8-4895-453b-b302-7410861db0ba	7424f4cb-3490-4b20-b08a-8728e5786303	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-signal-services-are-they-worth-it-1761583146644-nqx19cl	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:06.654032	2025-10-27 16:39:06.654032
f163ce57-cb88-4a75-a6e2-ee6e4954df04	b777585d-7825-4862-9d79-fb3b6d2d77f1	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	This only works in specific market conditions. Be careful.	reply-ctrader-vs-mt5-which-platform-is-better-1761583146663-t2f0cdx	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:06.671083	2025-10-27 16:39:06.671083
cedb05fb-8801-4658-855d-908c5380b1bb	b777585d-7825-4862-9d79-fb3b6d2d77f1	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Great results! Can you share your settings?	reply-ctrader-vs-mt5-which-platform-is-better-1761583146684-e13kjlw	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:06.691337	2025-10-27 16:39:06.691337
6d4f53a8-1d39-44d6-bc05-0727fe66caeb	dbbdf173-1eef-481f-a7d2-3f773860932a	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Awesome! Keep us updated with your progress.	reply-volume-indicators-on-forex-do-they-work-1761583146700-phpm32g	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:06.7082	2025-10-27 16:39:06.7082
10087368-2386-464a-ad5f-75fbe0a078b5	dbbdf173-1eef-481f-a7d2-3f773860932a	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	Been using this for months. Works great on trending markets.	reply-volume-indicators-on-forex-do-they-work-1761583146716-c08483e	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.723278	2025-10-27 16:39:06.723278
e2f492a0-314c-4f52-9756-b45e447ed47a	dbbdf173-1eef-481f-a7d2-3f773860932a	7424f4cb-3490-4b20-b08a-8728e5786303	\N	Been using this for months. Works great on trending markets.	reply-volume-indicators-on-forex-do-they-work-1761583146732-yqisc6s	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.740142	2025-10-27 16:39:06.740142
faf29e74-f341-44f4-96ab-86bd73dbd69a	dbbdf173-1eef-481f-a7d2-3f773860932a	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-volume-indicators-on-forex-do-they-work-1761583146748-q49s5d5	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:06.756906	2025-10-27 16:39:06.756906
398ed752-7033-4bdc-b270-7f3234f68393	b98bc127-4afa-4c11-8629-bf16aefe6caa	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-market-maker-vs-ecn-brokers-huge-spread-difference-1761583146765-ps3vzu2	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:06.7734	2025-10-27 16:39:06.7734
f4901eb3-25a5-4213-88a8-bc36838249cb	65d6183a-ac27-4210-9022-864d27c11884	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Thanks for sharing! This is really helpful.	reply-freelance-ea-developer-needed-budget-200-1761583146782-io3lgm8	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:06.790081	2025-10-27 16:39:06.790081
55cf3580-2d47-4285-972a-c5a6d56dbcbb	65d6183a-ac27-4210-9022-864d27c11884	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	Been using this for months. Works great on trending markets.	reply-freelance-ea-developer-needed-budget-200-1761583146799-qk7gkcd	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.807409	2025-10-27 16:39:06.807409
8b2bb20d-1433-41a7-aab0-5f4bc50485ce	707d767a-e324-4037-b611-04eb7336a466	f9fab52c-da82-4291-ae6f-22e0eb8fd930	\N	This only works in specific market conditions. Be careful.	reply-strategy-backtesting-how-many-years-is-enough-1761583146816-abq1762	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:06.826273	2025-10-27 16:39:06.826273
acf4964a-5037-44fe-b7f7-17d7babe0076	707d767a-e324-4037-b611-04eb7336a466	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	This only works in specific market conditions. Be careful.	reply-strategy-backtesting-how-many-years-is-enough-1761583146837-yyej6x0	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:06.846637	2025-10-27 16:39:06.846637
6cdeb89c-3bd5-4191-bcab-56e7c35492f6	f6380739-710f-4c30-ba57-047e16c6009e	607766e0-6d78-4482-84ba-5718d78e937f	\N	Interesting approach. Have you considered adding a trend filter?	reply-forward-test-results-ea-stopped-working-after-2-months-1761583146855-571ad9f	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:06.862143	2025-10-27 16:39:06.862143
0205d287-1a4c-4d62-8928-d14e4f73aeb4	f6380739-710f-4c30-ba57-047e16c6009e	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-forward-test-results-ea-stopped-working-after-2-months-1761583146871-hwv4xs5	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:06.879518	2025-10-27 16:39:06.879518
286d9b35-aacc-4e1f-8666-0266e0543f28	f6380739-710f-4c30-ba57-047e16c6009e	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Interesting approach. Have you considered adding a trend filter?	reply-forward-test-results-ea-stopped-working-after-2-months-1761583146888-eq092go	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:06.896178	2025-10-27 16:39:06.896178
aa8f2ec5-740c-40e7-b8eb-66bd0185d593	964ea79a-aed6-4aff-be8a-2748363d58d2	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Great results! Can you share your settings?	reply-multi-pair-correlation-trading-how-many-pairs-1761583146904-xkqqo4o	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:06.912576	2025-10-27 16:39:06.912576
8bd92794-5987-482a-b332-8f988a4e7a9c	964ea79a-aed6-4aff-be8a-2748363d58d2	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for the detailed explanation. Very informative!	reply-multi-pair-correlation-trading-how-many-pairs-1761583146923-8oph9b0	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:06.930709	2025-10-27 16:39:06.930709
8403294e-5a99-4974-bb2f-868f2d0969f8	0e674d93-fd03-4bbb-ad9c-799d0e94a828	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Been using this for months. Works great on trending markets.	reply-beginners-corner-where-do-i-even-start-1761583146939-or9kzus	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:06.960622	2025-10-27 16:39:06.960622
a6e57928-8325-4627-98b0-e36d9b69b7f8	0e674d93-fd03-4bbb-ad9c-799d0e94a828	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Awesome! Keep us updated with your progress.	reply-beginners-corner-where-do-i-even-start-1761583146969-vhk2rw7	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:06.979937	2025-10-27 16:39:06.979937
6587ebbf-f995-42ac-b4d3-54dd84ee2a26	0e674d93-fd03-4bbb-ad9c-799d0e94a828	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-beginners-corner-where-do-i-even-start-1761583146988-ibmf90t	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:07.001367	2025-10-27 16:39:07.001367
2ecf8133-13a2-46ea-9043-4affb4bdf479	980d8823-0f9e-43ed-b2fa-a0f8fb78f467	f9fab52c-da82-4291-ae6f-22e0eb8fd930	\N	Thanks for the detailed explanation. Very informative!	reply-trend-indicators-ema-vs-sma-1761583147011-wo4scux	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:07.021556	2025-10-27 16:39:07.021556
542c0891-7181-42ca-aa8b-d3da343ee721	980d8823-0f9e-43ed-b2fa-a0f8fb78f467	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	\N	This only works in specific market conditions. Be careful.	reply-trend-indicators-ema-vs-sma-1761583147030-adk45zw	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:07.037828	2025-10-27 16:39:07.037828
e7d2011c-9e3d-49ee-a403-30b5e3289206	980d8823-0f9e-43ed-b2fa-a0f8fb78f467	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-trend-indicators-ema-vs-sma-1761583147047-aknij9p	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:07.056698	2025-10-27 16:39:07.056698
afdb7d69-2f3f-4944-8895-687ade254820	07a71660-cfb7-42e0-b3b5-984ab863a8ca	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	Been using this for months. Works great on trending markets.	reply-ea-performance-reports-how-to-analyze-them-1761583147065-8cm4vk1	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:07.072236	2025-10-27 16:39:07.072236
b3617a60-9695-4b3d-aa54-d07ffb18024d	07a71660-cfb7-42e0-b3b5-984ab863a8ca	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-ea-performance-reports-how-to-analyze-them-1761583147080-hpg01ie	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:07.088771	2025-10-27 16:39:07.088771
0251483f-8517-401b-bc41-11c717171de2	21942eb1-7c41-40e4-8c8f-aae4b3786280	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for sharing! This is really helpful.	reply-template-packs-for-mt4-any-good-free-ones-1761583147097-89diq2v	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:07.105306	2025-10-27 16:39:07.105306
476539d3-ec05-4275-9a9b-9e2afef8ee2e	21942eb1-7c41-40e4-8c8f-aae4b3786280	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Awesome! Keep us updated with your progress.	reply-template-packs-for-mt4-any-good-free-ones-1761583147113-vik7wd2	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.121703	2025-10-27 16:39:07.121703
9afd4d74-329b-4501-96a1-e6a7699a5456	5d1c8554-533c-4294-9c2c-6511cc128f9e	607766e0-6d78-4482-84ba-5718d78e937f	\N	Thanks for the detailed explanation. Very informative!	reply-mt5-ea-development-is-it-harder-than-mql4-1761583147130-l2q50z3	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:07.138085	2025-10-27 16:39:07.138085
01577756-d38c-410d-a865-0841ca1b2a5d	5d1c8554-533c-4294-9c2c-6511cc128f9e	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-mt5-ea-development-is-it-harder-than-mql4-1761583147146-cczjzlf	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:07.15312	2025-10-27 16:39:07.15312
a46f92c5-b562-4f64-87c5-be1df568dc8c	5d1c8554-533c-4294-9c2c-6511cc128f9e	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	Great results! Can you share your settings?	reply-mt5-ea-development-is-it-harder-than-mql4-1761583147161-1mch7g8	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:07.16984	2025-10-27 16:39:07.16984
3c89d33d-8af3-4163-b141-8c74415913b2	42a95838-d974-4b54-8995-f3a466f6b8f5	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-budget-ea-found-one-for-75-coins-worth-it-1761583147179-uki7mkq	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:07.187353	2025-10-27 16:39:07.187353
b9b2ff6a-415a-4eda-8eab-9810a6619496	42a95838-d974-4b54-8995-f3a466f6b8f5	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	\N	Interesting approach. Have you considered adding a trend filter?	reply-budget-ea-found-one-for-75-coins-worth-it-1761583147195-2lads23	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:07.203504	2025-10-27 16:39:07.203504
08eae187-3952-4231-a9bf-a5265c282fb8	42a95838-d974-4b54-8995-f3a466f6b8f5	5de857df-a081-4082-a778-8653df02a42c	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-budget-ea-found-one-for-75-coins-worth-it-1761583147212-1fi5f41	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:07.220383	2025-10-27 16:39:07.220383
14e41a44-cb67-4baf-9451-aa9449d2bd9e	0ffa838b-259f-4f2c-9a48-3d763a36ad8f	53943ec5-cbc1-48b8-a561-9b8109476fc9	\N	Great results! Can you share your settings?	reply-premium-ea-400-coins-but-lifetime-updates-1761583147229-ck7i9xy	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:07.236825	2025-10-27 16:39:07.236825
65ec4dc8-9e9f-4be7-a687-27b8af248d11	0ffa838b-259f-4f2c-9a48-3d763a36ad8f	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-premium-ea-400-coins-but-lifetime-updates-1761583147245-x0muay9	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:07.253681	2025-10-27 16:39:07.253681
e3c3eb74-5055-4b42-bd60-09930a809bea	03e14344-7f05-4f6b-9bcb-1a95104003d3	f9fab52c-da82-4291-ae6f-22e0eb8fd930	\N	Interesting approach. Have you considered adding a trend filter?	reply-news-trading-ea-does-it-even-work-1761583147262-urustzv	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:07.270231	2025-10-27 16:39:07.270231
c3949546-b22b-43b8-97db-61082c807f6f	eb954bd1-2ea4-4539-aa6e-658a06a1d929	f9fab52c-da82-4291-ae6f-22e0eb8fd930	\N	Awesome! Keep us updated with your progress.	reply-risk-management-how-much-per-trade-1761583147278-vox6u57	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.287445	2025-10-27 16:39:07.287445
ca72c0b1-d681-4d0b-b979-db3f8f2f1303	eb954bd1-2ea4-4539-aa6e-658a06a1d929	5de857df-a081-4082-a778-8653df02a42c	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-risk-management-how-much-per-trade-1761583147297-65s7cye	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:07.30574	2025-10-27 16:39:07.30574
8d9e6fab-f8ae-41e9-9904-d2dde8083f82	eb954bd1-2ea4-4539-aa6e-658a06a1d929	607766e0-6d78-4482-84ba-5718d78e937f	\N	Been using this for months. Works great on trending markets.	reply-risk-management-how-much-per-trade-1761583147316-26tvvzw	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:07.330474	2025-10-27 16:39:07.330474
3130d293-b524-49ca-a54f-ec3b5cee66f7	8fcbb9f9-3245-4675-9ccf-4eb19704f3c8	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	\N	Thanks for the detailed explanation. Very informative!	reply-tickmill-review-solid-broker-for-beginners-1761583147339-rzosfsx	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:07.347303	2025-10-27 16:39:07.347303
a64f707a-2997-441b-84ec-9352a317f567	8fcbb9f9-3245-4675-9ccf-4eb19704f3c8	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for the detailed explanation. Very informative!	reply-tickmill-review-solid-broker-for-beginners-1761583147367-0c16zes	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:07.382249	2025-10-27 16:39:07.382249
030ce636-b259-48ee-a23d-2a699aa45577	8fcbb9f9-3245-4675-9ccf-4eb19704f3c8	607766e0-6d78-4482-84ba-5718d78e937f	\N	Awesome! Keep us updated with your progress.	reply-tickmill-review-solid-broker-for-beginners-1761583147391-ij7zoxf	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.399527	2025-10-27 16:39:07.399527
cea14e89-3c05-4d2b-91b5-7623adfaa3c6	06cffe1e-29f6-4876-a556-7cb6917c7bf9	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Awesome! Keep us updated with your progress.	reply-asic-regulation-is-it-as-good-as-fca-1761583147411-1pz5q1a	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.418945	2025-10-27 16:39:07.418945
778a9b0e-1e26-4301-bbda-c7f79a8c29e5	06cffe1e-29f6-4876-a556-7cb6917c7bf9	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-asic-regulation-is-it-as-good-as-fca-1761583147427-cie82dq	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:07.435322	2025-10-27 16:39:07.435322
41a94116-c965-4d4c-900f-92ff679892ae	06cffe1e-29f6-4876-a556-7cb6917c7bf9	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Been using this for months. Works great on trending markets.	reply-asic-regulation-is-it-as-good-as-fca-1761583147443-x2tquf3	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:07.451577	2025-10-27 16:39:07.451577
d5a89e63-4823-4ce7-b814-26837c82491d	22374ecd-2974-494f-bd5f-3c83da0e85ff	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Thanks for sharing! This is really helpful.	reply-grid-trading-lost-2k-in-1-week-1761583147460-w3s3xpc	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:07.46786	2025-10-27 16:39:07.46786
0a7698dc-da9d-4ffe-8ba7-ba4a68d6ff62	22374ecd-2974-494f-bd5f-3c83da0e85ff	5de857df-a081-4082-a778-8653df02a42c	\N	Interesting approach. Have you considered adding a trend filter?	reply-grid-trading-lost-2k-in-1-week-1761583147477-yarmy6s	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:07.48473	2025-10-27 16:39:07.48473
87d5aefb-0e02-41ff-aed9-a41f64df75d1	22374ecd-2974-494f-bd5f-3c83da0e85ff	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Thanks for sharing! This is really helpful.	reply-grid-trading-lost-2k-in-1-week-1761583147493-6vhbv53	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:07.501343	2025-10-27 16:39:07.501343
07f2c0c2-61e9-4164-989c-2f38ad562a39	12afa39c-e841-441b-94ea-0d78dad1f845	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-scalping-eas-do-any-actually-work-long-term-1761583147509-n0qi902	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:07.525882	2025-10-27 16:39:07.525882
dbc0c79a-7e28-4f72-a733-a8d5aa82bbcd	12afa39c-e841-441b-94ea-0d78dad1f845	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	I wouldn't recommend this strategy. Too risky for beginners.	reply-scalping-eas-do-any-actually-work-long-term-1761583147534-fsc5oeu	I wouldn't recommend this strategy. Too risky for beginners.	\N	0	f	f	2025-10-27 16:39:07.541265	2025-10-27 16:39:07.541265
2e1d005a-18a0-4a22-b513-82c3cb11447e	12afa39c-e841-441b-94ea-0d78dad1f845	7424f4cb-3490-4b20-b08a-8728e5786303	\N	Awesome! Keep us updated with your progress.	reply-scalping-eas-do-any-actually-work-long-term-1761583147550-mhtutji	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.558054	2025-10-27 16:39:07.558054
d165a80c-8512-49e2-99f9-2e94877011eb	cff30735-7caf-4a28-a92e-1f1e0492b575	5de857df-a081-4082-a778-8653df02a42c	\N	Awesome! Keep us updated with your progress.	reply-day-trading-eurusd-london-session-best-1761583147566-p095pn8	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.574303	2025-10-27 16:39:07.574303
053b90af-70bc-4967-b58e-c7f5828d95c2	cff30735-7caf-4a28-a92e-1f1e0492b575	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	\N	Interesting approach. Have you considered adding a trend filter?	reply-day-trading-eurusd-london-session-best-1761583147582-vypujls	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:07.590725	2025-10-27 16:39:07.590725
7e7f0063-9bb9-41f7-a9ad-603388357ae3	cff30735-7caf-4a28-a92e-1f1e0492b575	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-day-trading-eurusd-london-session-best-1761583147599-2czazc8	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:07.606934	2025-10-27 16:39:07.606934
e21b05b8-ba69-4010-95db-197d99ae9c12	c290ea00-571f-43cb-a3d9-4ea4aa7fb91c	7424f4cb-3490-4b20-b08a-8728e5786303	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-swing-trading-closed-3-trades-this-week-all-winners-1761583147615-f7ozxrv	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:07.624963	2025-10-27 16:39:07.624963
14da188e-397c-4b3f-b415-388066f66f34	c290ea00-571f-43cb-a3d9-4ea4aa7fb91c	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Interesting approach. Have you considered adding a trend filter?	reply-swing-trading-closed-3-trades-this-week-all-winners-1761583147633-9qhhg9c	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:07.641136	2025-10-27 16:39:07.641136
c0ef49f7-b797-46f6-93e4-aedfddf3448c	5ae1d836-ccf2-49da-90fe-351dddb0f9e9	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	\N	This only works in specific market conditions. Be careful.	reply-position-trading-on-gold-holding-for-6-months-1761583147650-npvxjt0	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:07.657924	2025-10-27 16:39:07.657924
2e273364-234c-4bae-9a80-15aac433754b	5ae1d836-ccf2-49da-90fe-351dddb0f9e9	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	This only works in specific market conditions. Be careful.	reply-position-trading-on-gold-holding-for-6-months-1761583147669-xgjta9t	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:07.678592	2025-10-27 16:39:07.678592
3ddbfede-011f-4053-add4-6a0b9b84fed1	5ae1d836-ccf2-49da-90fe-351dddb0f9e9	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	Thanks for sharing! This is really helpful.	reply-position-trading-on-gold-holding-for-6-months-1761583147687-y3v8gn8	Thanks for sharing! This is really helpful.	\N	0	f	f	2025-10-27 16:39:07.695497	2025-10-27 16:39:07.695497
1f12003b-7fee-4c98-910c-46e7229a6bfb	bd452157-03bf-46a2-a1f6-6594aba6f13c	5de857df-a081-4082-a778-8653df02a42c	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-hedging-strategy-how-to-calculate-position-sizes-1761583147703-be2c869	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:07.711651	2025-10-27 16:39:07.711651
8c8452a6-62bf-4290-a87d-081b6d3bdb6f	bd452157-03bf-46a2-a1f6-6594aba6f13c	4984962b-9a4c-42ed-8ade-d93db006a4d0	\N	This only works in specific market conditions. Be careful.	reply-hedging-strategy-how-to-calculate-position-sizes-1761583147720-l7vlx9t	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:07.729477	2025-10-27 16:39:07.729477
5009894b-cec3-4b29-9bcc-e263dbd6b426	bd452157-03bf-46a2-a1f6-6594aba6f13c	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Been using this for months. Works great on trending markets.	reply-hedging-strategy-how-to-calculate-position-sizes-1761583147738-0kz9cjx	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:07.746492	2025-10-27 16:39:07.746492
d243981c-34bd-451b-8ac3-dec45d0a5ffa	1853f20b-eb1f-424f-ae80-7b4ad9e5b9f3	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Been using this for months. Works great on trending markets.	reply-python-bot-vs-mql5-ea-which-is-faster-1761583147755-oc5tqqc	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:07.763381	2025-10-27 16:39:07.763381
4086e2ea-d893-4612-8c37-3c5e749989d2	1853f20b-eb1f-424f-ae80-7b4ad9e5b9f3	5de857df-a081-4082-a778-8653df02a42c	\N	Great results! Can you share your settings?	reply-python-bot-vs-mql5-ea-which-is-faster-1761583147772-5xy34ip	Great results! Can you share your settings?	\N	0	f	f	2025-10-27 16:39:07.779736	2025-10-27 16:39:07.779736
8c7a519f-4db0-4580-aeb4-47c42c5afc90	1853f20b-eb1f-424f-ae80-7b4ad9e5b9f3	607766e0-6d78-4482-84ba-5718d78e937f	\N	Interesting approach. Have you considered adding a trend filter?	reply-python-bot-vs-mql5-ea-which-is-faster-1761583147788-tqrbe7k	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:07.795896	2025-10-27 16:39:07.795896
93f6b82d-4510-4b94-8a81-fe1bb15b6531	733910b1-e164-41f2-a144-15efb859d16d	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Awesome! Keep us updated with your progress.	reply-beginner-question-what-is-leverage-1761583147807-t4xd80u	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.814734	2025-10-27 16:39:07.814734
ef506486-6c3a-47b5-b2f6-196088e8c195	733910b1-e164-41f2-a144-15efb859d16d	607766e0-6d78-4482-84ba-5718d78e937f	\N	This only works in specific market conditions. Be careful.	reply-beginner-question-what-is-leverage-1761583147823-yj7v6go	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:07.831892	2025-10-27 16:39:07.831892
70841ef7-dd31-410b-8b6d-b19a314d3eaf	733910b1-e164-41f2-a144-15efb859d16d	5de857df-a081-4082-a778-8653df02a42c	\N	Awesome! Keep us updated with your progress.	reply-beginner-question-what-is-leverage-1761583147840-buboo1c	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.847237	2025-10-27 16:39:07.847237
b7beb375-5a75-494c-8ae3-08ea196f26a7	733910b1-e164-41f2-a144-15efb859d16d	40c33800-e478-43fa-9c2c-e9e73c806541	\N	Interesting approach. Have you considered adding a trend filter?	reply-beginner-question-what-is-leverage-1761583147855-alfu8or	Interesting approach. Have you considered adding a trend filter?	\N	0	f	f	2025-10-27 16:39:07.863637	2025-10-27 16:39:07.863637
9e24394a-234e-465c-9a8b-631d63fa5796	f0d24926-8128-4f79-bddf-77cb60ef3a83	53943ec5-cbc1-48b8-a561-9b8109476fc9	\N	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	reply-eurusd-scalping-best-indicators-1761583147872-9kr7kzx	I had the same issue. Adjusting my stop loss to 1.5x ATR helped.	\N	0	f	f	2025-10-27 16:39:07.879951	2025-10-27 16:39:07.879951
8d74df65-9c26-44fb-8212-4ff12b66cb10	f0d24926-8128-4f79-bddf-77cb60ef3a83	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	This only works in specific market conditions. Be careful.	reply-eurusd-scalping-best-indicators-1761583147888-39weyz4	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:07.896124	2025-10-27 16:39:07.896124
bb68acf2-6c68-4ecc-befe-760ba729bc8d	39140584-e353-4aed-a5fe-45d876539d0b	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	Awesome! Keep us updated with your progress.	reply-mql5-programming-where-to-start-1761583147922-r43lahp	Awesome! Keep us updated with your progress.	\N	0	f	f	2025-10-27 16:39:07.93011	2025-10-27 16:39:07.93011
11f660f2-4c82-4fac-b999-1f46845b72c6	39140584-e353-4aed-a5fe-45d876539d0b	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Thanks for the detailed explanation. Very informative!	reply-mql5-programming-where-to-start-1761583147938-apqf3ib	Thanks for the detailed explanation. Very informative!	\N	0	f	f	2025-10-27 16:39:07.946692	2025-10-27 16:39:07.946692
0779ff27-b758-4295-ac12-1b650cc283dd	39140584-e353-4aed-a5fe-45d876539d0b	f9fab52c-da82-4291-ae6f-22e0eb8fd930	\N	Been using this for months. Works great on trending markets.	reply-mql5-programming-where-to-start-1761583147955-4pw7f19	Been using this for months. Works great on trending markets.	\N	0	f	f	2025-10-27 16:39:07.962254	2025-10-27 16:39:07.962254
71c03993-98bf-4a5e-954f-0e914dc449dc	81e16228-6a6e-431e-b48a-7c7b0e14076f	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	This only works in specific market conditions. Be careful.	reply-trend-following-on-h4-which-pairs-work-best-1761583147988-u3fq5z5	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:07.996126	2025-10-27 16:39:07.996126
0a600624-45a0-4ee9-8507-e1ce935acae8	535a7da6-8f5d-434e-9d2f-01ca881e86cb	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	\N	I tried this and lost money. Maybe I'm doing something wrong?	reply-vps-in-singapore-vs-london-latency-comparison-1761583148005-aeiw2a5	I tried this and lost money. Maybe I'm doing something wrong?	\N	0	f	f	2025-10-27 16:39:08.012823	2025-10-27 16:39:08.012823
53a7436c-bbf2-4c1c-96ea-71ab21de6a5f	535a7da6-8f5d-434e-9d2f-01ca881e86cb	7424f4cb-3490-4b20-b08a-8728e5786303	\N	This only works in specific market conditions. Be careful.	reply-vps-in-singapore-vs-london-latency-comparison-1761583148021-uz69whx	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:08.029248	2025-10-27 16:39:08.029248
610664fa-88fa-4b41-98ed-066a75a426f3	535a7da6-8f5d-434e-9d2f-01ca881e86cb	3d24a70f-a003-4e35-b501-c0faf77434b1	\N	This only works in specific market conditions. Be careful.	reply-vps-in-singapore-vs-london-latency-comparison-1761583148038-atam0x3	This only works in specific market conditions. Be careful.	\N	0	f	f	2025-10-27 16:39:08.050636	2025-10-27 16:39:08.050636
6d074363-e8c2-4f4d-aec5-b8ca0e26cba7	81e16228-6a6e-431e-b48a-7c7b0e14076f	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	Interesting approach. Have you considered adding a trend filter?	reply-trend-following-on-h4-which-pairs-work-best-1761583147971-bozuc4j	Interesting approach. Have you considered adding a trend filter?	\N	1	f	f	2025-10-27 16:39:07.978994	2025-10-27 16:39:07.978994
12ee72af-140f-4277-8e2b-c7cd7ee89f87	eab533f8-4895-453b-b302-7410861db0ba	49065260	\N	Yes it is good	reply-to-signal-services-are-they-worth-it-by-puspal-609f9d	Yes it is good	\N	0	f	f	2025-10-28 06:06:15.203864	2025-10-28 06:06:15.203864
\.


--
-- Data for Name: forum_threads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.forum_threads (id, author_id, category_slug, title, body, slug, focus_keyword, meta_description, is_pinned, is_locked, is_solved, views, reply_count, last_activity_at, status, engagement_score, last_score_update, created_at, updated_at, subcategory_slug, thread_type, seo_excerpt, primary_keyword, language, instruments, timeframes, strategies, platform, broker, risk_note, hashtags, review_target, review_version, review_rating, review_pros, review_cons, question_summary, accepted_answer_id, attachment_urls, like_count, bookmark_count, share_count) FROM stdin;
707d767a-e324-4037-b611-04eb7336a466	53943ec5-cbc1-48b8-a561-9b8109476fc9	strategy-backtesting	Strategy backtesting – how many years is enough?	Backtesting my strategy over 5 years of data. Is that enough or should I go back 10 years? More data = better results or just overfitting?	strategy-backtesting-how-many-years-is-enough	\N	\N	f	f	f	359	2	2025-10-27 16:39:04.590084	approved	88	2025-10-28 10:33:56.016	2025-10-27 16:39:04.590084	2025-10-27 16:39:04.590084	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
c290ea00-571f-43cb-a3d9-4ea4aa7fb91c	97ba45ea-c4ae-4f8d-8216-cf304ce353af	swing-trading	Swing trading – closed 3 trades this week, all winners	Swing trading update: Closed 3 trades this week, all winners. Total +450 pips. Patience really pays off in swing trading. Not as exciting as scalping but more consistent.	swing-trading-closed-3-trades-this-week-all-winners	\N	\N	f	f	f	224	2	2025-10-27 16:39:04.89006	approved	62	2025-10-28 10:33:56.072	2025-10-27 16:39:04.89006	2025-10-27 16:39:04.89006	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
220ea047-1dc8-41d3-a927-7632002beff4	3d24a70f-a003-4e35-b501-c0faf77434b1	live-trading-journals	Live trading journal – XAUUSD scalping results	Starting a public journal to track my XAUUSD scalping. Will post daily results. Currently at +250 pips for the month. Let's see if I can maintain this.	live-trading-journal-xauusd-scalping-results	\N	\N	f	f	f	300	3	2025-10-27 16:39:04.407439	approved	87	2025-10-28 10:33:56.15	2025-10-27 16:39:04.407439	2025-10-27 16:39:04.407439	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
bd452157-03bf-46a2-a1f6-6594aba6f13c	607766e0-6d78-4482-84ba-5718d78e937f	hedging	Hedging strategy – how to calculate position sizes?	Want to hedge EURUSD with USDCHF. How do you calculate the position sizes to balance the hedge? Equal lots or need to adjust for correlation strength?	hedging-strategy-how-to-calculate-position-sizes	\N	\N	f	f	f	487	3	2025-10-27 16:39:04.926362	approved	122	2025-10-28 10:33:56.201	2025-10-27 16:39:04.926362	2025-10-27 16:39:04.926362	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
6d55dbce-101b-41d3-ad25-0ead3907be4b	40c33800-e478-43fa-9c2c-e9e73c806541	grid-trading-eas	Grid EA on EURUSD – is 20 pip grid too tight?	Running a grid EA on EURUSD with 20 pip spacing. Works in ranging markets but blows up when it trends. Should I widen the grid or add a stop loss?	grid-ea-on-eurusd-is-20-pip-grid-too-tight	\N	\N	f	f	f	540	3	2025-10-27 16:36:17.286282	approved	132	2025-10-28 10:33:56.274	2025-10-27 16:36:17.286282	2025-10-27 16:36:17.286282	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
b777585d-7825-4862-9d79-fb3b6d2d77f1	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	ctrader-robots	cTrader vs MT5 – which platform is better?	Been using MT4 forever. Considering switching to either cTrader or MT5. Which one has better features for automated trading?	ctrader-vs-mt5-which-platform-is-better	\N	\N	f	f	f	277	2	2025-10-27 16:39:04.523769	approved	72	2025-10-28 10:33:56.317	2025-10-27 16:39:04.523769	2025-10-27 16:39:04.523769	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
42a95838-d974-4b54-8995-f3a466f6b8f5	40c33800-e478-43fa-9c2c-e9e73c806541	budget-eas-50-100	Budget EA – found one for 75 coins, worth it?	Saw a budget EA listed for 75 coins. Looks promising from the description but no reviews yet. Should I risk it or wait for reviews?	budget-ea-found-one-for-75-coins-worth-it	\N	\N	f	f	f	161	3	2025-10-27 16:39:04.727221	approved	60	2025-10-28 10:33:55.904	2025-10-27 16:39:04.727221	2025-10-27 16:39:04.727221	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
5d1c8554-533c-4294-9c2c-6511cc128f9e	53943ec5-cbc1-48b8-a561-9b8109476fc9	mt5-eas	MT5 EA development – is it harder than MQL4?	Learned MQL4 pretty well. Considering learning MQL5 but heard it's more complex. Is the learning curve steep? Worth the effort?	mt5-ea-development-is-it-harder-than-mql4	\N	\N	f	f	f	487	3	2025-10-27 16:39:04.710633	approved	122	2025-10-28 10:33:55.979	2025-10-27 16:39:04.710633	2025-10-27 16:39:04.710633	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
04c71773-162f-411e-ae3b-51884a159855	21ce8c06-6b65-4cab-9961-ac99121e0696	ecn-brokers	IC Markets vs Pepperstone for scalping	Which broker is better for scalping XAUUSD? IC Markets has tighter spreads but Pepperstone has better execution. Anyone tested both?	ic-markets-vs-pepperstone-for-scalping	\N	\N	f	f	f	386	2	2025-10-27 16:36:17.301744	approved	93	2025-10-28 10:33:56.35	2025-10-27 16:36:17.301744	2025-10-27 16:36:17.301744	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
6ec0b6e4-6363-4c79-b0f4-3a0439a0029d	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	crypto-scalping	My BTCUSD scalping strategy – 500 pips in 2 weeks	Finally profitable with crypto scalping! Using a simple EMA crossover on M15 timeframe. Risk management is key – never risk more than 2% per trade. Happy to share the details if anyone is interested.	my-btcusd-scalping-strategy-500-pips-in-2-weeks	\N	\N	f	f	f	98	3	2025-10-27 16:36:17.317699	approved	48	2025-10-28 10:33:56.437	2025-10-27 16:36:17.317699	2025-10-27 16:36:17.317699	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
efdbf07f-3feb-45dd-a295-cdd68cba1065	607766e0-6d78-4482-84ba-5718d78e937f	hedging	Hedging strategy for correlated pairs	Anyone using hedge strategies on EURUSD and USDCHF? They're negatively correlated so theoretically you can reduce risk. But spreads eat into profits. Worth it?	hedging-strategy-for-correlated-pairs	\N	\N	f	f	f	397	3	2025-10-27 16:36:17.458755	approved	105	2025-10-28 10:33:56.589	2025-10-27 16:36:17.458755	2025-10-27 16:36:17.458755	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
7d0b24ab-1dff-4545-8c17-397cf630df47	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	news-scalping	News scalping on NFP – best pairs to trade?	NFP day is coming up. Planning to scalp the news release. EURUSD and XAUUSD are obvious choices but what about GBPUSD? Too volatile?	news-scalping-on-nfp-best-pairs-to-trade	\N	\N	f	f	f	373	3	2025-10-27 16:36:17.351928	approved	100	2025-10-28 10:33:56.627	2025-10-27 16:36:17.351928	2025-10-27 16:36:17.351928	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
0dc77b6c-ed4a-4d81-9a30-1556a1ecd3d2	f9fab52c-da82-4291-ae6f-22e0eb8fd930	vps-services	VPS recommendations for MT4 EAs	Need a reliable VPS for running my EAs 24/7. Currently using ForexVPS but it's expensive. Any cheaper alternatives with low latency?	vps-recommendations-for-mt4-eas	\N	\N	f	f	f	493	3	2025-10-27 16:36:17.475231	approved	123	2025-10-28 10:33:56.681	2025-10-27 16:36:17.475231	2025-10-27 16:36:17.475231	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
2e52de40-a925-4ba6-a4f3-70183b085b7f	4984962b-9a4c-42ed-8ade-d93db006a4d0	trend-following-eas	Trend following EA – 70% win rate backtest	Backtested a trend following EA on GBPUSD H4. 70% win rate over 2 years! Anyone interested in testing it on demo? Free to share with the community.	trend-following-ea-70-win-rate-backtest	\N	\N	f	f	f	73	2	2025-10-27 16:36:17.381886	approved	33	2025-10-28 10:33:56.753	2025-10-27 16:36:17.381886	2025-10-27 16:36:17.381886	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
78029733-c50b-4a12-bc65-83b2300e35ff	5de857df-a081-4082-a778-8653df02a42c	scam-watch	XM broker blocked my withdrawal – SCAM ALERT	XM is refusing to process my withdrawal. They keep asking for more documents. Been trading with them for 6 months and suddenly this happens. Avoid this broker!	xm-broker-blocked-my-withdrawal-scam-alert	\N	\N	f	f	f	123	2	2025-10-27 16:36:17.400528	approved	43	2025-10-28 10:33:56.794	2025-10-27 16:36:17.400528	2025-10-27 16:36:17.400528	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
01b88c38-33ea-485b-bba8-42fa47e87c35	7424f4cb-3490-4b20-b08a-8728e5786303	grid-martingale	Martingale on EURUSD – lost my account again 😭	Third time blowing my account with martingale. I know it's risky but the profits are so tempting when it works. Should I just quit forex?	martingale-on-eurusd-lost-my-account-again-	\N	\N	f	f	f	420	4	2025-10-27 16:36:17.366698	approved	119	2025-10-28 10:33:56.826	2025-10-27 16:36:17.366698	2025-10-27 16:36:17.366698	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
5e1267a4-e6d7-4c36-9f44-1997b77b1322	97ba45ea-c4ae-4f8d-8216-cf304ce353af	swing-trading	Swing trading on D1 – patience is key	Finally profitable after 2 years of losing. Switched from scalping to swing trading on D1 timeframe. Less stress, better results. Sometimes slow and steady wins the race.	swing-trading-on-d1-patience-is-key	\N	\N	f	f	f	278	2	2025-10-27 16:36:17.492099	approved	73	2025-10-28 10:33:56.858	2025-10-27 16:36:17.492099	2025-10-27 16:36:17.492099	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
578d8008-9584-47b6-bd04-31517b49ff14	53943ec5-cbc1-48b8-a561-9b8109476fc9	mql4	MQL4 vs MQL5 – which should I learn first?	Want to start coding my own EAs. Is MQL4 easier for beginners? Or should I jump straight to MQL5 since it's newer?	mql4-vs-mql5-which-should-i-learn-first	\N	\N	f	f	f	436	2	2025-10-27 16:36:17.3351	approved	102	2025-10-28 10:33:56.893	2025-10-27 16:36:17.3351	2025-10-27 16:36:17.3351	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
d8fd8bd9-d170-4a1d-8548-3c262f688bb8	21ce8c06-6b65-4cab-9961-ac99121e0696	low-spread-brokers	FP Markets slippage on NFP day	Got 15 pips of negative slippage on FP Markets during last NFP. Is this normal? My stop loss was hit 15 pips earlier than it should have been.	fp-markets-slippage-on-nfp-day	\N	\N	f	f	f	88	4	2025-10-27 16:39:04.231549	approved	55	2025-10-28 10:33:56.933	2025-10-27 16:39:04.231549	2025-10-27 16:39:04.231549	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
2311343f-70d3-4256-a250-4da5e573e890	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	oscillators-momentum	Oscillator indicators – RSI vs Stochastic?	Which oscillator is more reliable? RSI or Stochastic? I use both but they sometimes give conflicting signals. Should I stick to just one?	oscillator-indicators-rsi-vs-stochastic	\N	\N	f	f	f	87	4	2025-10-27 16:36:17.518717	approved	55	2025-10-28 10:33:56.47	2025-10-27 16:36:17.518717	2025-10-27 16:36:17.518717	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
83d76b93-8dc9-4fd4-9663-572b6deeaa82	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	day-trading	Day trading USDJPY – best time of day?	What's the best session to day trade USDJPY? I've heard Asian session is best but I'm in EST timezone. Should I trade during London open instead?	day-trading-usdjpy-best-time-of-day	\N	\N	f	f	f	530	3	2025-10-27 16:36:17.4217	approved	131	2025-10-28 10:33:56.506	2025-10-27 16:36:17.4217	2025-10-27 16:36:17.4217	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
79be008c-74b4-4715-8b54-13ab70efb798	4167a292-537e-41f3-a8de-f77fe7ae0c29	free-eas-0	Free scalping EA – tested on demo for 3 months	Sharing a free scalping EA that I've been testing. It's not perfect but works on EURUSD M5. No martingale or grid, just pure scalping logic. PM me if you want it.	free-scalping-ea-tested-on-demo-for-3-months	\N	\N	f	f	f	138	3	2025-10-27 16:36:17.438159	approved	55	2025-10-28 10:33:56.549	2025-10-27 16:36:17.438159	2025-10-27 16:36:17.438159	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
dbbdf173-1eef-481f-a7d2-3f773860932a	97ba45ea-c4ae-4f8d-8216-cf304ce353af	volume-indicators	Volume indicators on forex – do they work?	I know forex is decentralized so volume isn't real volume. Are volume indicators still useful? Or just noise?	volume-indicators-on-forex-do-they-work	\N	\N	f	f	f	73	4	2025-10-27 16:39:04.540744	approved	52	2025-10-28 10:33:57.009	2025-10-27 16:39:04.540744	2025-10-27 16:39:04.540744	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
3d5206ce-a13c-447f-adf9-17bf307a2e4e	40c33800-e478-43fa-9c2c-e9e73c806541	mt4-eas	MT4 EA keeps crashing on VPS	My EA works fine on my local PC but keeps crashing on VPS. Could it be a memory issue? The VPS has 2GB RAM. Is that enough?	mt4-ea-keeps-crashing-on-vps	\N	\N	f	f	f	249	2	2025-10-27 16:39:04.39161	approved	67	2025-10-28 10:33:57.045	2025-10-27 16:39:04.39161	2025-10-27 16:39:04.39161	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
3111638e-f07d-4e26-ba83-3e1f6f9276fd	4984962b-9a4c-42ed-8ade-d93db006a4d0	backtest-results	Backtesting results vs forward testing – huge difference	My EA had 80% win rate in backtesting but only 50% in forward testing. Is this normal? Feels like backtesting is useless if results don't match reality.	backtesting-results-vs-forward-testing-huge-difference	\N	\N	f	f	f	257	4	2025-10-27 16:39:04.300357	approved	88	2025-10-28 10:33:56.967	2025-10-27 16:39:04.300357	2025-10-27 16:39:04.300357	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
eab533f8-4895-453b-b302-7410861db0ba	5de857df-a081-4082-a778-8653df02a42c	signal-services	Signal services – are they worth it?	Thinking of subscribing to a forex signal service. $100/month seems expensive but if it works, could be worth it. Anyone using signal services successfully?	signal-services-are-they-worth-it	\N	\N	f	f	f	58	6	2025-10-28 06:06:15.366116	approved	69	2025-10-28 10:33:57.079	2025-10-27 16:39:04.507301	2025-10-27 16:39:04.507301	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
4317f3bc-bb9f-4d95-a5b1-e006c4be8a26	f9fab52c-da82-4291-ae6f-22e0eb8fd930	calculators-utilities	Risk management calculator – excel vs app?	Do you guys use excel spreadsheets or dedicated apps for risk management? I built my own excel calculator but wondering if there's something better.	risk-management-calculator-excel-vs-app	\N	\N	f	f	f	371	3	2025-10-27 16:39:04.374363	approved	100	2025-10-28 10:33:57.115	2025-10-27 16:39:04.374363	2025-10-27 16:39:04.374363	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
e9c44b64-6462-43a8-b1eb-b1c390ea531f	607766e0-6d78-4482-84ba-5718d78e937f	regulated-brokers	Regulated brokers – is FCA really better?	Everyone says use FCA-regulated brokers. But I've had good experience with offshore brokers too. Is FCA regulation really worth the higher spreads?	regulated-brokers-is-fca-really-better	\N	\N	f	f	f	352	4	2025-10-27 16:39:04.457496	approved	106	2025-10-28 10:33:57.145	2025-10-27 16:39:04.457496	2025-10-27 16:39:04.457496	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
b8146177-7c1f-4743-b564-fcfdfa36e6f4	4984962b-9a4c-42ed-8ade-d93db006a4d0	breakout-eas	Breakout EA on GBPUSD – 15% monthly returns	Running a breakout EA on GBPUSD for 6 months. Averaging 15% monthly returns with 10% drawdown. Should I share it with the community or keep it private?	breakout-ea-on-gbpusd-15-monthly-returns	\N	\N	f	f	f	70	2	2025-10-27 16:39:04.491273	approved	33	2025-10-28 10:33:57.198	2025-10-27 16:39:04.491273	2025-10-27 16:39:04.491273	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
01b8d856-3ef6-4883-8074-36ecdac6c340	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	high-leverage-brokers	Exness withdrawal – instant to crypto wallet	Withdrew $500 from Exness to my BTC wallet. Arrived in 10 minutes! Best broker for fast withdrawals. Highly recommend.	exness-withdrawal-instant-to-crypto-wallet	\N	\N	f	f	f	313	2	2025-10-27 16:39:04.357198	approved	79	2025-10-28 10:33:57.261	2025-10-27 16:39:04.357198	2025-10-27 16:39:04.357198	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
ea537a7d-eab4-478b-bf66-d422928a86c1	53943ec5-cbc1-48b8-a561-9b8109476fc9	python-bots	Python trading bot for MT5 – anyone tried it?	Thinking of coding a trading bot in Python instead of MQL5. Is the integration smooth? Any performance issues compared to native MQL5 EAs?	python-trading-bot-for-mt5-anyone-tried-it	\N	\N	f	f	f	262	2	2025-10-27 16:39:04.274045	approved	69	2025-10-28 10:33:57.326	2025-10-27 16:39:04.274045	2025-10-27 16:39:04.274045	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
1e71371c-8025-4df2-89b1-485c63ec8bd1	4167a292-537e-41f3-a8de-f77fe7ae0c29	trade-copiers	Trade copier software – which one is best?	Looking for a reliable trade copier to copy signals from my main account to multiple sub-accounts. MT4-to-MT4. Any recommendations?	trade-copier-software-which-one-is-best	\N	\N	f	f	f	144	3	2025-10-27 16:39:04.441554	approved	56	2025-10-28 10:33:57.373	2025-10-27 16:39:04.441554	2025-10-27 16:39:04.441554	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
a6bb27f8-fdcf-46ee-95c7-0b7b48099038	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	sr-tools	Support and resistance indicators – do they work?	Using an SR indicator that draws lines automatically. Sometimes it's spot on, other times completely wrong. Are these indicators reliable or should I draw lines manually?	support-and-resistance-indicators-do-they-work	\N	\N	f	f	f	270	4	2025-10-27 16:39:04.339155	approved	90	2025-10-28 10:33:57.479	2025-10-27 16:39:04.339155	2025-10-27 16:39:04.339155	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
3bcae42f-2cf3-44b7-880a-9585fa2f383a	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	technical-analysis	Technical analysis course – free resources?	Want to learn TA properly. Any free courses or YouTube channels you recommend? Already know the basics but want to level up.	technical-analysis-course-free-resources	\N	\N	f	f	f	57	2	2025-10-27 16:39:04.474541	approved	30	2025-10-28 10:33:57.577	2025-10-27 16:39:04.474541	2025-10-27 16:39:04.474541	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
65d6183a-ac27-4210-9022-864d27c11884	3d24a70f-a003-4e35-b501-c0faf77434b1	freelance-requests	Freelance EA developer needed – budget $200	Need someone to code a simple EA in MQL4. Basically a moving average crossover with fixed SL/TP. Budget is $200. DM me if interested.	freelance-ea-developer-needed-budget-200	\N	\N	f	f	f	412	2	2025-10-27 16:39:04.573534	approved	99	2025-10-28 10:33:57.623	2025-10-27 16:39:04.573534	2025-10-27 16:39:04.573534	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
ce7b0506-ab3c-4cb9-9f34-a22e3935b57f	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	fundamental-analysis	Fundamental analysis for forex – does it matter?	I only use technical analysis. Never pay attention to news or fundamentals. Am I missing out? Do fundamentals really move the market short-term?	fundamental-analysis-for-forex-does-it-matter	\N	\N	f	f	f	73	3	2025-10-27 16:39:04.424342	approved	43	2025-10-28 10:33:57.68	2025-10-27 16:39:04.424342	2025-10-27 16:39:04.424342	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
21942eb1-7c41-40e4-8c8f-aae4b3786280	4167a292-537e-41f3-a8de-f77fe7ae0c29	template-packs	Template packs for MT4 – any good free ones?	Looking for free MT4 template packs. Already have the default templates but want something more professional-looking with better indicator setups.	template-packs-for-mt4-any-good-free-ones	\N	\N	f	f	f	537	2	2025-10-27 16:39:04.693246	approved	121	2025-10-28 10:33:57.912	2025-10-27 16:39:04.693246	2025-10-27 16:39:04.693246	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
03e14344-7f05-4f6b-9bcb-1a95104003d3	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	news-trading-eas	News trading EA – does it even work?	Heard about EAs that trade news releases automatically. Sounds too good to be true. Anyone actually profitable with news trading EAs?	news-trading-ea-does-it-even-work	\N	\N	f	f	f	108	1	2025-10-27 16:39:04.768666	approved	30	2025-10-28 10:33:57.99	2025-10-27 16:39:04.768666	2025-10-27 16:39:04.768666	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
cff30735-7caf-4a28-a92e-1f1e0492b575	3f1e2b32-87ba-4d84-a4b2-aca391ae7489	day-trading	Day trading EURUSD – London session best?	Trading EURUSD during London session (8am-12pm GMT). Most action happens here. Anyone trading other sessions successfully?	day-trading-eurusd-london-session-best	\N	\N	f	f	f	116	3	2025-10-27 16:39:04.873109	approved	51	2025-10-28 10:33:58.046	2025-10-27 16:39:04.873109	2025-10-27 16:39:04.873109	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
12afa39c-e841-441b-94ea-0d78dad1f845	5de857df-a081-4082-a778-8653df02a42c	scalping-eas	Scalping EAs – do any actually work long-term?	Tested 10+ scalping EAs. They all work for a few weeks then blow up. Is there any scalping EA that's profitable long-term? Or is it all hype?	scalping-eas-do-any-actually-work-long-term	\N	\N	f	f	f	60	3	2025-10-27 16:39:04.856802	approved	40	2025-10-28 10:33:58.17	2025-10-27 16:39:04.856802	2025-10-27 16:39:04.856802	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
980d8823-0f9e-43ed-b2fa-a0f8fb78f467	b3cd32de-f083-45aa-aca9-3dccf2eae2b0	trend-indicators	Trend indicators – EMA vs SMA?	Using moving averages for trend identification. EMA reacts faster but more false signals. SMA is slower but more reliable. Which do you prefer?	trend-indicators-ema-vs-sma	\N	\N	f	f	f	169	3	2025-10-27 16:39:04.659482	approved	61	2025-10-28 10:33:58.247	2025-10-27 16:39:04.659482	2025-10-27 16:39:04.659482	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
eb954bd1-2ea4-4539-aa6e-658a06a1d929	3d24a70f-a003-4e35-b501-c0faf77434b1	risk-management	Risk management – how much per trade?	Everyone says 1-2% per trade. But with small accounts, 1% is just $10. How do you guys manage risk with accounts under $1000?	risk-management-how-much-per-trade	\N	\N	f	f	f	258	3	2025-10-27 16:39:04.785749	approved	79	2025-10-28 10:33:58.291	2025-10-27 16:39:04.785749	2025-10-27 16:39:04.785749	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
5ae1d836-ccf2-49da-90fe-351dddb0f9e9	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	position-trading	Position trading on gold – holding for 6 months	Entered a long position on XAUUSD 6 months ago at $1800. Still holding at $2050. Position trading requires nerves of steel but the profits are worth it.	position-trading-on-gold-holding-for-6-months	\N	\N	f	f	f	500	3	2025-10-27 16:39:04.910786	approved	125	2025-10-28 10:33:58.327	2025-10-27 16:39:04.910786	2025-10-27 16:39:04.910786	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
06cffe1e-29f6-4876-a556-7cb6917c7bf9	21ce8c06-6b65-4cab-9961-ac99121e0696	regulated-brokers	ASIC regulation – is it as good as FCA?	Most people talk about FCA regulation. But what about ASIC? Australian brokers seem solid too. Is ASIC as reliable as FCA?	asic-regulation-is-it-as-good-as-fca	\N	\N	f	f	f	272	3	2025-10-27 16:39:04.821552	approved	81	2025-10-28 10:33:58.378	2025-10-27 16:39:04.821552	2025-10-27 16:39:04.821552	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
22374ecd-2974-494f-bd5f-3c83da0e85ff	7424f4cb-3490-4b20-b08a-8728e5786303	grid-martingale	Grid trading – lost $2k in 1 week	Tried grid trading on EURUSD. Worked great for 2 weeks then lost everything in 1 week when price trended hard. Grid trading is too risky. Stick to traditional strategies.	grid-trading-lost-2k-in-1-week	\N	\N	f	f	f	238	3	2025-10-27 16:39:04.840678	approved	74	2025-10-28 10:33:58.442	2025-10-27 16:39:04.840678	2025-10-27 16:39:04.840678	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
0ffa838b-259f-4f2c-9a48-3d763a36ad8f	a29ced6d-6cd7-45c5-914b-bc02b15d9f11	premium-eas-200-500	Premium EA – 400 coins but lifetime updates	Considering buying a premium EA for 400 coins. It's expensive but includes lifetime updates and support. Anyone bought premium EAs? Worth the investment?	premium-ea-400-coins-but-lifetime-updates	\N	\N	f	f	f	244	2	2025-10-27 16:39:04.743948	approved	66	2025-10-28 10:33:58.496	2025-10-27 16:39:04.743948	2025-10-27 16:39:04.743948	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
8fcbb9f9-3245-4675-9ccf-4eb19704f3c8	97ba45ea-c4ae-4f8d-8216-cf304ce353af	ecn-brokers	Tickmill review – solid broker for beginners	Been using Tickmill for 3 months. No issues with withdrawals, spreads are competitive, and customer support is helpful. Good choice for beginners.	tickmill-review-solid-broker-for-beginners	\N	\N	f	f	f	535	3	2025-10-27 16:39:04.804098	approved	132	2025-10-28 10:33:58.526	2025-10-27 16:39:04.804098	2025-10-27 16:39:04.804098	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
1853f20b-eb1f-424f-ae80-7b4ad9e5b9f3	4984962b-9a4c-42ed-8ade-d93db006a4d0	python-bots	Python bot vs MQL5 EA – which is faster?	Coded the same strategy in both Python and MQL5. Python bot has slight delay in execution. MQL5 EA is instant. Is this latency a deal-breaker for scalping?	python-bot-vs-mql5-ea-which-is-faster	\N	\N	f	f	f	87	3	2025-10-27 16:39:04.942772	approved	45	2025-10-28 10:33:58.648	2025-10-27 16:39:04.942772	2025-10-27 16:39:04.942772	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
07a71660-cfb7-42e0-b3b5-984ab863a8ca	f9fab52c-da82-4291-ae6f-22e0eb8fd930	ea-performance-reports	EA performance reports – how to analyze them?	My EA generated a huge performance report with 1000+ trades. How do I analyze this data? What metrics should I focus on besides win rate?	ea-performance-reports-how-to-analyze-them	\N	\N	f	f	f	347	2	2025-10-27 16:39:04.676779	approved	86	2025-10-28 10:33:58.784	2025-10-27 16:39:04.676779	2025-10-27 16:39:04.676779	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
964ea79a-aed6-4aff-be8a-2748363d58d2	607766e0-6d78-4482-84ba-5718d78e937f	multi-pair-correlation	Multi-pair correlation trading – how many pairs?	Trading EURUSD, GBPUSD, and AUDUSD simultaneously based on correlation. Is 3 pairs enough or should I add more? Worried about over-diversification.	multi-pair-correlation-trading-how-many-pairs	\N	\N	f	f	f	215	2	2025-10-27 16:39:04.62303	approved	60	2025-10-28 10:33:57.757	2025-10-27 16:39:04.62303	2025-10-27 16:39:04.62303	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
535a7da6-8f5d-434e-9d2f-01ca881e86cb	f9fab52c-da82-4291-ae6f-22e0eb8fd930	vps-services	VPS in Singapore vs London – latency comparison	Comparing VPS locations for MT4. Singapore has 5ms ping to my broker, London has 15ms. Does 10ms really make a difference for scalping?	vps-in-singapore-vs-london-latency-comparison	\N	\N	f	f	f	93	3	2025-10-27 16:39:05.041692	approved	46	2025-10-28 10:33:59.066	2025-10-27 16:39:05.041692	2025-10-27 16:39:05.041692	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
f6380739-710f-4c30-ba57-047e16c6009e	4984962b-9a4c-42ed-8ade-d93db006a4d0	forward-test-results	Forward test results – EA stopped working after 2 months	EA worked perfectly for 2 months in forward testing, then suddenly started losing. Market conditions changed or EA is broken? How to diagnose this?	forward-test-results-ea-stopped-working-after-2-months	\N	\N	f	f	f	432	3	2025-10-27 16:39:04.60653	approved	112	2025-10-28 10:33:59.139	2025-10-27 16:39:04.60653	2025-10-27 16:39:04.60653	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
39140584-e353-4aed-a5fe-45d876539d0b	53943ec5-cbc1-48b8-a561-9b8109476fc9	mql5	MQL5 programming – where to start?	Want to learn MQL5 from scratch. Any good tutorials or documentation you recommend? The official docs are confusing for beginners.	mql5-programming-where-to-start	\N	\N	f	f	f	125	3	2025-10-27 16:39:05.004436	approved	53	2025-10-28 10:33:59.274	2025-10-27 16:39:05.004436	2025-10-27 16:39:05.004436	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
c89a1a6b-d29f-4ec8-b7d4-96382e884a21	7424f4cb-3490-4b20-b08a-8728e5786303	trading-psychology	Trading psychology – how to handle losing streaks?	On a 10-trade losing streak. Can't focus, second-guessing every entry. How do you guys deal with this mentally? Thinking of taking a break from trading.	trading-psychology-how-to-handle-losing-streaks	\N	\N	f	f	f	217	2	2025-10-27 16:39:04.318034	approved	61	2025-10-28 10:33:59.33	2025-10-27 16:39:04.318034	2025-10-27 16:39:04.318034	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
0e674d93-fd03-4bbb-ad9c-799d0e94a828	7424f4cb-3490-4b20-b08a-8728e5786303	beginners-corner	Beginner's corner – where do I even start?	Complete noob here. Opened a demo account but have no idea what I'm doing. Should I take a course first or just learn by doing? Any beginner-friendly resources?	beginners-corner-where-do-i-even-start	\N	\N	f	f	f	122	3	2025-10-27 16:39:04.639789	approved	52	2025-10-28 10:33:59.368	2025-10-27 16:39:04.639789	2025-10-27 16:39:04.639789	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
81e16228-6a6e-431e-b48a-7c7b0e14076f	4984962b-9a4c-42ed-8ade-d93db006a4d0	trend-following-eas	Trend following on H4 – which pairs work best?	Running a trend following strategy on H4 timeframe. Works great on GBPUSD but terrible on EURUSD. Are some pairs better for trend following than others?	trend-following-on-h4-which-pairs-work-best	\N	\N	f	f	f	437	2	2025-10-27 16:39:05.020888	approved	103	2025-10-28 10:33:59.402	2025-10-27 16:39:05.020888	2025-10-27 16:39:05.020888	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
f0d24926-8128-4f79-bddf-77cb60ef3a83	40c33800-e478-43fa-9c2c-e9e73c806541	eurusd-scalping	EURUSD scalping – best indicators?	What indicators do you use for EURUSD scalping on M1-M5? I'm using RSI and Bollinger Bands but getting mixed results. Any better combinations?	eurusd-scalping-best-indicators	\N	\N	f	f	f	382	3	2025-10-27 16:39:04.985576	approved	102	2025-10-28 10:33:59.437	2025-10-27 16:39:04.985576	2025-10-27 16:39:04.985576	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
b98bc127-4afa-4c11-8629-bf16aefe6caa	21ce8c06-6b65-4cab-9961-ac99121e0696	market-maker-brokers	Market maker vs ECN brokers – huge spread difference	Tested both MM and ECN brokers. MM spreads are 3-5 pips, ECN is 0.5-1 pip. But ECN charges commission. Which is more cost-effective for scalping?	market-maker-vs-ecn-brokers-huge-spread-difference	\N	\N	f	f	f	398	1	2025-10-27 16:39:04.556243	approved	86	2025-10-28 10:33:59.476	2025-10-27 16:39:04.556243	2025-10-27 16:39:04.556243	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
64d66744-88d4-4159-bdf0-300dc69394c8	97ba45ea-c4ae-4f8d-8216-cf304ce353af	position-trading	Position trading on W1 – holding for months	Started position trading on weekly timeframe. Holding trades for 2-3 months. Much less stressful than day trading. Anyone else trading this way?	position-trading-on-w1-holding-for-months	\N	\N	f	f	f	323	2	2025-10-27 16:39:04.256906	approved	81	2025-10-28 10:33:58.923	2025-10-27 16:39:04.256906	2025-10-27 16:39:04.256906	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
41868c43-34e3-470f-81ac-62741f987fee	3d24a70f-a003-4e35-b501-c0faf77434b1	xauusd-scalping	Help pls – XAUUSD M5 scalping keeps failing	Been trying to scalp gold on M5 but my entries are always late. Losing more than winning. Any tips for faster entries? SL placement is also messy.	help-pls-xauusd-m5-scalping-keeps-failing	\N	\N	f	f	f	132	2	2025-10-27 16:36:17.259262	approved	45	2025-10-28 10:33:58.976	2025-10-27 16:36:17.259262	2025-10-27 16:36:17.259262	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
733910b1-e164-41f2-a144-15efb859d16d	3d24a70f-a003-4e35-b501-c0faf77434b1	beginners-corner	Beginner question – what is leverage?	Keep hearing about leverage but don't fully understand it. Is 1:500 leverage dangerous? Should beginners use low leverage like 1:50?	beginner-question-what-is-leverage	\N	\N	f	f	f	95	4	2025-10-27 16:39:04.965228	approved	57	2025-10-28 10:33:59.195	2025-10-27 16:39:04.965228	2025-10-27 16:39:04.965228	\N	discussion	\N	\N	en	{}	{}	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	{}	0	0	0
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goals (id, user_id, goal_type, target_value, current_value, start_date, end_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: ip_bans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ip_bans (id, ip_address, reason, ban_type, expires_at, banned_by, banned_at, is_active) FROM stdin;
1	146.199.82.6	Multiple failed login attempts	temporary	2025-11-04 00:50:44.304	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-28 00:50:44.304	t
2	44.34.2.247	Spam posting detected	permanent	\N	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 00:50:44.304	t
3	229.111.146.130	DDoS attack attempt	permanent	\N	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-26 00:50:44.304	t
4	203.43.31.146	Fraudulent activity	temporary	2025-11-07 00:50:44.304	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-25 00:50:44.304	t
5	3.201.164.80	Automated bot behavior	permanent	\N	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-24 00:50:44.304	t
6	39.61.66.76	Violation of terms of service	permanent	\N	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-23 00:50:44.304	t
7	148.195.212.149	Multiple failed login attempts	temporary	2025-11-10 00:50:44.304	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-22 00:50:44.304	t
8	11.42.67.216	Spam posting detected	permanent	\N	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-21 00:50:44.304	t
9	172.180.67.150	DDoS attack attempt	permanent	\N	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-20 00:50:44.304	t
10	6.59.12.244	Fraudulent activity	temporary	2025-11-13 00:50:44.304	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-19 00:50:44.304	t
11	8.40.193.178	Automated bot behavior	permanent	\N	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-18 00:50:44.304	f
12	122.3.3.8	Violation of terms of service	permanent	\N	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-17 00:50:44.304	f
\.


--
-- Data for Name: ledger_reconciliation_runs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ledger_reconciliation_runs (id, status, drift_count, max_delta, report, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: media_library; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.media_library (id, filename, original_filename, file_path, file_size, mime_type, width, height, alt_text, tags, uploaded_by, uploaded_at, usage_count) FROM stdin;
1	file_0_3pn6q.jpeg	user_upload_0.jpeg	/uploads/media/2025/10/file_0.jpeg	728948	image/jpeg	1751	854	Image 0: EA performance chart	{upload,image,user-0}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-28 00:50:44.689	33
2	file_1_gvrxkq.png	user_upload_1.png	/uploads/media/2025/10/file_1.png	823748	image/png	835	1767	Image 1: EA performance chart	{upload,image,user-1}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 00:50:44.689	16
3	file_2_2s0f9c.gif	user_upload_2.gif	/uploads/media/2025/10/file_2.gif	1818142	image/gif	2749	635	Image 2: EA performance chart	{upload,image,user-2}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-26 00:50:44.689	22
4	file_3_5zrxmj.webp	user_upload_3.webp	/uploads/media/2025/10/file_3.webp	4402027	image/webp	1696	1597	Image 3: EA performance chart	{upload,image,user-3}	607766e0-6d78-4482-84ba-5718d78e937f	2025-10-25 00:50:44.689	47
5	file_4_hhocj8.pdf	user_upload_4.pdf	/uploads/media/2025/10/file_4.pdf	497832	application/pdf	\N	\N	\N	{upload,application,user-4}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	2025-10-24 00:50:44.689	34
6	file_5_20y9hj.jpeg	user_upload_5.jpeg	/uploads/media/2025/10/file_5.jpeg	1027613	image/jpeg	2535	610	Image 5: EA performance chart	{upload,image,user-0}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-23 00:50:44.689	12
7	file_6_48yva.png	user_upload_6.png	/uploads/media/2025/10/file_6.png	3814755	image/png	2382	1387	Image 6: EA performance chart	{upload,image,user-1}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-22 00:50:44.689	34
8	file_7_oxqmtp.gif	user_upload_7.gif	/uploads/media/2025/10/file_7.gif	3176215	image/gif	1019	988	Image 7: EA performance chart	{upload,image,user-2}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-21 00:50:44.689	13
9	file_8_2io755.webp	user_upload_8.webp	/uploads/media/2025/10/file_8.webp	2156513	image/webp	1284	1124	Image 8: EA performance chart	{upload,image,user-3}	607766e0-6d78-4482-84ba-5718d78e937f	2025-10-20 00:50:44.689	7
10	file_9_kdtw1.pdf	user_upload_9.pdf	/uploads/media/2025/10/file_9.pdf	1898585	application/pdf	\N	\N	\N	{upload,application,user-4}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	2025-10-19 00:50:44.689	10
11	file_10_qfia4x.jpeg	user_upload_10.jpeg	/uploads/media/2025/10/file_10.jpeg	907514	image/jpeg	1160	2053	Image 10: EA performance chart	{upload,image,user-0}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-18 00:50:44.689	4
12	file_11_g0vypi.png	user_upload_11.png	/uploads/media/2025/10/file_11.png	4249520	image/png	1695	850	Image 11: EA performance chart	{upload,image,user-1}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-17 00:50:44.689	25
13	file_12_kyebg5.gif	user_upload_12.gif	/uploads/media/2025/10/file_12.gif	4979030	image/gif	2544	947	Image 12: EA performance chart	{upload,image,user-2}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-16 00:50:44.689	43
14	file_13_mhu6go.webp	user_upload_13.webp	/uploads/media/2025/10/file_13.webp	5062713	image/webp	1042	1266	Image 13: EA performance chart	{upload,image,user-3}	607766e0-6d78-4482-84ba-5718d78e937f	2025-10-15 00:50:44.689	35
15	file_14_ec5kpk.pdf	user_upload_14.pdf	/uploads/media/2025/10/file_14.pdf	4615666	application/pdf	\N	\N	\N	{upload,application,user-4}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	2025-10-14 00:50:44.689	39
16	file_15_8y104.jpeg	user_upload_15.jpeg	/uploads/media/2025/10/file_15.jpeg	3833594	image/jpeg	1599	1224	Image 15: EA performance chart	{upload,image,user-0}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-13 00:50:44.689	13
17	file_16_fgohne.png	user_upload_16.png	/uploads/media/2025/10/file_16.png	4533741	image/png	2474	1012	Image 16: EA performance chart	{upload,image,user-1}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-12 00:50:44.689	6
18	file_17_qetp5s.gif	user_upload_17.gif	/uploads/media/2025/10/file_17.gif	291818	image/gif	1697	1647	Image 17: EA performance chart	{upload,image,user-2}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-11 00:50:44.689	33
19	file_18_gx4ex.webp	user_upload_18.webp	/uploads/media/2025/10/file_18.webp	591559	image/webp	1107	1486	Image 18: EA performance chart	{upload,image,user-3}	607766e0-6d78-4482-84ba-5718d78e937f	2025-10-10 00:50:44.689	37
20	file_19_ex7bs.pdf	user_upload_19.pdf	/uploads/media/2025/10/file_19.pdf	1254213	application/pdf	\N	\N	\N	{upload,application,user-4}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	2025-10-09 00:50:44.689	35
21	file_20_lvbyqb.jpeg	user_upload_20.jpeg	/uploads/media/2025/10/file_20.jpeg	4598292	image/jpeg	1828	1297	Image 20: EA performance chart	{upload,image,user-0}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-08 00:50:44.689	15
22	file_21_ud6phh.png	user_upload_21.png	/uploads/media/2025/10/file_21.png	694453	image/png	2594	1163	Image 21: EA performance chart	{upload,image,user-1}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-07 00:50:44.689	14
23	file_22_ljuo9.gif	user_upload_22.gif	/uploads/media/2025/10/file_22.gif	3034196	image/gif	2130	1557	Image 22: EA performance chart	{upload,image,user-2}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-06 00:50:44.689	7
24	file_23_qc3w1.webp	user_upload_23.webp	/uploads/media/2025/10/file_23.webp	5083206	image/webp	2087	1713	Image 23: EA performance chart	{upload,image,user-3}	607766e0-6d78-4482-84ba-5718d78e937f	2025-10-05 00:50:44.689	7
25	file_24_eebvsu.pdf	user_upload_24.pdf	/uploads/media/2025/10/file_24.pdf	3615996	application/pdf	\N	\N	\N	{upload,application,user-4}	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	2025-10-04 00:50:44.689	35
\.


--
-- Data for Name: message_reactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_reactions (id, message_id, user_id, emoji, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, conversation_id, sender_id, recipient_id, body, is_read, created_at, delivered_at, read_at) FROM stdin;
\.


--
-- Data for Name: moderation_queue; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.moderation_queue (id, content_type, content_id, author_id, status, priority_score, spam_score, sentiment_score, flagged_reasons, reviewed_by, reviewed_at, review_notes, created_at) FROM stdin;
1	thread	content-mod-0	7424f4cb-3490-4b20-b08a-8728e5786303	pending	6	0.94	0.32	{spam}	\N	\N	\N	2025-10-28 00:50:43.853
2	reply	content-mod-1	97ba45ea-c4ae-4f8d-8216-cf304ce353af	pending	4	0.93	0.64	{spam,inappropriate,offensive}	\N	\N	\N	2025-10-27 22:50:43.853
3	content	content-mod-2	21ce8c06-6b65-4cab-9961-ac99121e0696	pending	48	0.85	-0.36	{spam,inappropriate,offensive}	\N	\N	\N	2025-10-27 20:50:43.853
4	review	content-mod-3	607766e0-6d78-4482-84ba-5718d78e937f	pending	44	0.29	0.69	{spam}	\N	\N	\N	2025-10-27 18:50:43.853
5	broker_review	content-mod-4	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	pending	43	0.17	0.25	{spam,inappropriate}	\N	\N	\N	2025-10-27 16:50:43.853
6	thread	content-mod-5	7424f4cb-3490-4b20-b08a-8728e5786303	pending	59	0.01	-0.44	{spam,inappropriate,offensive}	\N	\N	\N	2025-10-27 14:50:43.853
7	reply	content-mod-6	97ba45ea-c4ae-4f8d-8216-cf304ce353af	pending	54	0.86	0.70	{spam}	\N	\N	\N	2025-10-27 12:50:43.853
8	content	content-mod-7	21ce8c06-6b65-4cab-9961-ac99121e0696	pending	34	0.38	-1.00	{spam,inappropriate}	\N	\N	\N	2025-10-27 10:50:43.853
9	review	content-mod-8	607766e0-6d78-4482-84ba-5718d78e937f	pending	52	0.18	0.49	{spam,inappropriate}	\N	\N	\N	2025-10-27 08:50:43.853
10	broker_review	content-mod-9	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	pending	38	0.75	-0.90	{spam,inappropriate,offensive}	\N	\N	\N	2025-10-27 06:50:43.853
11	thread	content-mod-10	7424f4cb-3490-4b20-b08a-8728e5786303	rejected	4	0.96	-0.79	{spam}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 04:50:43.853	Reviewed by admin. Decision: rejected	2025-10-27 04:50:43.853
12	reply	content-mod-11	97ba45ea-c4ae-4f8d-8216-cf304ce353af	flagged	54	0.38	0.16	{spam,inappropriate,offensive}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 05:50:43.853	Reviewed by admin. Decision: flagged	2025-10-27 02:50:43.853
13	content	content-mod-12	21ce8c06-6b65-4cab-9961-ac99121e0696	pending	39	0.93	0.10	{spam}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 06:50:43.853	Reviewed by admin. Decision: pending	2025-10-27 00:50:43.853
14	review	content-mod-13	607766e0-6d78-4482-84ba-5718d78e937f	approved	88	0.69	-0.56	{spam,inappropriate,offensive}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 07:50:43.853	Reviewed by admin. Decision: approved	2025-10-26 22:50:43.853
15	broker_review	content-mod-14	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	rejected	70	0.81	-0.74	{spam,inappropriate,offensive}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 08:50:43.853	Reviewed by admin. Decision: rejected	2025-10-26 20:50:43.853
16	thread	content-mod-15	7424f4cb-3490-4b20-b08a-8728e5786303	flagged	71	0.60	0.45	{spam,inappropriate}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 09:50:43.853	Reviewed by admin. Decision: flagged	2025-10-26 18:50:43.853
17	reply	content-mod-16	97ba45ea-c4ae-4f8d-8216-cf304ce353af	pending	71	0.75	0.75	{spam}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 10:50:43.853	Reviewed by admin. Decision: pending	2025-10-26 16:50:43.853
18	content	content-mod-17	21ce8c06-6b65-4cab-9961-ac99121e0696	approved	49	0.82	-0.79	{spam,inappropriate,offensive}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 11:50:43.853	Reviewed by admin. Decision: approved	2025-10-26 14:50:43.853
19	review	content-mod-18	607766e0-6d78-4482-84ba-5718d78e937f	rejected	18	0.95	-0.39	{spam,inappropriate}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 12:50:43.853	Reviewed by admin. Decision: rejected	2025-10-26 12:50:43.853
20	broker_review	content-mod-19	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	flagged	40	0.69	-0.63	{spam}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 13:50:43.853	Reviewed by admin. Decision: flagged	2025-10-26 10:50:43.853
21	thread	content-mod-20	7424f4cb-3490-4b20-b08a-8728e5786303	pending	44	0.08	-0.64	{spam,inappropriate,offensive}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 14:50:43.853	Reviewed by admin. Decision: pending	2025-10-26 08:50:43.853
22	reply	content-mod-21	97ba45ea-c4ae-4f8d-8216-cf304ce353af	approved	59	0.58	0.74	{spam}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 15:50:43.853	Reviewed by admin. Decision: approved	2025-10-26 06:50:43.853
23	content	content-mod-22	21ce8c06-6b65-4cab-9961-ac99121e0696	rejected	97	0.72	-0.45	{spam}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 16:50:43.853	Reviewed by admin. Decision: rejected	2025-10-26 04:50:43.853
24	review	content-mod-23	607766e0-6d78-4482-84ba-5718d78e937f	flagged	7	0.61	0.70	{spam}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 17:50:43.853	Reviewed by admin. Decision: flagged	2025-10-26 02:50:43.853
25	broker_review	content-mod-24	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	pending	8	0.51	-0.38	{spam,inappropriate}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 18:50:43.853	Reviewed by admin. Decision: pending	2025-10-26 00:50:43.853
26	thread	content-mod-25	7424f4cb-3490-4b20-b08a-8728e5786303	approved	35	0.77	0.84	{spam,inappropriate}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 19:50:43.853	Reviewed by admin. Decision: approved	2025-10-25 22:50:43.853
27	reply	content-mod-26	97ba45ea-c4ae-4f8d-8216-cf304ce353af	rejected	50	0.11	-0.59	{spam}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 20:50:43.853	Reviewed by admin. Decision: rejected	2025-10-25 20:50:43.853
28	content	content-mod-27	21ce8c06-6b65-4cab-9961-ac99121e0696	flagged	6	0.43	0.18	{spam}	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 21:50:43.853	Reviewed by admin. Decision: flagged	2025-10-25 18:50:43.853
29	review	content-mod-28	607766e0-6d78-4482-84ba-5718d78e937f	pending	43	0.21	0.87	{spam,inappropriate}	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 22:50:43.853	Reviewed by admin. Decision: pending	2025-10-25 16:50:43.853
30	broker_review	content-mod-29	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	approved	96	0.09	-0.75	{spam}	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 23:50:43.853	Reviewed by admin. Decision: approved	2025-10-25 14:50:43.853
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, type, title, message, action_url, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: performance_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.performance_metrics (id, metric_type, metric_name, value, unit, metadata, recorded_at) FROM stdin;
1	api	response_time	18.41	ms	{"server": "server-1", "environment": "production"}	2025-10-28 00:50:44.637
2	database	query_duration	5.56	ms	{"server": "server-2", "environment": "production"}	2025-10-28 00:50:44.637
3	cache	cache_hit_rate	58.53	%	{"server": "server-3", "environment": "production"}	2025-10-28 00:50:44.637
4	background_job	job_execution_time	61.01	ms	{"server": "server-1", "environment": "production"}	2025-10-28 00:50:44.637
5	system	cpu_usage	30.24	%	{"server": "server-2", "environment": "production"}	2025-10-27 23:50:44.637
6	api	memory_usage	61.79	MB	{"server": "server-3", "environment": "production"}	2025-10-27 23:50:44.637
7	database	request_count	64.98	count	{"server": "server-1", "environment": "production"}	2025-10-27 23:50:44.637
8	cache	error_rate	82.85	%	{"server": "server-2", "environment": "production"}	2025-10-27 23:50:44.637
9	background_job	response_time	41.33	ms	{"server": "server-3", "environment": "production"}	2025-10-27 22:50:44.637
10	system	query_duration	89.07	ms	{"server": "server-1", "environment": "production"}	2025-10-27 22:50:44.637
11	api	cache_hit_rate	74.02	%	{"server": "server-2", "environment": "production"}	2025-10-27 22:50:44.637
12	database	job_execution_time	12.67	ms	{"server": "server-3", "environment": "production"}	2025-10-27 22:50:44.637
13	cache	cpu_usage	21.86	%	{"server": "server-1", "environment": "production"}	2025-10-27 21:50:44.637
14	background_job	memory_usage	4.98	MB	{"server": "server-2", "environment": "production"}	2025-10-27 21:50:44.637
15	system	request_count	12.41	count	{"server": "server-3", "environment": "production"}	2025-10-27 21:50:44.637
16	api	error_rate	36.19	%	{"server": "server-1", "environment": "production"}	2025-10-27 21:50:44.637
17	database	response_time	29.50	ms	{"server": "server-2", "environment": "production"}	2025-10-27 20:50:44.637
18	cache	query_duration	26.61	ms	{"server": "server-3", "environment": "production"}	2025-10-27 20:50:44.637
19	background_job	cache_hit_rate	62.63	%	{"server": "server-1", "environment": "production"}	2025-10-27 20:50:44.637
20	system	job_execution_time	29.84	ms	{"server": "server-2", "environment": "production"}	2025-10-27 20:50:44.637
21	api	cpu_usage	90.88	%	{"server": "server-3", "environment": "production"}	2025-10-27 19:50:44.637
22	database	memory_usage	45.83	MB	{"server": "server-1", "environment": "production"}	2025-10-27 19:50:44.637
23	cache	request_count	36.05	count	{"server": "server-2", "environment": "production"}	2025-10-27 19:50:44.637
24	background_job	error_rate	19.65	%	{"server": "server-3", "environment": "production"}	2025-10-27 19:50:44.637
25	system	response_time	56.53	ms	{"server": "server-1", "environment": "production"}	2025-10-27 18:50:44.637
26	api	query_duration	28.39	ms	{"server": "server-2", "environment": "production"}	2025-10-27 18:50:44.637
27	database	cache_hit_rate	49.93	%	{"server": "server-3", "environment": "production"}	2025-10-27 18:50:44.637
28	cache	job_execution_time	68.25	ms	{"server": "server-1", "environment": "production"}	2025-10-27 18:50:44.637
29	background_job	cpu_usage	2.66	%	{"server": "server-2", "environment": "production"}	2025-10-27 17:50:44.637
30	system	memory_usage	86.25	MB	{"server": "server-3", "environment": "production"}	2025-10-27 17:50:44.637
31	api	request_count	36.10	count	{"server": "server-1", "environment": "production"}	2025-10-27 17:50:44.637
32	database	error_rate	74.73	%	{"server": "server-2", "environment": "production"}	2025-10-27 17:50:44.637
33	cache	response_time	38.88	ms	{"server": "server-3", "environment": "production"}	2025-10-27 16:50:44.637
34	background_job	query_duration	44.62	ms	{"server": "server-1", "environment": "production"}	2025-10-27 16:50:44.637
35	system	cache_hit_rate	42.37	%	{"server": "server-2", "environment": "production"}	2025-10-27 16:50:44.637
36	api	job_execution_time	84.90	ms	{"server": "server-3", "environment": "production"}	2025-10-27 16:50:44.637
37	database	cpu_usage	16.30	%	{"server": "server-1", "environment": "production"}	2025-10-27 15:50:44.637
38	cache	memory_usage	98.77	MB	{"server": "server-2", "environment": "production"}	2025-10-27 15:50:44.637
39	background_job	request_count	38.59	count	{"server": "server-3", "environment": "production"}	2025-10-27 15:50:44.637
40	system	error_rate	13.75	%	{"server": "server-1", "environment": "production"}	2025-10-27 15:50:44.637
41	api	response_time	17.39	ms	{"server": "server-2", "environment": "production"}	2025-10-27 14:50:44.637
42	database	query_duration	11.81	ms	{"server": "server-3", "environment": "production"}	2025-10-27 14:50:44.637
43	cache	cache_hit_rate	83.51	%	{"server": "server-1", "environment": "production"}	2025-10-27 14:50:44.637
44	background_job	job_execution_time	15.62	ms	{"server": "server-2", "environment": "production"}	2025-10-27 14:50:44.637
45	system	cpu_usage	12.71	%	{"server": "server-3", "environment": "production"}	2025-10-27 13:50:44.637
46	api	memory_usage	74.03	MB	{"server": "server-1", "environment": "production"}	2025-10-27 13:50:44.637
47	database	request_count	40.56	count	{"server": "server-2", "environment": "production"}	2025-10-27 13:50:44.637
48	cache	error_rate	68.56	%	{"server": "server-3", "environment": "production"}	2025-10-27 13:50:44.637
49	background_job	response_time	98.60	ms	{"server": "server-1", "environment": "production"}	2025-10-27 12:50:44.637
50	system	query_duration	3.57	ms	{"server": "server-2", "environment": "production"}	2025-10-27 12:50:44.637
51	api	cache_hit_rate	36.51	%	{"server": "server-3", "environment": "production"}	2025-10-27 12:50:44.637
52	database	job_execution_time	14.69	ms	{"server": "server-1", "environment": "production"}	2025-10-27 12:50:44.637
53	cache	cpu_usage	30.15	%	{"server": "server-2", "environment": "production"}	2025-10-27 11:50:44.637
54	background_job	memory_usage	27.81	MB	{"server": "server-3", "environment": "production"}	2025-10-27 11:50:44.637
55	system	request_count	56.85	count	{"server": "server-1", "environment": "production"}	2025-10-27 11:50:44.637
56	api	error_rate	81.79	%	{"server": "server-2", "environment": "production"}	2025-10-27 11:50:44.637
57	database	response_time	94.11	ms	{"server": "server-3", "environment": "production"}	2025-10-27 10:50:44.637
58	cache	query_duration	48.74	ms	{"server": "server-1", "environment": "production"}	2025-10-27 10:50:44.637
59	background_job	cache_hit_rate	73.63	%	{"server": "server-2", "environment": "production"}	2025-10-27 10:50:44.637
60	system	job_execution_time	30.98	ms	{"server": "server-3", "environment": "production"}	2025-10-27 10:50:44.637
61	api	cpu_usage	38.44	%	{"server": "server-1", "environment": "production"}	2025-10-27 09:50:44.637
62	database	memory_usage	25.07	MB	{"server": "server-2", "environment": "production"}	2025-10-27 09:50:44.637
63	cache	request_count	93.70	count	{"server": "server-3", "environment": "production"}	2025-10-27 09:50:44.637
64	background_job	error_rate	61.35	%	{"server": "server-1", "environment": "production"}	2025-10-27 09:50:44.637
65	system	response_time	59.03	ms	{"server": "server-2", "environment": "production"}	2025-10-27 08:50:44.637
66	api	query_duration	96.47	ms	{"server": "server-3", "environment": "production"}	2025-10-27 08:50:44.637
67	database	cache_hit_rate	92.83	%	{"server": "server-1", "environment": "production"}	2025-10-27 08:50:44.637
68	cache	job_execution_time	8.20	ms	{"server": "server-2", "environment": "production"}	2025-10-27 08:50:44.637
69	background_job	cpu_usage	72.85	%	{"server": "server-3", "environment": "production"}	2025-10-27 07:50:44.637
70	system	memory_usage	52.03	MB	{"server": "server-1", "environment": "production"}	2025-10-27 07:50:44.637
71	api	request_count	7.99	count	{"server": "server-2", "environment": "production"}	2025-10-27 07:50:44.637
72	database	error_rate	46.21	%	{"server": "server-3", "environment": "production"}	2025-10-27 07:50:44.637
73	cache	response_time	89.47	ms	{"server": "server-1", "environment": "production"}	2025-10-27 06:50:44.637
74	background_job	query_duration	51.65	ms	{"server": "server-2", "environment": "production"}	2025-10-27 06:50:44.637
75	system	cache_hit_rate	88.15	%	{"server": "server-3", "environment": "production"}	2025-10-27 06:50:44.637
76	api	job_execution_time	49.12	ms	{"server": "server-1", "environment": "production"}	2025-10-27 06:50:44.637
77	database	cpu_usage	69.94	%	{"server": "server-2", "environment": "production"}	2025-10-27 05:50:44.637
78	cache	memory_usage	67.59	MB	{"server": "server-3", "environment": "production"}	2025-10-27 05:50:44.637
79	background_job	request_count	91.02	count	{"server": "server-1", "environment": "production"}	2025-10-27 05:50:44.637
80	system	error_rate	46.26	%	{"server": "server-2", "environment": "production"}	2025-10-27 05:50:44.637
81	api	response_time	89.48	ms	{"server": "server-3", "environment": "production"}	2025-10-27 04:50:44.637
82	database	query_duration	38.82	ms	{"server": "server-1", "environment": "production"}	2025-10-27 04:50:44.637
83	cache	cache_hit_rate	53.38	%	{"server": "server-2", "environment": "production"}	2025-10-27 04:50:44.637
84	background_job	job_execution_time	29.90	ms	{"server": "server-3", "environment": "production"}	2025-10-27 04:50:44.637
85	system	cpu_usage	26.90	%	{"server": "server-1", "environment": "production"}	2025-10-27 03:50:44.637
86	api	memory_usage	65.07	MB	{"server": "server-2", "environment": "production"}	2025-10-27 03:50:44.637
87	database	request_count	61.83	count	{"server": "server-3", "environment": "production"}	2025-10-27 03:50:44.637
88	cache	error_rate	74.30	%	{"server": "server-1", "environment": "production"}	2025-10-27 03:50:44.638
89	background_job	response_time	47.27	ms	{"server": "server-2", "environment": "production"}	2025-10-27 02:50:44.638
90	system	query_duration	56.65	ms	{"server": "server-3", "environment": "production"}	2025-10-27 02:50:44.638
91	api	cache_hit_rate	32.42	%	{"server": "server-1", "environment": "production"}	2025-10-27 02:50:44.638
92	database	job_execution_time	2.54	ms	{"server": "server-2", "environment": "production"}	2025-10-27 02:50:44.638
93	cache	cpu_usage	9.00	%	{"server": "server-3", "environment": "production"}	2025-10-27 01:50:44.638
94	background_job	memory_usage	24.94	MB	{"server": "server-1", "environment": "production"}	2025-10-27 01:50:44.638
95	system	request_count	27.79	count	{"server": "server-2", "environment": "production"}	2025-10-27 01:50:44.638
96	api	error_rate	49.66	%	{"server": "server-3", "environment": "production"}	2025-10-27 01:50:44.638
97	database	response_time	15.94	ms	{"server": "server-1", "environment": "production"}	2025-10-27 00:50:44.638
98	cache	query_duration	57.98	ms	{"server": "server-2", "environment": "production"}	2025-10-27 00:50:44.638
99	background_job	cache_hit_rate	10.86	%	{"server": "server-3", "environment": "production"}	2025-10-27 00:50:44.638
100	system	job_execution_time	61.15	ms	{"server": "server-1", "environment": "production"}	2025-10-27 00:50:44.638
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.profiles (id, user_id, cover_photo, bio, trading_level, trading_style, trading_platform, trading_since, specialties, telegram, discord, twitter, youtube, tradingview, website, profile_layout, custom_slug, is_public, is_premium, brand_colors, show_revenue, show_sales, show_followers, show_activity, updated_at) FROM stdin;
1	49065260	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	professional	\N	t	f	\N	t	t	t	t	2025-10-28 06:03:57.858
\.


--
-- Data for Name: recharge_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recharge_orders (id, user_id, coin_amount, price_usd, payment_method, payment_id, status, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.referrals (id, referrer_id, referred_user_id, referral_code, status, total_earnings, created_at) FROM stdin;
\.


--
-- Data for Name: reported_content; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reported_content (id, reporter_id, content_type, content_id, report_reason, description, status, assigned_to, resolution, action_taken, created_at, resolved_at) FROM stdin;
1	7424f4cb-3490-4b20-b08a-8728e5786303	thread	reported-content-0	spam	User report #0: This content violates our community guidelines. spam detected.	pending	\N	\N	\N	2025-10-28 00:50:43.877	\N
2	97ba45ea-c4ae-4f8d-8216-cf304ce353af	reply	reported-content-1	harassment	User report #1: This content violates our community guidelines. harassment detected.	investigating	\N	\N	\N	2025-10-27 21:50:43.877	\N
3	21ce8c06-6b65-4cab-9961-ac99121e0696	content	reported-content-2	scam	User report #2: This content violates our community guidelines. scam detected.	resolved	\N	\N	\N	2025-10-27 18:50:43.877	\N
4	607766e0-6d78-4482-84ba-5718d78e937f	review	reported-content-3	inappropriate	User report #3: This content violates our community guidelines. inappropriate detected.	dismissed	\N	\N	\N	2025-10-27 15:50:43.877	\N
5	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	broker_review	reported-content-4	copyright	User report #4: This content violates our community guidelines. copyright detected.	pending	\N	\N	\N	2025-10-27 12:50:43.877	\N
6	7424f4cb-3490-4b20-b08a-8728e5786303	thread	reported-content-5	fake_results	User report #5: This content violates our community guidelines. fake_results detected.	investigating	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	\N	2025-10-27 09:50:43.877	\N
7	97ba45ea-c4ae-4f8d-8216-cf304ce353af	reply	reported-content-6	spam	User report #6: This content violates our community guidelines. spam detected.	resolved	7424f4cb-3490-4b20-b08a-8728e5786303	\N	\N	2025-10-27 06:50:43.877	\N
8	21ce8c06-6b65-4cab-9961-ac99121e0696	content	reported-content-7	harassment	User report #7: This content violates our community guidelines. harassment detected.	dismissed	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	\N	2025-10-27 03:50:43.877	\N
9	607766e0-6d78-4482-84ba-5718d78e937f	review	reported-content-8	scam	User report #8: This content violates our community guidelines. scam detected.	pending	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	\N	2025-10-27 00:50:43.877	\N
10	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	broker_review	reported-content-9	inappropriate	User report #9: This content violates our community guidelines. inappropriate detected.	investigating	7424f4cb-3490-4b20-b08a-8728e5786303	\N	\N	2025-10-26 21:50:43.877	\N
11	7424f4cb-3490-4b20-b08a-8728e5786303	thread	reported-content-10	copyright	User report #10: This content violates our community guidelines. copyright detected.	resolved	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	\N	2025-10-26 18:50:43.877	\N
12	97ba45ea-c4ae-4f8d-8216-cf304ce353af	reply	reported-content-11	fake_results	User report #11: This content violates our community guidelines. fake_results detected.	dismissed	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	\N	2025-10-26 15:50:43.877	\N
13	21ce8c06-6b65-4cab-9961-ac99121e0696	content	reported-content-12	spam	User report #12: This content violates our community guidelines. spam detected.	pending	7424f4cb-3490-4b20-b08a-8728e5786303	\N	\N	2025-10-26 12:50:43.877	\N
14	607766e0-6d78-4482-84ba-5718d78e937f	review	reported-content-13	harassment	User report #13: This content violates our community guidelines. harassment detected.	investigating	97ba45ea-c4ae-4f8d-8216-cf304ce353af	\N	\N	2025-10-26 09:50:43.877	\N
15	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	broker_review	reported-content-14	scam	User report #14: This content violates our community guidelines. scam detected.	resolved	21ce8c06-6b65-4cab-9961-ac99121e0696	\N	\N	2025-10-26 06:50:43.877	\N
16	7424f4cb-3490-4b20-b08a-8728e5786303	thread	reported-content-15	inappropriate	User report #15: This content violates our community guidelines. inappropriate detected.	dismissed	7424f4cb-3490-4b20-b08a-8728e5786303	Report resolved: Content removed	removed	2025-10-26 03:50:43.877	2025-10-27 14:50:43.877
17	97ba45ea-c4ae-4f8d-8216-cf304ce353af	reply	reported-content-16	copyright	User report #16: This content violates our community guidelines. copyright detected.	pending	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Report resolved: User warned	warned	2025-10-26 00:50:43.877	2025-10-27 15:50:43.877
18	21ce8c06-6b65-4cab-9961-ac99121e0696	content	reported-content-17	fake_results	User report #17: This content violates our community guidelines. fake_results detected.	investigating	21ce8c06-6b65-4cab-9961-ac99121e0696	Report resolved: No action needed	dismissed	2025-10-25 21:50:43.877	2025-10-27 16:50:43.877
19	607766e0-6d78-4482-84ba-5718d78e937f	review	reported-content-18	spam	User report #18: This content violates our community guidelines. spam detected.	resolved	7424f4cb-3490-4b20-b08a-8728e5786303	Report resolved: Content removed	removed	2025-10-25 18:50:43.877	2025-10-27 17:50:43.877
20	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	broker_review	reported-content-19	harassment	User report #19: This content violates our community guidelines. harassment detected.	dismissed	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Report resolved: User warned	warned	2025-10-25 15:50:43.877	2025-10-27 18:50:43.877
21	7424f4cb-3490-4b20-b08a-8728e5786303	thread	reported-content-20	scam	User report #20: This content violates our community guidelines. scam detected.	pending	21ce8c06-6b65-4cab-9961-ac99121e0696	Report resolved: No action needed	dismissed	2025-10-25 12:50:43.877	2025-10-27 19:50:43.877
22	97ba45ea-c4ae-4f8d-8216-cf304ce353af	reply	reported-content-21	inappropriate	User report #21: This content violates our community guidelines. inappropriate detected.	investigating	7424f4cb-3490-4b20-b08a-8728e5786303	Report resolved: Content removed	removed	2025-10-25 09:50:43.877	2025-10-27 20:50:43.877
23	21ce8c06-6b65-4cab-9961-ac99121e0696	content	reported-content-22	copyright	User report #22: This content violates our community guidelines. copyright detected.	resolved	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Report resolved: User warned	warned	2025-10-25 06:50:43.877	2025-10-27 21:50:43.877
24	607766e0-6d78-4482-84ba-5718d78e937f	review	reported-content-23	fake_results	User report #23: This content violates our community guidelines. fake_results detected.	dismissed	21ce8c06-6b65-4cab-9961-ac99121e0696	Report resolved: No action needed	dismissed	2025-10-25 03:50:43.877	2025-10-27 22:50:43.877
25	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	broker_review	reported-content-24	spam	User report #24: This content violates our community guidelines. spam detected.	pending	7424f4cb-3490-4b20-b08a-8728e5786303	Report resolved: Content removed	removed	2025-10-25 00:50:43.877	2025-10-27 23:50:43.877
\.


--
-- Data for Name: scheduled_jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.scheduled_jobs (id, job_key, name, description, schedule, is_active, last_run, next_run, last_status, last_error, execution_count) FROM stdin;
1	update_user_reputation	Update User Reputation Scores	Recalculate reputation scores for all users based on activity	0 0 * * *	t	2025-10-27 21:50:44.616	2025-10-28 21:50:44.616	success	\N	87
2	clean_expired_sessions	Clean Expired Sessions	Remove expired user sessions from database	0 */6 * * *	t	2025-10-27 22:50:44.616	2025-10-28 04:50:44.616	success	\N	342
3	send_daily_digest	Send Daily Digest Emails	Send daily activity summary to subscribed users	0 8 * * *	t	2025-10-27 07:50:44.616	2025-10-28 07:50:44.616	success	\N	92
4	backup_database	Backup Database	Create automated database backup	0 2 * * *	t	2025-10-27 19:50:44.616	2025-10-28 19:50:44.616	success	\N	115
5	process_withdrawals	Process Pending Withdrawals	Process approved withdrawal requests	0 */3 * * *	t	2025-10-27 23:50:44.616	2025-10-28 02:50:44.616	success	\N	287
6	generate_analytics	Generate Analytics Reports	Generate daily analytics and insights	0 1 * * *	t	2025-10-27 18:50:44.616	2025-10-28 18:50:44.616	success	\N	98
\.


--
-- Data for Name: security_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.security_events (id, event_type, severity, user_id, ip_address, details, is_resolved, resolved_by, resolved_at, created_at) FROM stdin;
1	failed_login	low	\N	169.90.57.251	{"event": "failed_login", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-28 00:50:44.665
2	suspicious_activity	medium	97ba45ea-c4ae-4f8d-8216-cf304ce353af	94.247.254.65	{"event": "suspicious_activity", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 21:50:44.665
3	brute_force	high	21ce8c06-6b65-4cab-9961-ac99121e0696	92.65.187.216	{"event": "brute_force", "target": "login_endpoint", "attempts": 8, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 18:50:44.665
4	unauthorized_access	critical	607766e0-6d78-4482-84ba-5718d78e937f	231.113.94.93	{"event": "unauthorized_access", "target": "login_endpoint", "attempts": 1, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 15:50:44.665
5	data_breach_attempt	low	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	157.144.156.213	{"event": "data_breach_attempt", "target": "login_endpoint", "attempts": 5, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 12:50:44.665
6	failed_login	medium	\N	187.115.54.160	{"event": "failed_login", "target": "login_endpoint", "attempts": 1, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 09:50:44.665
7	suspicious_activity	high	97ba45ea-c4ae-4f8d-8216-cf304ce353af	3.160.218.70	{"event": "suspicious_activity", "target": "login_endpoint", "attempts": 9, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 06:50:44.665
8	brute_force	critical	21ce8c06-6b65-4cab-9961-ac99121e0696	32.89.247.56	{"event": "brute_force", "target": "login_endpoint", "attempts": 2, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 03:50:44.665
9	unauthorized_access	low	607766e0-6d78-4482-84ba-5718d78e937f	178.12.61.63	{"event": "unauthorized_access", "target": "login_endpoint", "attempts": 6, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-27 00:50:44.665
10	data_breach_attempt	medium	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	71.10.107.86	{"event": "data_breach_attempt", "target": "login_endpoint", "attempts": 4, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 21:50:44.666
11	failed_login	high	\N	43.26.148.11	{"event": "failed_login", "target": "login_endpoint", "attempts": 5, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 18:50:44.666
12	suspicious_activity	critical	97ba45ea-c4ae-4f8d-8216-cf304ce353af	132.29.37.248	{"event": "suspicious_activity", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 15:50:44.666
13	brute_force	low	21ce8c06-6b65-4cab-9961-ac99121e0696	131.222.163.213	{"event": "brute_force", "target": "login_endpoint", "attempts": 7, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 12:50:44.666
14	unauthorized_access	medium	607766e0-6d78-4482-84ba-5718d78e937f	50.160.214.84	{"event": "unauthorized_access", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 09:50:44.666
15	data_breach_attempt	high	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	244.241.202.44	{"event": "data_breach_attempt", "target": "login_endpoint", "attempts": 8, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 06:50:44.666
16	failed_login	critical	\N	205.89.100.150	{"event": "failed_login", "target": "login_endpoint", "attempts": 4, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 03:50:44.666
17	suspicious_activity	low	97ba45ea-c4ae-4f8d-8216-cf304ce353af	10.159.186.232	{"event": "suspicious_activity", "target": "login_endpoint", "attempts": 2, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-26 00:50:44.666
18	brute_force	medium	21ce8c06-6b65-4cab-9961-ac99121e0696	4.138.98.86	{"event": "brute_force", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-25 21:50:44.666
19	unauthorized_access	high	607766e0-6d78-4482-84ba-5718d78e937f	251.245.7.4	{"event": "unauthorized_access", "target": "login_endpoint", "attempts": 9, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-25 18:50:44.666
20	data_breach_attempt	critical	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	71.225.84.145	{"event": "data_breach_attempt", "target": "login_endpoint", "attempts": 7, "userAgent": "Mozilla/5.0"}	f	\N	\N	2025-10-25 15:50:44.666
21	failed_login	low	\N	122.178.188.89	{"event": "failed_login", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	t	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 14:50:44.666	2025-10-25 12:50:44.666
22	suspicious_activity	medium	97ba45ea-c4ae-4f8d-8216-cf304ce353af	224.10.184.62	{"event": "suspicious_activity", "target": "login_endpoint", "attempts": 2, "userAgent": "Mozilla/5.0"}	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 15:50:44.666	2025-10-25 09:50:44.666
23	brute_force	high	21ce8c06-6b65-4cab-9961-ac99121e0696	164.65.202.72	{"event": "brute_force", "target": "login_endpoint", "attempts": 2, "userAgent": "Mozilla/5.0"}	t	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 16:50:44.666	2025-10-25 06:50:44.666
24	unauthorized_access	critical	607766e0-6d78-4482-84ba-5718d78e937f	76.162.113.225	{"event": "unauthorized_access", "target": "login_endpoint", "attempts": 4, "userAgent": "Mozilla/5.0"}	t	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 17:50:44.666	2025-10-25 03:50:44.666
25	data_breach_attempt	low	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	70.88.22.46	{"event": "data_breach_attempt", "target": "login_endpoint", "attempts": 5, "userAgent": "Mozilla/5.0"}	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 18:50:44.666	2025-10-25 00:50:44.666
26	failed_login	medium	\N	17.68.62.98	{"event": "failed_login", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	t	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 19:50:44.666	2025-10-24 21:50:44.666
27	suspicious_activity	high	97ba45ea-c4ae-4f8d-8216-cf304ce353af	213.206.116.41	{"event": "suspicious_activity", "target": "login_endpoint", "attempts": 8, "userAgent": "Mozilla/5.0"}	t	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 20:50:44.666	2025-10-24 18:50:44.666
28	brute_force	critical	21ce8c06-6b65-4cab-9961-ac99121e0696	159.199.139.33	{"event": "brute_force", "target": "login_endpoint", "attempts": 10, "userAgent": "Mozilla/5.0"}	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 21:50:44.666	2025-10-24 15:50:44.666
29	unauthorized_access	low	607766e0-6d78-4482-84ba-5718d78e937f	236.189.200.111	{"event": "unauthorized_access", "target": "login_endpoint", "attempts": 2, "userAgent": "Mozilla/5.0"}	t	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-27 22:50:44.666	2025-10-24 12:50:44.666
30	data_breach_attempt	medium	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	203.132.188.107	{"event": "data_breach_attempt", "target": "login_endpoint", "attempts": 2, "userAgent": "Mozilla/5.0"}	t	21ce8c06-6b65-4cab-9961-ac99121e0696	2025-10-27 23:50:44.666	2025-10-24 09:50:44.666
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
wc1QX1dJJf6Ty06mLuG4sB6A0NRvge62	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T09:21:42.727Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761646902, "iat": 1761643302, "iss": "https://replit.com/oidc", "sub": "49065260", "email": "puspalpaul8@gmail.com", "at_hash": "G_Mm1Jbl4OQaQ7vpmdwofQ", "username": "puspalpaul8", "auth_time": 1761630029, "last_name": null, "first_name": "YoForexDev"}, "expires_at": 1761646902, "access_token": "MbpELlu3Kz29nUgYoGBn5sf7gxmMUplzS9J2k78Xdkg", "refresh_token": "0aTX8GuPBRNU6fONGweA_Ze0LehFiOXv9xlbsldWtRU"}}}	2025-11-04 10:16:13
6j_cKXoX0PT8VEJaPz0MX0hn799krvFa	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-03T17:11:10.157Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761588670, "iat": 1761585070, "iss": "https://replit.com/oidc", "sub": "49065260", "email": "puspalpaul8@gmail.com", "at_hash": "kf_HkT5tfM0CkbMHtAIJDg", "username": "puspalpaul8", "auth_time": 1761585069, "last_name": null, "first_name": "YoForexDev"}, "expires_at": 1761588670, "access_token": "e4hoO6P9E4izogGH-OcK1KqB0lN_4Mnt1GqTHQ21G-O", "refresh_token": "Pn0C3QsG79JELZ6zGwO_5TLCOG5Br8dpAOAKah-BzXd"}}}	2025-11-03 17:11:14
JrJAOR8k9GkWqJRXwmNGVLJMAwUBZuIf	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T09:50:05.911Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761648605, "iat": 1761645005, "iss": "https://replit.com/oidc", "sub": "49065260", "email": "puspalpaul8@gmail.com", "at_hash": "QjidhFhaDpI4hqhu5T6dCA", "username": "puspalpaul8", "auth_time": 1761640948, "last_name": null, "first_name": "YoForexDev"}, "expires_at": 1761648605, "access_token": "cHm0T-pv3esREZHdnOSeOkscNf6eaQwtJUpq6b0fSsl", "refresh_token": "yN7H1FcsBLU6HVxZyk5WDD_NZLDmwzWfXD1ODDyEsyk"}}}	2025-11-04 10:36:38
7eWKD8eugMeCQDnGFPkzhNKvbO0_4dI9	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T05:40:29.845Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "MAihor_44ji93x_lWlviIKt2G8-DT8ec1xYrvd_OFDY"}}	2025-11-04 05:40:30
mdCJ7DHasGCUJqqY3ry2YQWM9wawzxGb	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T10:33:10.103Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "ZTIOCkiCiydjgRzPJXooczKzM0m_KHPGOlpmd4G6Lx8"}}	2025-11-04 10:36:51
mWG3VD_JY_vg1exZnjRMhBmvpQY5vESd	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T09:00:45.993Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761645645, "iat": 1761642045, "iss": "https://replit.com/oidc", "sub": "49065260", "email": "puspalpaul8@gmail.com", "at_hash": "2y8b8FpvUFOXE_tPgLYwQQ", "username": "puspalpaul8", "auth_time": 1761588834, "last_name": null, "first_name": "YoForexDev"}, "expires_at": 1761645645, "access_token": "o0tNPn2qCWiZxij7V76VnfgOhW9qY-V0vfwtUdMoMHY", "refresh_token": "At-sCvFIgbwrI92SW5neM4DFTpUz8zlohv_uQLnVr0K"}}}	2025-11-04 09:30:43
WMVaiP_JGXXFB4DjOBK6qkDTTjUShwMA	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T05:34:17.081Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "F8zEYqV3i_hfCn-H2BblVv7hu_Ms_7cnzo9otx6lq9o"}}	2025-11-04 09:31:50
Ni7cVpMFcdfJnA7E3iYBWvuiiji93m_u	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T05:12:58.380Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "J7a8woJkvYtAhPawYqmDi6hk-44mwi12ii-l0y2WJH8"}}	2025-11-04 05:12:59
O21cJKblLJh1Qd4z7wSraT548slT4oT9	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T09:57:46.479Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761649066, "iat": 1761645466, "iss": "https://replit.com/oidc", "sub": "49065260", "email": "puspalpaul8@gmail.com", "at_hash": "LsEAoJK-GIVu-mRMM0XfMg", "username": "puspalpaul8", "auth_time": 1761645465, "last_name": null, "first_name": "YoForexDev"}, "expires_at": 1761649066, "access_token": "iLGBppoBPnb_aL7gi25gyJ-E44HOG0OQJWqJFyOGuyZ", "refresh_token": "9vDKDbcNVwq3FMmUH6D1DKExKCD4i3pMhfeFcN8SYCy"}}}	2025-11-04 10:36:59
0HmTOeJoq6F0ClQqbx92Epsfj-5h2Sgs	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T10:07:16.104Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761649636, "iat": 1761646036, "iss": "https://replit.com/oidc", "sub": "49065260", "email": "puspalpaul8@gmail.com", "at_hash": "3Nc3_GVG_kldZQy_i9FlUA", "username": "puspalpaul8", "auth_time": 1761631196, "last_name": null, "first_name": "YoForexDev"}, "expires_at": 1761649636, "access_token": "1NEQc5unFqaGJkDS_z7bi9pPJOgZWtnQoGnG1aVx3yu", "refresh_token": "-KvuiM42IDZrKy1vLi7-2uVIvRIs70Oxjty1wEClEnN"}}}	2025-11-04 10:36:25
DnVLI9EuX3oMXnMpivVOJg-Og1ARkBcm	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T07:02:53.651Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761638573, "iat": 1761634973, "iss": "https://replit.com/oidc", "sub": "49065260", "email": "puspalpaul8@gmail.com", "at_hash": "QqNVSr68QZuTX75Npvm-xQ", "username": "puspalpaul8", "auth_time": 1761629980, "last_name": null, "first_name": "YoForexDev"}, "expires_at": 1761638573, "access_token": "2OWdNt0qFAn7tImprACQWxd74sf0p9Y5-du81vTkh6m", "refresh_token": "2vUr3jSOh2vGyySoBQhiRFWFZJ1aarA5jDYzlSSmipi"}}}	2025-11-04 07:22:00
AM1rY1kC6_Alte_Ytg9AKilrzoebxexa	{"cookie": {"path": "/", "secure": true, "expires": "2025-11-04T05:34:44.721Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "5c700d50-5399-46df-98d2-dc27dba0ac4f", "exp": 1761633284, "iat": 1761629684, "iss": "https://replit.com/oidc", "sub": "49059220", "email": "yoforexorgh@gmail.com", "at_hash": "QGo35iiXo3rQqY1tqNenlQ", "username": "yoforexorgh", "auth_time": 1761629684, "last_name": "Nayak", "first_name": "Arijit"}, "expires_at": 1761633284, "access_token": "2gCVZ7ae_Mj5v0VAqMscVrRnIrhsr5tGUpL0cZ7kae5", "refresh_token": "EBbVuiRQTeKcUQXHp2z_85u_8G3V2AyhNNDMjf1Klvx"}}}	2025-11-04 05:39:43
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_tickets (id, ticket_number, user_id, subject, description, status, priority, category, assigned_to, replies, tags, created_at, updated_at, resolved_at) FROM stdin;
1	TICKET-10000	7424f4cb-3490-4b20-b08a-8728e5786303	Cannot withdraw coins	Support ticket #0: Detailed description of the user's issue. The user is experiencing problems with technical. Please investigate and resolve.	open	low	technical	\N	{}	{technical,low}	2025-10-28 00:50:44.248	2025-10-28 00:50:44.248	\N
2	TICKET-10001	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Account verification issue	Support ticket #1: Detailed description of the user's issue. The user is experiencing problems with billing. Please investigate and resolve.	in_progress	medium	billing	\N	{}	{billing,medium}	2025-10-27 00:50:44.248	2025-10-27 11:54:27.79	\N
3	TICKET-10002	21ce8c06-6b65-4cab-9961-ac99121e0696	EA download not working	Support ticket #2: Detailed description of the user's issue. The user is experiencing problems with account. Please investigate and resolve.	waiting_user	high	account	\N	{}	{account,high}	2025-10-26 00:50:44.248	2025-10-27 08:17:26.021	\N
4	TICKET-10003	607766e0-6d78-4482-84ba-5718d78e937f	Payment not reflected	Support ticket #3: Detailed description of the user's issue. The user is experiencing problems with report. Please investigate and resolve.	resolved	urgent	report	\N	{}	{report,urgent}	2025-10-25 00:50:44.248	2025-10-27 23:17:58.942	2025-10-26 02:38:59.887
5	TICKET-10004	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Profile update error	Support ticket #4: Detailed description of the user's issue. The user is experiencing problems with feature_request. Please investigate and resolve.	closed	low	feature_request	\N	{}	{feature_request,low}	2025-10-24 00:50:44.248	2025-10-24 17:26:50.321	2025-10-27 18:45:09.326
6	TICKET-10005	7424f4cb-3490-4b20-b08a-8728e5786303	Feature request: Dark mode	Support ticket #5: Detailed description of the user's issue. The user is experiencing problems with other. Please investigate and resolve.	open	medium	other	7424f4cb-3490-4b20-b08a-8728e5786303	{}	{other,medium}	2025-10-23 00:50:44.248	2025-10-24 04:58:42.572	\N
7	TICKET-10006	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Suspicious activity on account	Support ticket #6: Detailed description of the user's issue. The user is experiencing problems with technical. Please investigate and resolve.	in_progress	high	technical	97ba45ea-c4ae-4f8d-8216-cf304ce353af	{}	{technical,high}	2025-10-22 00:50:44.248	2025-10-25 23:45:36.825	\N
8	TICKET-10007	21ce8c06-6b65-4cab-9961-ac99121e0696	Cannot withdraw coins	Support ticket #7: Detailed description of the user's issue. The user is experiencing problems with billing. Please investigate and resolve.	waiting_user	urgent	billing	21ce8c06-6b65-4cab-9961-ac99121e0696	{}	{billing,urgent}	2025-10-21 00:50:44.248	2025-10-26 12:30:29.055	\N
9	TICKET-10008	607766e0-6d78-4482-84ba-5718d78e937f	Account verification issue	Support ticket #8: Detailed description of the user's issue. The user is experiencing problems with account. Please investigate and resolve.	resolved	low	account	7424f4cb-3490-4b20-b08a-8728e5786303	{}	{account,low}	2025-10-20 00:50:44.248	2025-10-25 00:53:52.176	2025-10-21 21:38:52.607
10	TICKET-10009	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	EA download not working	Support ticket #9: Detailed description of the user's issue. The user is experiencing problems with report. Please investigate and resolve.	closed	medium	report	97ba45ea-c4ae-4f8d-8216-cf304ce353af	{}	{report,medium}	2025-10-19 00:50:44.248	2025-10-25 02:24:08.984	2025-10-22 10:13:48.12
11	TICKET-10010	7424f4cb-3490-4b20-b08a-8728e5786303	Payment not reflected	Support ticket #10: Detailed description of the user's issue. The user is experiencing problems with feature_request. Please investigate and resolve.	open	high	feature_request	21ce8c06-6b65-4cab-9961-ac99121e0696	{}	{feature_request,high}	2025-10-18 00:50:44.248	2025-10-24 11:08:29.984	\N
12	TICKET-10011	97ba45ea-c4ae-4f8d-8216-cf304ce353af	Profile update error	Support ticket #11: Detailed description of the user's issue. The user is experiencing problems with other. Please investigate and resolve.	in_progress	urgent	other	7424f4cb-3490-4b20-b08a-8728e5786303	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-19T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-20T00:50:44.248Z\\"}"}	{other,urgent}	2025-10-17 00:50:44.248	2025-10-18 03:09:14.562	\N
13	TICKET-10012	21ce8c06-6b65-4cab-9961-ac99121e0696	Feature request: Dark mode	Support ticket #12: Detailed description of the user's issue. The user is experiencing problems with technical. Please investigate and resolve.	waiting_user	low	technical	97ba45ea-c4ae-4f8d-8216-cf304ce353af	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-20T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-21T00:50:44.248Z\\"}"}	{technical,low}	2025-10-16 00:50:44.248	2025-10-21 15:35:52.722	\N
14	TICKET-10013	607766e0-6d78-4482-84ba-5718d78e937f	Suspicious activity on account	Support ticket #13: Detailed description of the user's issue. The user is experiencing problems with billing. Please investigate and resolve.	resolved	medium	billing	21ce8c06-6b65-4cab-9961-ac99121e0696	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-21T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-22T00:50:44.248Z\\"}"}	{billing,medium}	2025-10-15 00:50:44.248	2025-10-15 18:44:29.101	2025-10-18 16:13:10.058
15	TICKET-10014	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Cannot withdraw coins	Support ticket #14: Detailed description of the user's issue. The user is experiencing problems with account. Please investigate and resolve.	closed	high	account	7424f4cb-3490-4b20-b08a-8728e5786303	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-22T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-23T00:50:44.248Z\\"}"}	{account,high}	2025-10-14 00:50:44.248	2025-10-15 03:13:37.406	2025-10-18 09:57:08.819
16	TICKET-10015	7424f4cb-3490-4b20-b08a-8728e5786303	Account verification issue	Support ticket #15: Detailed description of the user's issue. The user is experiencing problems with report. Please investigate and resolve.	open	urgent	report	97ba45ea-c4ae-4f8d-8216-cf304ce353af	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-23T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-24T00:50:44.248Z\\"}"}	{report,urgent}	2025-10-13 00:50:44.248	2025-10-23 02:55:55.277	\N
17	TICKET-10016	97ba45ea-c4ae-4f8d-8216-cf304ce353af	EA download not working	Support ticket #16: Detailed description of the user's issue. The user is experiencing problems with feature_request. Please investigate and resolve.	in_progress	low	feature_request	21ce8c06-6b65-4cab-9961-ac99121e0696	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-24T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-25T00:50:44.248Z\\"}"}	{feature_request,low}	2025-10-12 00:50:44.248	2025-10-24 20:45:39.793	\N
18	TICKET-10017	21ce8c06-6b65-4cab-9961-ac99121e0696	Payment not reflected	Support ticket #17: Detailed description of the user's issue. The user is experiencing problems with other. Please investigate and resolve.	waiting_user	medium	other	7424f4cb-3490-4b20-b08a-8728e5786303	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-25T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-26T00:50:44.248Z\\"}"}	{other,medium}	2025-10-11 00:50:44.248	2025-10-14 12:45:18.393	\N
19	TICKET-10018	607766e0-6d78-4482-84ba-5718d78e937f	Profile update error	Support ticket #18: Detailed description of the user's issue. The user is experiencing problems with technical. Please investigate and resolve.	resolved	high	technical	97ba45ea-c4ae-4f8d-8216-cf304ce353af	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-26T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-27T00:50:44.248Z\\"}"}	{technical,high}	2025-10-10 00:50:44.248	2025-10-12 15:20:03.689	2025-10-14 02:49:11.719
20	TICKET-10019	b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	Feature request: Dark mode	Support ticket #19: Detailed description of the user's issue. The user is experiencing problems with billing. Please investigate and resolve.	closed	urgent	billing	21ce8c06-6b65-4cab-9961-ac99121e0696	{"{\\"author\\": \\"admin\\", \\"message\\": \\"We are looking into this issue.\\", \\"timestamp\\": \\"2025-10-27T00:50:44.248Z\\"}","{\\"author\\": \\"user\\", \\"message\\": \\"Thank you for the update.\\", \\"timestamp\\": \\"2025-10-28T00:50:44.248Z\\"}"}	{billing,urgent}	2025-10-09 00:50:44.248	2025-10-14 22:02:50.746	2025-10-27 05:55:16.621
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.system_settings (id, setting_key, setting_value, category, description, updated_by, updated_at) FROM stdin;
1	site_name	{"value": "YoForex"}	general	Platform name	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-24 06:18:06.685
2	site_tagline	{"value": "Professional EA Trading Community"}	general	Platform tagline	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-13 09:23:05.876
3	maintenance_mode	{"value": false}	general	Enable maintenance mode	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-05 21:27:56.199
4	registration_enabled	{"value": true}	general	Allow new user registrations	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-03 00:27:24.098
5	max_upload_size	{"value": 50}	general	Maximum file upload size (MB)	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-04 15:21:14.397
6	coin_exchange_rate	{"value": 0.055}	coins	100 coins = $5.50 USD	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-03 00:16:57.283
7	min_withdrawal	{"value": 1000}	coins	Minimum withdrawal amount in coins	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-24 22:09:35.619
8	withdrawal_fee	{"value": 0.05}	coins	Withdrawal fee percentage (5%)	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-19 17:12:15.708
9	daily_checkin_reward	{"value": 10}	coins	Daily check-in coin reward	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-25 17:36:31.263
10	referral_bonus	{"value": 500}	coins	Referral signup bonus	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-12 12:38:01.87
11	email_from	{"value": "noreply@yoforex.com"}	email	From email address	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-22 02:48:41.48
12	smtp_host	{"value": "smtp.sendgrid.net"}	email	SMTP server hostname	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 16:18:30.434
13	smtp_port	{"value": 587}	email	SMTP server port	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-17 17:34:00.86
14	email_footer	{"value": "YoForex - Professional Trading Community"}	email	Email footer text	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-27 20:40:25.528
15	moderation_auto_approve	{"value": false}	moderation	Auto-approve content from trusted users	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-21 03:13:16.505
16	spam_threshold	{"value": 0.7}	moderation	Spam detection threshold (0-1)	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-16 15:03:30.757
17	max_daily_posts	{"value": 50}	moderation	Maximum posts per user per day	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-08 16:27:12.02
18	api_rate_limit	{"value": 100}	api	API rate limit per hour	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-07 13:40:35.527
19	enable_analytics	{"value": true}	analytics	Enable platform analytics	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-28 20:54:47.108
20	seo_default_title	{"value": "YoForex - EA Trading Community"}	seo	Default SEO title	7424f4cb-3490-4b20-b08a-8728e5786303	2025-10-05 11:51:51.029
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_achievements (id, user_id, achievement_id, progress, unlocked_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_badges (id, user_id, badge_type, awarded_at) FROM stdin;
\.


--
-- Data for Name: user_follows; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_follows (id, follower_id, following_id, created_at) FROM stdin;
e4890612-6e2b-4f50-bf56-cf96cddd7ec2	49065260	3d24a70f-a003-4e35-b501-c0faf77434b1	2025-10-28 10:31:55.197324
\.


--
-- Data for Name: user_segments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_segments (id, name, description, rules, user_count, created_by, created_at, updated_at) FROM stdin;
1	High Value Users	Users with over 10,000 coins in balance	{"coinBalance": {"gt": 10000}}	25	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-13 00:50:44.488	2025-10-28 00:50:44.488
2	New Users	Users registered within the last 30 days	{"registeredDays": {"lte": 30}}	150	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-28 00:50:44.488	2025-10-28 00:50:44.488
3	Content Creators	Users who published 5 or more items	{"publishedContent": {"gte": 5}}	42	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-29 00:50:44.488	2025-10-28 00:50:44.488
4	Active Contributors	Users with 20+ forum posts in last month	{"monthlyPosts": {"gte": 20}}	88	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-08 00:50:44.488	2025-10-28 00:50:44.488
5	At Risk - Inactive	Users with no activity in 60+ days	{"lastActivityDays": {"gte": 60}}	35	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-10-13 00:50:44.488	2025-10-28 00:50:44.488
6	Premium Buyers	Users who made 3+ purchases	{"totalPurchases": {"gte": 3}}	67	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-08 00:50:44.488	2025-10-28 00:50:44.488
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_settings (id, user_id, notification_preferences, privacy_settings, display_settings, communication_settings, publishing_defaults, advanced_settings, updated_at) FROM stdin;
\.


--
-- Data for Name: user_wallet; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_wallet (wallet_id, user_id, balance, available_balance, status, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, email, first_name, last_name, profile_image_url, total_coins, weekly_earned, rank, youtube_url, instagram_handle, telegram_handle, myfxbook_link, investor_id, investor_password, is_verified_trader, email_notifications, has_youtube_reward, has_myfxbook_reward, has_investor_reward, badges, onboarding_completed, onboarding_dismissed, onboarding_progress, reputation_score, last_reputation_update, created_at, updated_at, location) FROM stdin;
4167a292-537e-41f3-a8de-f77fe7ae0c29	generous_coder	\N	generous@example.com	\N	\N	\N	0	0	10	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	40	2025-10-28 10:35:00.85	2025-10-27 16:36:17.069753	2025-10-27 16:36:17.069753	\N
53943ec5-cbc1-48b8-a561-9b8109476fc9	dev_learner99	\N	dev@example.com	\N	\N	\N	0	0	13	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	70	2025-10-28 10:35:01.055	2025-10-27 16:36:16.942617	2025-10-27 16:36:16.942617	\N
40c33800-e478-43fa-9c2c-e9e73c806541	grid_hunter88	\N	grid@example.com	\N	\N	\N	0	0	5	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	95	2025-10-28 10:35:01.192	2025-10-27 16:36:16.886097	2025-10-27 16:36:16.886097	\N
49065260	Puspal	\N	puspalpaul8@gmail.com	YoForexDev	\N	/uploads/file-1761631428750-505193501.jpeg	15	15	1	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":true,"firstReply":true,"firstReport":false,"firstUpload":false,"socialLinked":false}	5	2025-10-28 10:35:01.314	2025-10-27 17:11:10.113715	2025-10-28 09:57:46.429	\N
49059220	yoforexorgh@gmail.com	\N	yoforexorgh@gmail.com	Arijit	Nayak	\N	0	0	3	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":true,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	0	2025-10-28 10:35:01.424	2025-10-28 05:34:44.602154	2025-10-28 05:34:44.602154	\N
4984962b-9a4c-42ed-8ade-d93db006a4d0	ea_coder123	\N	coder@example.com	\N	\N	\N	0	0	11	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	100	2025-10-28 10:35:01.973	2025-10-27 16:36:17.002729	2025-10-27 16:36:17.002729	\N
a29ced6d-6cd7-45c5-914b-bc02b15d9f11	crypto_ninja77	\N	crypto@example.com	\N	\N	\N	0	0	8	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	125	2025-10-28 10:35:02.077	2025-10-27 16:36:16.925828	2025-10-27 16:36:16.925828	\N
97ba45ea-c4ae-4f8d-8216-cf304ce353af	patient_trader	\N	patient@example.com	\N	\N	\N	0	0	12	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{top_contributor}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	120	2025-10-28 10:35:00.137	2025-10-27 16:36:17.16521	2025-10-27 16:36:17.16521	\N
b3cd32de-f083-45aa-aca9-3dccf2eae2b0	indicator_guy88	\N	indicator@example.com	\N	\N	\N	0	0	6	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	95	2025-10-28 10:35:00.258	2025-10-27 16:36:17.194005	2025-10-27 16:36:17.194005	\N
21ce8c06-6b65-4cab-9961-ac99121e0696	pip_trader2024	\N	pip@example.com	\N	\N	\N	0	0	2	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	80	2025-10-28 10:35:00.374	2025-10-27 16:36:16.905506	2025-10-27 16:36:16.905506	\N
607766e0-6d78-4482-84ba-5718d78e937f	hedge_master_	\N	hedge@example.com	\N	\N	\N	0	0	17	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	110	2025-10-28 10:35:00.489	2025-10-27 16:36:17.086461	2025-10-27 16:36:17.086461	\N
b2c2b0c5-efa9-47de-87ba-60ff7ae72c37	news_trader_x	\N	news@example.com	\N	\N	\N	0	0	7	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	60	2025-10-28 10:35:00.594	2025-10-27 16:36:16.966329	2025-10-27 16:36:16.966329	\N
3d24a70f-a003-4e35-b501-c0faf77434b1	forex_newbie423	\N	newbie@example.com	\N	\N	\N	0	0	16	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	168	2025-10-28 10:35:00.736	2025-10-27 16:36:16.84108	2025-10-27 16:36:16.84108	\N
7424f4cb-3490-4b20-b08a-8728e5786303	desperate_guy21	\N	desperate@example.com	\N	\N	\N	0	0	14	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	90	2025-10-28 10:35:01.535	2025-10-27 16:36:16.983767	2025-10-27 16:36:16.983767	\N
f9fab52c-da82-4291-ae6f-22e0eb8fd930	ea_runner2024	\N	runner@example.com	\N	\N	\N	0	0	4	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	75	2025-10-28 10:35:01.655	2025-10-27 16:36:17.139787	2025-10-27 16:36:17.139787	\N
5de857df-a081-4082-a778-8653df02a42c	angry_trader55	\N	angry@example.com	\N	\N	\N	0	0	15	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	95	2025-10-28 10:35:01.758	2025-10-27 16:36:17.031553	2025-10-27 16:36:17.031553	\N
3f1e2b32-87ba-4d84-a4b2-aca391ae7489	yen_hunter2025	\N	yen@example.com	\N	\N	\N	0	0	9	\N	\N	\N	\N	\N	\N	f	t	f	f	f	{}	f	f	{"profileCreated":false,"firstReply":false,"firstReport":false,"firstUpload":false,"socialLinked":false}	120	2025-10-28 10:35:01.867	2025-10-27 16:36:17.052601	2025-10-27 16:36:17.052601	\N
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.webhooks (id, url, events, secret, is_active, created_by, created_at, last_triggered, success_count, failure_count) FROM stdin;
1	https://api.example.com/webhooks/yoforex	{user.created,user.updated}	mvdrlvfrl	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-08-29 00:50:44.596	2025-10-27 21:50:44.596	1234	12
2	https://analytics.platform.com/events	{content.published,purchase.completed}	geiqrwydup	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-13 00:50:44.596	2025-10-27 23:50:44.596	5678	45
3	https://slack.com/webhooks/finance-alerts	{withdrawal.approved,purchase.completed}	ndiryowbon	t	7424f4cb-3490-4b20-b08a-8728e5786303	2025-09-28 00:50:44.596	2025-10-27 12:50:44.596	234	3
4	https://old-system.legacy.com/webhook	{user.created}	yqhw46tgi6	f	97ba45ea-c4ae-4f8d-8216-cf304ce353af	2025-05-01 00:50:44.596	2025-07-30 00:50:44.596	456	234
\.


--
-- Data for Name: withdrawal_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.withdrawal_requests (id, user_id, amount, crypto_type, wallet_address, status, exchange_rate, crypto_amount, processing_fee, transaction_hash, admin_notes, requested_at, processed_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: ab_tests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.ab_tests_id_seq', 3, true);


--
-- Name: achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.achievements_id_seq', 1, false);


--
-- Name: admin_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admin_actions_id_seq', 50, true);


--
-- Name: admin_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admin_roles_id_seq', 3, true);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.announcements_id_seq', 4, true);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 4, true);


--
-- Name: automation_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.automation_rules_id_seq', 5, true);


--
-- Name: campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.campaigns_id_seq', 1, false);


--
-- Name: content_revisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.content_revisions_id_seq', 40, true);


--
-- Name: dashboard_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.dashboard_settings_id_seq', 1, false);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 10, true);


--
-- Name: feature_flags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.feature_flags_id_seq', 5, true);


--
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goals_id_seq', 1, false);


--
-- Name: ip_bans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.ip_bans_id_seq', 12, true);


--
-- Name: media_library_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.media_library_id_seq', 25, true);


--
-- Name: moderation_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.moderation_queue_id_seq', 30, true);


--
-- Name: performance_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.performance_metrics_id_seq', 100, true);


--
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.profiles_id_seq', 2, true);


--
-- Name: referrals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.referrals_id_seq', 1, false);


--
-- Name: reported_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.reported_content_id_seq', 25, true);


--
-- Name: scheduled_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.scheduled_jobs_id_seq', 6, true);


--
-- Name: security_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.security_events_id_seq', 30, true);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.support_tickets_id_seq', 20, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 20, true);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_achievements_id_seq', 1, false);


--
-- Name: user_segments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_segments_id_seq', 6, true);


--
-- Name: user_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_settings_id_seq', 1, false);


--
-- Name: webhooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.webhooks_id_seq', 4, true);


--
-- Name: ab_tests ab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ab_tests
    ADD CONSTRAINT ab_tests_pkey PRIMARY KEY (id);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: achievements achievements_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_slug_unique UNIQUE (slug);


--
-- Name: activity_feed activity_feed_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_feed
    ADD CONSTRAINT activity_feed_pkey PRIMARY KEY (id);


--
-- Name: admin_actions admin_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_pkey PRIMARY KEY (id);


--
-- Name: admin_roles admin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (id);


--
-- Name: admin_roles admin_roles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_user_id_unique UNIQUE (user_id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_unique UNIQUE (key);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: broker_reviews broker_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.broker_reviews
    ADD CONSTRAINT broker_reviews_pkey PRIMARY KEY (id);


--
-- Name: brokers brokers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brokers
    ADD CONSTRAINT brokers_pkey PRIMARY KEY (id);


--
-- Name: brokers brokers_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.brokers
    ADD CONSTRAINT brokers_slug_unique UNIQUE (slug);


--
-- Name: campaigns campaigns_discount_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_discount_code_unique UNIQUE (discount_code);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: coin_journal_entries coin_journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coin_journal_entries
    ADD CONSTRAINT coin_journal_entries_pkey PRIMARY KEY (id);


--
-- Name: coin_ledger_transactions coin_ledger_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coin_ledger_transactions
    ADD CONSTRAINT coin_ledger_transactions_pkey PRIMARY KEY (id);


--
-- Name: coin_transactions coin_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_pkey PRIMARY KEY (id);


--
-- Name: content_likes content_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_likes
    ADD CONSTRAINT content_likes_pkey PRIMARY KEY (id);


--
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- Name: content_purchases content_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_purchases
    ADD CONSTRAINT content_purchases_pkey PRIMARY KEY (id);


--
-- Name: content_replies content_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_replies
    ADD CONSTRAINT content_replies_pkey PRIMARY KEY (id);


--
-- Name: content_reviews content_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_reviews
    ADD CONSTRAINT content_reviews_pkey PRIMARY KEY (id);


--
-- Name: content_revisions content_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_revisions
    ADD CONSTRAINT content_revisions_pkey PRIMARY KEY (id);


--
-- Name: content content_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_slug_unique UNIQUE (slug);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: daily_activity_limits daily_activity_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_activity_limits
    ADD CONSTRAINT daily_activity_limits_pkey PRIMARY KEY (id);


--
-- Name: dashboard_preferences dashboard_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT dashboard_preferences_pkey PRIMARY KEY (id);


--
-- Name: dashboard_preferences dashboard_preferences_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT dashboard_preferences_user_id_unique UNIQUE (user_id);


--
-- Name: dashboard_settings dashboard_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dashboard_settings
    ADD CONSTRAINT dashboard_settings_pkey PRIMARY KEY (id);


--
-- Name: dashboard_settings dashboard_settings_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dashboard_settings
    ADD CONSTRAINT dashboard_settings_user_id_unique UNIQUE (user_id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_template_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_template_key_unique UNIQUE (template_key);


--
-- Name: feature_flags feature_flags_flag_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_key_unique UNIQUE (flag_key);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: forum_categories forum_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_categories
    ADD CONSTRAINT forum_categories_pkey PRIMARY KEY (slug);


--
-- Name: forum_replies forum_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_pkey PRIMARY KEY (id);


--
-- Name: forum_replies forum_replies_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_slug_unique UNIQUE (slug);


--
-- Name: forum_threads forum_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_pkey PRIMARY KEY (id);


--
-- Name: forum_threads forum_threads_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_slug_unique UNIQUE (slug);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: ip_bans ip_bans_ip_address_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ip_bans
    ADD CONSTRAINT ip_bans_ip_address_unique UNIQUE (ip_address);


--
-- Name: ip_bans ip_bans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ip_bans
    ADD CONSTRAINT ip_bans_pkey PRIMARY KEY (id);


--
-- Name: ledger_reconciliation_runs ledger_reconciliation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ledger_reconciliation_runs
    ADD CONSTRAINT ledger_reconciliation_runs_pkey PRIMARY KEY (id);


--
-- Name: media_library media_library_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.media_library
    ADD CONSTRAINT media_library_pkey PRIMARY KEY (id);


--
-- Name: message_reactions message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: moderation_queue moderation_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.moderation_queue
    ADD CONSTRAINT moderation_queue_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_custom_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_custom_slug_unique UNIQUE (custom_slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);


--
-- Name: recharge_orders recharge_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recharge_orders
    ADD CONSTRAINT recharge_orders_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referral_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referral_code_unique UNIQUE (referral_code);


--
-- Name: reported_content reported_content_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reported_content
    ADD CONSTRAINT reported_content_pkey PRIMARY KEY (id);


--
-- Name: scheduled_jobs scheduled_jobs_job_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_jobs
    ADD CONSTRAINT scheduled_jobs_job_key_unique UNIQUE (job_key);


--
-- Name: scheduled_jobs scheduled_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.scheduled_jobs
    ADD CONSTRAINT scheduled_jobs_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_unique UNIQUE (ticket_number);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_setting_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_unique UNIQUE (setting_key);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (id);


--
-- Name: user_segments user_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_segments
    ADD CONSTRAINT user_segments_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);


--
-- Name: user_wallet user_wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_wallet
    ADD CONSTRAINT user_wallet_pkey PRIMARY KEY (wallet_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_ab_tests_end_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ab_tests_end_date ON public.ab_tests USING btree (end_date);


--
-- Name: idx_ab_tests_start_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ab_tests_start_date ON public.ab_tests USING btree (start_date);


--
-- Name: idx_ab_tests_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ab_tests_status ON public.ab_tests USING btree (status);


--
-- Name: idx_achievements_slug; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_achievements_slug ON public.achievements USING btree (slug);


--
-- Name: idx_activity_feed_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_activity_feed_user_id ON public.activity_feed USING btree (user_id);


--
-- Name: idx_admin_actions_action_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_admin_actions_action_type ON public.admin_actions USING btree (action_type);


--
-- Name: idx_admin_actions_admin_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_admin_actions_admin_id ON public.admin_actions USING btree (admin_id);


--
-- Name: idx_admin_actions_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_admin_actions_created_at ON public.admin_actions USING btree (created_at);


--
-- Name: idx_admin_actions_target_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_admin_actions_target_type ON public.admin_actions USING btree (target_type);


--
-- Name: idx_admin_roles_role; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_admin_roles_role ON public.admin_roles USING btree (role);


--
-- Name: idx_admin_roles_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_admin_roles_user_id ON public.admin_roles USING btree (user_id);


--
-- Name: idx_announcements_end_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_announcements_end_date ON public.announcements USING btree (end_date);


--
-- Name: idx_announcements_is_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_announcements_is_active ON public.announcements USING btree (is_active);


--
-- Name: idx_announcements_start_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_announcements_start_date ON public.announcements USING btree (start_date);


--
-- Name: idx_announcements_target_audience; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_announcements_target_audience ON public.announcements USING btree (target_audience);


--
-- Name: idx_api_keys_is_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_keys_is_active ON public.api_keys USING btree (is_active);


--
-- Name: idx_api_keys_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_keys_key ON public.api_keys USING btree (key);


--
-- Name: idx_api_keys_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_keys_user_id ON public.api_keys USING btree (user_id);


--
-- Name: idx_automation_rules_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_automation_rules_created_at ON public.automation_rules USING btree (created_at);


--
-- Name: idx_automation_rules_is_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_automation_rules_is_active ON public.automation_rules USING btree (is_active);


--
-- Name: idx_automation_rules_trigger_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_automation_rules_trigger_type ON public.automation_rules USING btree (trigger_type);


--
-- Name: idx_broker_reviews_broker_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_broker_reviews_broker_id ON public.broker_reviews USING btree (broker_id);


--
-- Name: idx_broker_reviews_unique_broker_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_broker_reviews_unique_broker_user ON public.broker_reviews USING btree (broker_id, user_id);


--
-- Name: idx_brokers_platform; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_brokers_platform ON public.brokers USING btree (platform);


--
-- Name: idx_brokers_regulation; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_brokers_regulation ON public.brokers USING btree (regulation);


--
-- Name: idx_brokers_slug; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_brokers_slug ON public.brokers USING btree (slug);


--
-- Name: idx_brokers_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_brokers_status ON public.brokers USING btree (status);


--
-- Name: idx_campaigns_discount_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_campaigns_discount_code ON public.campaigns USING btree (discount_code);


--
-- Name: idx_campaigns_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_campaigns_user_id ON public.campaigns USING btree (user_id);


--
-- Name: idx_coin_transactions_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_coin_transactions_user_id ON public.coin_transactions USING btree (user_id);


--
-- Name: idx_content_author_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_author_id ON public.content USING btree (author_id);


--
-- Name: idx_content_category; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_category ON public.content USING btree (category);


--
-- Name: idx_content_likes_unique_content_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_content_likes_unique_content_user ON public.content_likes USING btree (content_id, user_id);


--
-- Name: idx_content_likes_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_likes_user_id ON public.content_likes USING btree (user_id);


--
-- Name: idx_content_purchases_content_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_purchases_content_id ON public.content_purchases USING btree (content_id);


--
-- Name: idx_content_purchases_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_purchases_user_id ON public.content_purchases USING btree (buyer_id);


--
-- Name: idx_content_reviews_unique_content_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_content_reviews_unique_content_user ON public.content_reviews USING btree (content_id, user_id);


--
-- Name: idx_content_revisions_content_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_revisions_content_id ON public.content_revisions USING btree (content_id);


--
-- Name: idx_content_revisions_content_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_revisions_content_type ON public.content_revisions USING btree (content_type);


--
-- Name: idx_content_revisions_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_revisions_created_at ON public.content_revisions USING btree (created_at);


--
-- Name: idx_content_revisions_revision_number; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_revisions_revision_number ON public.content_revisions USING btree (revision_number);


--
-- Name: idx_content_sales_score; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_sales_score ON public.content USING btree (sales_score);


--
-- Name: idx_content_slug; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_slug ON public.content USING btree (slug);


--
-- Name: idx_content_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_content_status ON public.content USING btree (status);


--
-- Name: idx_daily_activity_user_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_daily_activity_user_date ON public.daily_activity_limits USING btree (user_id, activity_date);


--
-- Name: idx_daily_activity_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_daily_activity_user_id ON public.daily_activity_limits USING btree (user_id);


--
-- Name: idx_dashboard_preferences_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_dashboard_preferences_user_id ON public.dashboard_preferences USING btree (user_id);


--
-- Name: idx_dashboard_settings_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_dashboard_settings_user_id ON public.dashboard_settings USING btree (user_id);


--
-- Name: idx_email_templates_category; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_templates_category ON public.email_templates USING btree (category);


--
-- Name: idx_email_templates_is_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_templates_is_active ON public.email_templates USING btree (is_active);


--
-- Name: idx_email_templates_template_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_templates_template_key ON public.email_templates USING btree (template_key);


--
-- Name: idx_feature_flags_flag_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feature_flags_flag_key ON public.feature_flags USING btree (flag_key);


--
-- Name: idx_feature_flags_is_enabled; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_feature_flags_is_enabled ON public.feature_flags USING btree (is_enabled);


--
-- Name: idx_forum_categories_parent_slug; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_categories_parent_slug ON public.forum_categories USING btree (parent_slug);


--
-- Name: idx_forum_replies_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_replies_created_at ON public.forum_replies USING btree (created_at);


--
-- Name: idx_forum_replies_slug; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_replies_slug ON public.forum_replies USING btree (slug);


--
-- Name: idx_forum_replies_thread_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_replies_thread_id ON public.forum_replies USING btree (thread_id);


--
-- Name: idx_forum_threads_category; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_category ON public.forum_threads USING btree (category_slug);


--
-- Name: idx_forum_threads_engagement; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_engagement ON public.forum_threads USING btree (engagement_score);


--
-- Name: idx_forum_threads_last_activity; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_last_activity ON public.forum_threads USING btree (last_activity_at);


--
-- Name: idx_forum_threads_pinned; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_pinned ON public.forum_threads USING btree (is_pinned);


--
-- Name: idx_forum_threads_slug; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_slug ON public.forum_threads USING btree (slug);


--
-- Name: idx_forum_threads_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_status ON public.forum_threads USING btree (status);


--
-- Name: idx_forum_threads_subcategory; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_subcategory ON public.forum_threads USING btree (subcategory_slug);


--
-- Name: idx_forum_threads_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_forum_threads_type ON public.forum_threads USING btree (thread_type);


--
-- Name: idx_goals_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_goals_user_id ON public.goals USING btree (user_id);


--
-- Name: idx_ip_bans_expires_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ip_bans_expires_at ON public.ip_bans USING btree (expires_at);


--
-- Name: idx_ip_bans_ip_address; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ip_bans_ip_address ON public.ip_bans USING btree (ip_address);


--
-- Name: idx_ip_bans_is_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ip_bans_is_active ON public.ip_bans USING btree (is_active);


--
-- Name: idx_journal_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_journal_created_at ON public.coin_journal_entries USING btree (created_at);


--
-- Name: idx_journal_ledger_tx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_journal_ledger_tx ON public.coin_journal_entries USING btree (ledger_transaction_id);


--
-- Name: idx_journal_wallet; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_journal_wallet ON public.coin_journal_entries USING btree (wallet_id);


--
-- Name: idx_ledger_tx_initiator; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ledger_tx_initiator ON public.coin_ledger_transactions USING btree (initiator_user_id);


--
-- Name: idx_ledger_tx_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ledger_tx_status ON public.coin_ledger_transactions USING btree (status);


--
-- Name: idx_ledger_tx_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ledger_tx_type ON public.coin_ledger_transactions USING btree (type);


--
-- Name: idx_media_library_mime_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_media_library_mime_type ON public.media_library USING btree (mime_type);


--
-- Name: idx_media_library_uploaded_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_media_library_uploaded_at ON public.media_library USING btree (uploaded_at);


--
-- Name: idx_media_library_uploaded_by; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_media_library_uploaded_by ON public.media_library USING btree (uploaded_by);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- Name: idx_messages_is_read; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_is_read ON public.messages USING btree (is_read);


--
-- Name: idx_messages_recipient_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_recipient_id ON public.messages USING btree (recipient_id);


--
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: idx_moderation_queue_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_moderation_queue_created_at ON public.moderation_queue USING btree (created_at);


--
-- Name: idx_moderation_queue_priority_score; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_moderation_queue_priority_score ON public.moderation_queue USING btree (priority_score);


--
-- Name: idx_moderation_queue_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_moderation_queue_status ON public.moderation_queue USING btree (status);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_performance_metrics_metric_name; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_performance_metrics_metric_name ON public.performance_metrics USING btree (metric_name);


--
-- Name: idx_performance_metrics_metric_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_performance_metrics_metric_type ON public.performance_metrics USING btree (metric_type);


--
-- Name: idx_performance_metrics_recorded_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_performance_metrics_recorded_at ON public.performance_metrics USING btree (recorded_at);


--
-- Name: idx_profiles_custom_slug; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_profiles_custom_slug ON public.profiles USING btree (custom_slug);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_recharge_orders_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recharge_orders_user_id ON public.recharge_orders USING btree (user_id);


--
-- Name: idx_referrals_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_referrals_code ON public.referrals USING btree (referral_code);


--
-- Name: idx_referrals_referred_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_referrals_referred_user_id ON public.referrals USING btree (referred_user_id);


--
-- Name: idx_referrals_referrer_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_referrals_referrer_id ON public.referrals USING btree (referrer_id);


--
-- Name: idx_reported_content_content_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_reported_content_content_type ON public.reported_content USING btree (content_type);


--
-- Name: idx_reported_content_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_reported_content_created_at ON public.reported_content USING btree (created_at);


--
-- Name: idx_reported_content_reporter_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_reported_content_reporter_id ON public.reported_content USING btree (reporter_id);


--
-- Name: idx_reported_content_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_reported_content_status ON public.reported_content USING btree (status);


--
-- Name: idx_scheduled_jobs_is_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_scheduled_jobs_is_active ON public.scheduled_jobs USING btree (is_active);


--
-- Name: idx_scheduled_jobs_job_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_scheduled_jobs_job_key ON public.scheduled_jobs USING btree (job_key);


--
-- Name: idx_scheduled_jobs_next_run; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_scheduled_jobs_next_run ON public.scheduled_jobs USING btree (next_run);


--
-- Name: idx_security_events_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_security_events_created_at ON public.security_events USING btree (created_at);


--
-- Name: idx_security_events_event_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_security_events_event_type ON public.security_events USING btree (event_type);


--
-- Name: idx_security_events_is_resolved; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_security_events_is_resolved ON public.security_events USING btree (is_resolved);


--
-- Name: idx_security_events_severity; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_security_events_severity ON public.security_events USING btree (severity);


--
-- Name: idx_support_tickets_assigned_to; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets USING btree (assigned_to);


--
-- Name: idx_support_tickets_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at);


--
-- Name: idx_support_tickets_priority; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_support_tickets_priority ON public.support_tickets USING btree (priority);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_system_settings_category; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (category);


--
-- Name: idx_system_settings_setting_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_system_settings_setting_key ON public.system_settings USING btree (setting_key);


--
-- Name: idx_user_achievements_achievement_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id);


--
-- Name: idx_user_achievements_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_achievements_user_id ON public.user_achievements USING btree (user_id);


--
-- Name: idx_user_follows_follower_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_follows_follower_id ON public.user_follows USING btree (follower_id);


--
-- Name: idx_user_follows_unique_follower_following; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_user_follows_unique_follower_following ON public.user_follows USING btree (follower_id, following_id);


--
-- Name: idx_user_segments_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_segments_created_at ON public.user_segments USING btree (created_at);


--
-- Name: idx_user_segments_name; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_segments_name ON public.user_segments USING btree (name);


--
-- Name: idx_user_settings_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_user_settings_user_id ON public.user_settings USING btree (user_id);


--
-- Name: idx_user_wallet_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_wallet_status ON public.user_wallet USING btree (status);


--
-- Name: idx_user_wallet_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_user_wallet_user_id ON public.user_wallet USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_reputation; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_reputation ON public.users USING btree (reputation_score);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_webhooks_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_webhooks_created_at ON public.webhooks USING btree (created_at);


--
-- Name: idx_webhooks_is_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_webhooks_is_active ON public.webhooks USING btree (is_active);


--
-- Name: idx_withdrawal_requests_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests USING btree (status);


--
-- Name: idx_withdrawal_requests_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests USING btree (user_id);


--
-- Name: message_reactions_msg_user_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX message_reactions_msg_user_idx ON public.message_reactions USING btree (message_id, user_id);


--
-- Name: coin_journal_entries trg_prevent_journal_delete; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_journal_delete BEFORE DELETE ON public.coin_journal_entries FOR EACH ROW EXECUTE FUNCTION public.prevent_journal_modifications();


--
-- Name: coin_journal_entries trg_prevent_journal_update; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_prevent_journal_update BEFORE UPDATE ON public.coin_journal_entries FOR EACH ROW EXECUTE FUNCTION public.prevent_journal_modifications();


--
-- Name: coin_journal_entries trg_update_wallet_balance; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_update_wallet_balance BEFORE INSERT ON public.coin_journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();


--
-- Name: coin_ledger_transactions trg_validate_balanced_ledger; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_validate_balanced_ledger BEFORE UPDATE ON public.coin_ledger_transactions FOR EACH ROW EXECUTE FUNCTION public.validate_balanced_ledger();


--
-- Name: ab_tests ab_tests_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ab_tests
    ADD CONSTRAINT ab_tests_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: activity_feed activity_feed_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_feed
    ADD CONSTRAINT activity_feed_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: admin_actions admin_actions_admin_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_actions
    ADD CONSTRAINT admin_actions_admin_id_users_id_fk FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: admin_roles admin_roles_granted_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_granted_by_users_id_fk FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- Name: admin_roles admin_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: announcements announcements_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: api_keys api_keys_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: automation_rules automation_rules_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: broker_reviews broker_reviews_broker_id_brokers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.broker_reviews
    ADD CONSTRAINT broker_reviews_broker_id_brokers_id_fk FOREIGN KEY (broker_id) REFERENCES public.brokers(id);


--
-- Name: broker_reviews broker_reviews_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.broker_reviews
    ADD CONSTRAINT broker_reviews_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: campaigns campaigns_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: coin_journal_entries coin_journal_entries_ledger_transaction_id_coin_ledger_transact; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coin_journal_entries
    ADD CONSTRAINT coin_journal_entries_ledger_transaction_id_coin_ledger_transact FOREIGN KEY (ledger_transaction_id) REFERENCES public.coin_ledger_transactions(id);


--
-- Name: coin_journal_entries coin_journal_entries_wallet_id_user_wallet_wallet_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coin_journal_entries
    ADD CONSTRAINT coin_journal_entries_wallet_id_user_wallet_wallet_id_fk FOREIGN KEY (wallet_id) REFERENCES public.user_wallet(wallet_id);


--
-- Name: coin_ledger_transactions coin_ledger_transactions_initiator_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coin_ledger_transactions
    ADD CONSTRAINT coin_ledger_transactions_initiator_user_id_users_id_fk FOREIGN KEY (initiator_user_id) REFERENCES public.users(id);


--
-- Name: coin_transactions coin_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: content content_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: content_likes content_likes_content_id_content_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_likes
    ADD CONSTRAINT content_likes_content_id_content_id_fk FOREIGN KEY (content_id) REFERENCES public.content(id);


--
-- Name: content_likes content_likes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_likes
    ADD CONSTRAINT content_likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: content_purchases content_purchases_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_purchases
    ADD CONSTRAINT content_purchases_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: content_purchases content_purchases_content_id_content_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_purchases
    ADD CONSTRAINT content_purchases_content_id_content_id_fk FOREIGN KEY (content_id) REFERENCES public.content(id);


--
-- Name: content_purchases content_purchases_seller_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_purchases
    ADD CONSTRAINT content_purchases_seller_id_users_id_fk FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: content_purchases content_purchases_transaction_id_coin_transactions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_purchases
    ADD CONSTRAINT content_purchases_transaction_id_coin_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES public.coin_transactions(id);


--
-- Name: content_replies content_replies_content_id_content_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_replies
    ADD CONSTRAINT content_replies_content_id_content_id_fk FOREIGN KEY (content_id) REFERENCES public.content(id);


--
-- Name: content_replies content_replies_parent_id_content_replies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_replies
    ADD CONSTRAINT content_replies_parent_id_content_replies_id_fk FOREIGN KEY (parent_id) REFERENCES public.content_replies(id);


--
-- Name: content_replies content_replies_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_replies
    ADD CONSTRAINT content_replies_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: content_reviews content_reviews_content_id_content_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_reviews
    ADD CONSTRAINT content_reviews_content_id_content_id_fk FOREIGN KEY (content_id) REFERENCES public.content(id);


--
-- Name: content_reviews content_reviews_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_reviews
    ADD CONSTRAINT content_reviews_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: content_revisions content_revisions_changed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.content_revisions
    ADD CONSTRAINT content_revisions_changed_by_users_id_fk FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: conversations conversations_participant1_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant1_id_users_id_fk FOREIGN KEY (participant1_id) REFERENCES public.users(id);


--
-- Name: conversations conversations_participant2_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant2_id_users_id_fk FOREIGN KEY (participant2_id) REFERENCES public.users(id);


--
-- Name: daily_activity_limits daily_activity_limits_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.daily_activity_limits
    ADD CONSTRAINT daily_activity_limits_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: dashboard_preferences dashboard_preferences_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT dashboard_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: dashboard_settings dashboard_settings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dashboard_settings
    ADD CONSTRAINT dashboard_settings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: email_templates email_templates_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: feature_flags feature_flags_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: forum_replies forum_replies_parent_id_forum_replies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_parent_id_forum_replies_id_fk FOREIGN KEY (parent_id) REFERENCES public.forum_replies(id);


--
-- Name: forum_replies forum_replies_thread_id_forum_threads_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_thread_id_forum_threads_id_fk FOREIGN KEY (thread_id) REFERENCES public.forum_threads(id);


--
-- Name: forum_replies forum_replies_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: forum_threads forum_threads_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: goals goals_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ip_bans ip_bans_banned_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ip_bans
    ADD CONSTRAINT ip_bans_banned_by_users_id_fk FOREIGN KEY (banned_by) REFERENCES public.users(id);


--
-- Name: media_library media_library_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.media_library
    ADD CONSTRAINT media_library_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: message_reactions message_reactions_message_id_messages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_message_id_messages_id_fk FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: message_reactions message_reactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: messages messages_recipient_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_users_id_fk FOREIGN KEY (recipient_id) REFERENCES public.users(id);


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: moderation_queue moderation_queue_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.moderation_queue
    ADD CONSTRAINT moderation_queue_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: moderation_queue moderation_queue_reviewed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.moderation_queue
    ADD CONSTRAINT moderation_queue_reviewed_by_users_id_fk FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: profiles profiles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: recharge_orders recharge_orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recharge_orders
    ADD CONSTRAINT recharge_orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: referrals referrals_referred_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_users_id_fk FOREIGN KEY (referred_user_id) REFERENCES public.users(id);


--
-- Name: referrals referrals_referrer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_users_id_fk FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- Name: reported_content reported_content_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reported_content
    ADD CONSTRAINT reported_content_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: reported_content reported_content_reporter_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reported_content
    ADD CONSTRAINT reported_content_reporter_id_users_id_fk FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: security_events security_events_resolved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_resolved_by_users_id_fk FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: security_events security_events_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: support_tickets support_tickets_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: support_tickets support_tickets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: system_settings system_settings_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: user_achievements user_achievements_achievement_id_achievements_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_achievements_id_fk FOREIGN KEY (achievement_id) REFERENCES public.achievements(id);


--
-- Name: user_achievements user_achievements_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_badges user_badges_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_follows user_follows_follower_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_users_id_fk FOREIGN KEY (follower_id) REFERENCES public.users(id);


--
-- Name: user_follows user_follows_following_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_following_id_users_id_fk FOREIGN KEY (following_id) REFERENCES public.users(id);


--
-- Name: user_segments user_segments_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_segments
    ADD CONSTRAINT user_segments_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: user_settings user_settings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_wallet user_wallet_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_wallet
    ADD CONSTRAINT user_wallet_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: webhooks webhooks_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: withdrawal_requests withdrawal_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

