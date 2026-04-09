---
name: database-design
description: Database schema design and optimization
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: database
---
## What I do
- Design normalized database schemas
- Choose appropriate data types
- Implement proper constraints
- Create effective indexes
- Handle many-to-many relationships
- Design for scalability
- Implement soft deletes and auditing
- Handle temporal data

## When to use me
When designing database schemas or optimizing queries.

## Schema Design Principles
```sql
-- Normal Form Examples

-- 1NF: Atomic values, no repeating groups
-- BAD: tags VARCHAR stored as "tag1,tag2,tag3"
-- GOOD: Separate tags table

-- 2NF: No partial dependencies (no composite key dependencies)
-- BAD: Orders table with customer_name (depends on customer_id, not order_id)
-- GOOD: Separate customers table

-- 3NF: No transitive dependencies
-- BAD: users table with department_name (depends on department_id)
-- GOOD: Separate departments table
```

## Schema Design
```sql
-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    avatar_url VARCHAR(500),
    bio TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_uq UNIQUE (email),
    CONSTRAINT users_username_uq UNIQUE (username),
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'moderator', 'user', 'guest'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = TRUE;

-- Posts with soft delete
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT posts_status_check CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT posts_slug_uq UNIQUE (author_id, slug),
    CONSTRAINT posts_deleted_at_nz CHECK (deleted_at IS NULL OR deleted_at > created_at)
);

CREATE INDEX idx_posts_author ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_status ON posts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published ON posts(published_at) WHERE deleted_at IS NULL AND status = 'published';

-- Many-to-many: Posts and Tags
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT tags_name_uq UNIQUE (name),
    CONSTRAINT tags_slug_uq UNIQUE (slug)
);

CREATE TABLE post_tags (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (post_id, tag_id)
);

-- Polymorphic relationships (e.g., comments on posts and users)
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Polymorphic reference
    commentable_type VARCHAR(50) NOT NULL,
    commentable_id BIGINT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT comments_commentable_check CHECK (
        (commentable_type = 'post' AND EXISTS (SELECT 1 FROM posts WHERE id = commentable_id)) OR
        (commentable_type = 'user' AND EXISTS (SELECT 1 FROM users WHERE id = commentable_id))
    )
);

CREATE INDEX idx_comments_polymorphic ON comments(commentable_type, commentable_id);
```

## Audit Trail
```sql
-- Audit logging table
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT audit_logs_action_check CHECK (
        action IN ('create', 'update', 'delete', 'view', 'login', 'logout')
    )
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Function to automatically log changes
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    )
    VALUES (
        current_setting('app.current_user_id', TRUE)::BIGINT,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(OLD.id, NEW.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to a table
CREATE TRIGGER audit_posts
AFTER INSERT OR UPDATE OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

## Data Types
```sql
-- UUID for public identifiers
-- Use for APIs, external references
-- Internally use BIGSERIAL for performance

-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- Always use TIMESTAMPTZ (with timezone), never DATE or TIME alone

-- JSONB for flexible data
metadata JSONB DEFAULT '{}'::jsonb
-- For semi-structured data, configuration, settings

-- Arrays for simple lists
tags TEXT[] DEFAULT '{}'
-- For simple, non-relational lists

-- ENUM or check constraints for status
status VARCHAR(20) NOT NULL DEFAULT 'draft'
CHECK (status IN ('draft', 'published', 'archived'))

-- Use appropriate numeric types
balance DECIMAL(20, 8)  -- For precise monetary values
price DECIMAL(10, 2)    -- For prices
quantity INTEGER         -- For counts
ratio DOUBLE PRECISION   -- For ratios, no precision needed

-- Use INET for IP addresses
ip_address INET NOT NULL
-- Supports proper comparison and CIDR matching
```

## Performance Patterns
```sql
-- Partitioning for large tables
CREATE TABLE events (
    id BIGSERIAL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Materialized views for complex queries
CREATE MATERIALIZED VIEW user_stats AS
SELECT
    author_id,
    COUNT(*) as post_count,
    MIN(created_at) as first_post,
    MAX(created_at) as last_post
FROM posts
WHERE deleted_at IS NULL
GROUP BY author_id;

-- Refresh on change
CREATE UNIQUE INDEX idx_user_stats ON user_stats(author_id);
```

## Migrations
```python
# Alembic migration example
from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        'posts',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author_id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('author_id', 'slug')
    )

    op.create_index('idx_posts_author', 'posts', ['author_id'])
    op.create_index('idx_posts_status', 'posts', ['status'])


def downgrade():
    op.drop_index('idx_posts_status')
    op.drop_index('idx_posts_author')
    op.drop_table('posts')
```
