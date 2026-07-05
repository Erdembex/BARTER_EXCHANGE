CREATE TABLE users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type     VARCHAR(50)  NOT NULL,
    status        VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ,
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX users_email_idx ON users (email);

CREATE TABLE business_profiles (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL UNIQUE REFERENCES users (id),
    business_name VARCHAR(255) NOT NULL,
    category      VARCHAR(50),
    city          VARCHAR(255),
    district      VARCHAR(255),
    phone         VARCHAR(50),
    logo_url      VARCHAR(512),
    bio           TEXT,
    verified      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ
);

CREATE TABLE individual_profiles (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL UNIQUE REFERENCES users (id),
    full_name  VARCHAR(255) NOT NULL,
    city       VARCHAR(255),
    district   VARCHAR(255),
    avatar_url VARCHAR(512),
    bio        TEXT,
    created_at TIMESTAMPTZ
);

CREATE TABLE individual_skills (
    id            UUID PRIMARY KEY,
    individual_id UUID NOT NULL REFERENCES individual_profiles (id),
    skill         VARCHAR(50) NOT NULL,
    UNIQUE (individual_id, skill)
);
