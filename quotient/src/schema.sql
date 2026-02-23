CREATE TABLE IF NOT EXISTS "alerts" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "author_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "active" BOOL NOT NULL  DEFAULT True,
    "message" JSONB NOT NULL,
    "conditions" VARCHAR(100)[] NOT NULL
);
CREATE TABLE IF NOT EXISTS "sm.assigned_slots" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "num" INT,
    "user_id" BIGINT,
    "team_name" TEXT,
    "members" BIGINT[] NOT NULL,
    "message_id" BIGINT,
    "jump_url" TEXT
);
CREATE TABLE IF NOT EXISTS "autopurge" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "delete_after" INT NOT NULL  DEFAULT 10
);
CREATE TABLE IF NOT EXISTS "autoroles" (
    "guild_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "humans" BIGINT[] NOT NULL,
    "bots" BIGINT[] NOT NULL
);
CREATE TABLE IF NOT EXISTS "esports_bans" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS "sm.banned_teams" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "num" INT,
    "user_id" BIGINT,
    "team_name" TEXT,
    "members" BIGINT[] NOT NULL,
    "reason" VARCHAR(200),
    "expires" TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS "block_list" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "block_id" BIGINT NOT NULL,
    "block_id_type" SMALLINT NOT NULL,
    "blocked_by" BIGINT,
    "reason" VARCHAR(250),
    "timestamp" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON COLUMN "block_list"."block_id_type" IS 'USER: 1\nGUILD: 2';
CREATE TABLE IF NOT EXISTS "commands" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "cmd" VARCHAR(100) NOT NULL,
    "used_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "prefix" VARCHAR(100) NOT NULL,
    "failed" BOOL NOT NULL  DEFAULT False
);
CREATE INDEX IF NOT EXISTS "idx_commands_guild_i_43c2ba" ON "commands" ("guild_id");
CREATE INDEX IF NOT EXISTS "idx_commands_user_id_1bd53f" ON "commands" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_commands_cmd_75c5bf" ON "commands" ("cmd");
CREATE TABLE IF NOT EXISTS "easytags" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "delete_after" BOOL NOT NULL  DEFAULT False
);
CREATE INDEX IF NOT EXISTS "idx_easytags_channel_2a6892" ON "easytags" ("channel_id");
CREATE TABLE IF NOT EXISTS "guild_data" (
    "guild_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "prefix" VARCHAR(5) NOT NULL  DEFAULT 'q',
    "embed_color" INT   DEFAULT 65459,
    "embed_footer" TEXT NOT NULL,
    "tag_enabled_for_everyone" BOOL NOT NULL  DEFAULT True,
    "is_premium" BOOL NOT NULL  DEFAULT False,
    "made_premium_by" BIGINT,
    "premium_end_time" TIMESTAMPTZ,
    "premium_notified" BOOL NOT NULL  DEFAULT False,
    "public_profile" BOOL NOT NULL  DEFAULT True,
    "private_channel" BIGINT,
    "dashboard_access" JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS "lockdown" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "role_id" BIGINT,
    "channel_id" BIGINT,
    "channel_ids" BIGINT[] NOT NULL,
    "expire_time" TIMESTAMPTZ,
    "author_id" BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_lockdown_guild_i_46683b" ON "lockdown" ("guild_id");
CREATE INDEX IF NOT EXISTS "idx_lockdown_channel_6bf8cc" ON "lockdown" ("channel_ids");
COMMENT ON COLUMN "lockdown"."type" IS 'channel: channel\nguild: guild\ncategory: category\nmaintenance: maintenance';
CREATE TABLE IF NOT EXISTS "tm.media_partners" (
    "channel_id" BIGINT NOT NULL  PRIMARY KEY,
    "tourney_id" INT NOT NULL
);
CREATE TABLE IF NOT EXISTS "tm.media_partner_users" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "jump_url" VARCHAR(300),
    "members" BIGINT[] NOT NULL
);
CREATE TABLE IF NOT EXISTS "premium_plans" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(250),
    "price" INT NOT NULL,
    "duration" BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS "premium_txns" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "txnid" VARCHAR(100) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "guild_id" BIGINT NOT NULL,
    "plan_id" INT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "raw_data" JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS "alert_prompts" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "prompted_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "alert_reads" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "read_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "sm.reserved_slots" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "num" INT,
    "user_id" BIGINT,
    "team_name" TEXT,
    "members" BIGINT[] NOT NULL,
    "expires" TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS "ss_data" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "author_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "dhash" VARCHAR(1024),
    "phash" VARCHAR(1024),
    "submitted_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "ss_info" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "channel_id" BIGINT NOT NULL,
    "guild_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "required_ss" INT NOT NULL  DEFAULT 4,
    "channel_name" VARCHAR(50) NOT NULL,
    "channel_link" VARCHAR(150) NOT NULL  DEFAULT '',
    "keywords" VARCHAR(50)[] NOT NULL,
    "allow_same" BOOL NOT NULL  DEFAULT False,
    "ss_type" VARCHAR(9) NOT NULL,
    "success_message" VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS "idx_ss_info_channel_68d108" ON "ss_info" ("channel_id");
COMMENT ON COLUMN "ss_info"."ss_type" IS 'yt: youtube\ninsta: instagram\nrooter: rooter\nloco: loco\nanyss: Any SS\ncustom: custom';
CREATE TABLE IF NOT EXISTS "sm.scrims" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "registration_channel_id" BIGINT NOT NULL,
    "slotlist_channel_id" BIGINT NOT NULL,
    "slotlist_message_id" BIGINT,
    "role_id" BIGINT,
    "required_mentions" INT NOT NULL  DEFAULT 4,
    "start_from" INT NOT NULL  DEFAULT 1,
    "available_slots" INT[] NOT NULL,
    "total_slots" INT NOT NULL,
    "host_id" BIGINT NOT NULL,
    "open_time" TIMESTAMPTZ NOT NULL,
    "opened_at" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,
    "autoclean" VARCHAR(7)[] NOT NULL,
    "autoclean_done" BOOL NOT NULL  DEFAULT False,
    "autoclean_time" TIMESTAMPTZ,
    "autoslotlist" BOOL NOT NULL  DEFAULT True,
    "ping_role_id" BIGINT,
    "multiregister" BOOL NOT NULL  DEFAULT False,
    "stoggle" BOOL NOT NULL  DEFAULT True,
    "open_role_id" BIGINT,
    "autodelete_rejects" BOOL NOT NULL  DEFAULT False,
    "autodelete_extras" BOOL NOT NULL  DEFAULT True,
    "teamname_compulsion" BOOL NOT NULL  DEFAULT False,
    "time_elapsed" VARCHAR(100),
    "show_time_elapsed" BOOL NOT NULL  DEFAULT True,
    "open_days" VARCHAR(9)[] NOT NULL,
    "slotlist_format" JSONB NOT NULL,
    "no_duplicate_name" BOOL NOT NULL  DEFAULT False,
    "open_message" JSONB NOT NULL,
    "close_message" JSONB NOT NULL,
    "banlog_channel_id" BIGINT,
    "match_time" TIMESTAMPTZ,
    "emojis" JSONB NOT NULL,
    "cdn" JSONB NOT NULL,
    "required_lines" SMALLINT NOT NULL  DEFAULT 0,
    "allow_duplicate_tags" BOOL NOT NULL  DEFAULT True
);
CREATE INDEX IF NOT EXISTS "idx_sm.scrims_registr_83e2b4" ON "sm.scrims" ("registration_channel_id");
CREATE TABLE IF NOT EXISTS "slot_manager" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "main_channel_id" BIGINT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "toggle" BOOL NOT NULL  DEFAULT True,
    "allow_reminders" BOOL NOT NULL  DEFAULT True,
    "multiple_slots" BOOL NOT NULL  DEFAULT False,
    "scrim_ids" BIGINT[] NOT NULL
);
CREATE TABLE IF NOT EXISTS "scrims_slot_reminders" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "snipes" (
    "channel_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "author_id" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "delete_time" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "nsfw" BOOL NOT NULL  DEFAULT False
);
CREATE TABLE IF NOT EXISTS "tourney_groups" (
    "message_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "tourney_id" INT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "group_number" SMALLINT NOT NULL,
    "refresh_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "tm.register" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "num" INT NOT NULL,
    "team_name" TEXT NOT NULL,
    "leader_id" BIGINT NOT NULL,
    "message_id" BIGINT,
    "members" BIGINT[] NOT NULL,
    "confirm_jump_url" VARCHAR(300),
    "jump_url" TEXT
);
CREATE TABLE IF NOT EXISTS "tags" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "is_embed" BOOL NOT NULL  DEFAULT False,
    "is_nsfw" BOOL NOT NULL  DEFAULT False,
    "owner_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "usage" INT NOT NULL  DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "tagcheck" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "required_mentions" INT NOT NULL  DEFAULT 0,
    "delete_after" BOOL NOT NULL  DEFAULT False
);
CREATE TABLE IF NOT EXISTS "timer" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "expires" TIMESTAMPTZ NOT NULL,
    "created" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "event" TEXT NOT NULL,
    "extra" JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_timer_expires_ad551b" ON "timer" ("expires");
CREATE TABLE IF NOT EXISTS "tm.tourney" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "name" VARCHAR(30) NOT NULL  DEFAULT 'Argon-Tourney',
    "registration_channel_id" BIGINT NOT NULL,
    "confirm_channel_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "required_mentions" SMALLINT NOT NULL  DEFAULT 4,
    "total_slots" SMALLINT NOT NULL,
    "banned_users" BIGINT[] NOT NULL,
    "host_id" BIGINT NOT NULL,
    "multiregister" BOOL NOT NULL  DEFAULT False,
    "started_at" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,
    "open_role_id" BIGINT,
    "teamname_compulsion" BOOL NOT NULL  DEFAULT False,
    "ping_role_id" BIGINT,
    "no_duplicate_name" BOOL NOT NULL  DEFAULT True,
    "autodelete_rejected" BOOL NOT NULL  DEFAULT False,
    "slotlist_start" SMALLINT NOT NULL  DEFAULT 2,
    "group_size" SMALLINT,
    "success_message" VARCHAR(500),
    "emojis" JSONB NOT NULL,
    "slotm_channel_id" BIGINT,
    "slotm_message_id" BIGINT,
    "required_lines" SMALLINT NOT NULL  DEFAULT 0,
    "allow_duplicate_tags" BOOL NOT NULL  DEFAULT True
);
CREATE INDEX IF NOT EXISTS "idx_tm.tourney_registr_beafa1" ON "tm.tourney" ("registration_channel_id");
CREATE TABLE IF NOT EXISTS "user_data" (
    "user_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "is_premium" BOOL NOT NULL  DEFAULT False,
    "premium_expire_time" TIMESTAMPTZ,
    "made_premium" BIGINT[] NOT NULL,
    "premiums" INT NOT NULL  DEFAULT 0,
    "premium_notified" BOOL NOT NULL  DEFAULT False,
    "public_profile" BOOL NOT NULL  DEFAULT True,
    "money" INT NOT NULL  DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "idx_user_data_is_prem_fcd413" ON "user_data" ("is_premium");
CREATE TABLE IF NOT EXISTS "votes" (
    "user_id" BIGSERIAL NOT NULL PRIMARY KEY,
    "is_voter" BOOL NOT NULL  DEFAULT False,
    "expire_time" TIMESTAMPTZ,
    "reminder" BOOL NOT NULL  DEFAULT False,
    "notified" BOOL NOT NULL  DEFAULT False,
    "public_profile" BOOL NOT NULL  DEFAULT True,
    "total_votes" INT NOT NULL  DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "idx_votes_is_vote_ac3281" ON "votes" ("is_voter");
CREATE INDEX IF NOT EXISTS "idx_votes_notifie_5a2e62" ON "votes" ("notified");
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS "alerts_alert_prompts" (
    "alerts_id" INT NOT NULL REFERENCES "alerts" ("id") ON DELETE CASCADE,
    "prompt_id" INT NOT NULL REFERENCES "alert_prompts" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "alerts_alert_reads" (
    "alerts_id" INT NOT NULL REFERENCES "alerts" ("id") ON DELETE CASCADE,
    "read_id" INT NOT NULL REFERENCES "alert_reads" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "tm.media_partners_tm.media_partner_users" (
    "tm.media_partners_id" BIGINT NOT NULL REFERENCES "tm.media_partners" ("channel_id") ON DELETE CASCADE,
    "partnerslot_id" INT NOT NULL REFERENCES "tm.media_partner_users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "ss_info_ss_data" (
    "ss_info_id" INT NOT NULL REFERENCES "ss_info" ("id") ON DELETE CASCADE,
    "ssdata_id" INT NOT NULL REFERENCES "ss_data" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "sm.scrims_sm.reserved_slots" (
    "sm.scrims_id" BIGINT NOT NULL REFERENCES "sm.scrims" ("id") ON DELETE CASCADE,
    "reservedslot_id" INT NOT NULL REFERENCES "sm.reserved_slots" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "sm.scrims_scrims_slot_reminders" (
    "sm.scrims_id" BIGINT NOT NULL REFERENCES "sm.scrims" ("id") ON DELETE CASCADE,
    "scrimsslotreminder_id" INT NOT NULL REFERENCES "scrims_slot_reminders" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "sm.scrims_sm.banned_teams" (
    "sm.scrims_id" BIGINT NOT NULL REFERENCES "sm.scrims" ("id") ON DELETE CASCADE,
    "bannedteam_id" INT NOT NULL REFERENCES "sm.banned_teams" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "sm.scrims_sm.assigned_slots" (
    "sm.scrims_id" BIGINT NOT NULL REFERENCES "sm.scrims" ("id") ON DELETE CASCADE,
    "assignedslot_id" INT NOT NULL REFERENCES "sm.assigned_slots" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "tm.tourney_tm.media_partners" (
    "tm.tourney_id" BIGINT NOT NULL REFERENCES "tm.tourney" ("id") ON DELETE CASCADE,
    "mediapartner_id" BIGINT NOT NULL REFERENCES "tm.media_partners" ("channel_id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "tm.tourney_tm.register" (
    "tm.tourney_id" BIGINT NOT NULL REFERENCES "tm.tourney" ("id") ON DELETE CASCADE,
    "tmslot_id" BIGINT NOT NULL REFERENCES "tm.register" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "ticket_configs" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL,
    "message_id" BIGINT,
    "category_id" BIGINT,
    "log_channel_id" BIGINT,
    "support_role_id" BIGINT,
    "title" VARCHAR(256) NOT NULL DEFAULT 'Support Ticket',
    "description" TEXT NOT NULL DEFAULT 'Click the button below to open a support ticket.',
    "button_label" VARCHAR(80) NOT NULL DEFAULT 'Open Ticket',
    "button_emoji" VARCHAR(50) DEFAULT '🎫',
    "max_tickets" SMALLINT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS "idx_ticket_configs_guild" ON "ticket_configs" ("guild_id");
CREATE TABLE IF NOT EXISTS "tickets" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "guild_id" BIGINT NOT NULL,
    "channel_id" BIGINT NOT NULL UNIQUE,
    "opener_id" BIGINT NOT NULL,
    "config_id" INT NOT NULL REFERENCES "ticket_configs" ("id") ON DELETE CASCADE,
    "opened_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ,
    "closed_by" BIGINT,
    "reason" TEXT
);
CREATE INDEX IF NOT EXISTS "idx_tickets_guild" ON "tickets" ("guild_id");
CREATE TABLE IF NOT EXISTS "welcome_configs" (
    "guild_id" BIGINT NOT NULL PRIMARY KEY,
    "channel_id" BIGINT,
    "message" TEXT NOT NULL DEFAULT 'Welcome {user} to **{server}**! You are member #{member_count}.',
    "enabled" BOOL NOT NULL DEFAULT FALSE,
    "embed_enabled" BOOL NOT NULL DEFAULT FALSE,
    "embed_color" INT DEFAULT 65459,
    "embed_title" TEXT DEFAULT 'Welcome!'
);
