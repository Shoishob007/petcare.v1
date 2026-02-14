from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from app.core.config import get_database_url, settings

DATABASE_URL = get_database_url()

# Configure engine based on database type
if settings.DB_ENGINE == "sqlite":
    # Use StaticPool for SQLite to handle threading issues
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL and MySQL use default pooling
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        echo=False,
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    """Database session dependency for FastAPI routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_sqlite_reports_schema() -> None:
    """Ensure SQLite reports table has all expected columns."""
    if settings.DB_ENGINE != "sqlite":
        return

    inspector = inspect(engine)
    if "reports" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("reports")}
    columns_to_add = {
        "latitude": "FLOAT",
        "longitude": "FLOAT",
        "breed": "VARCHAR",
        "reporter_email": "VARCHAR",
        "reporter_phone": "VARCHAR",
        "comment_count": "INTEGER",
        "view_count": "INTEGER",
        "pet_name": "VARCHAR",
        "pet_age": "VARCHAR",
        "pet_color": "VARCHAR",
        "pet_microchip": "VARCHAR",
        "is_verified": "BOOLEAN",
        "is_resolved": "BOOLEAN",
        "resolved_at": "DATETIME",
        "updated_at": "DATETIME",
    }

    with engine.begin() as conn:
        for column_name, column_type in columns_to_add.items():
            if column_name not in existing_columns:
                conn.execute(
                    text(f"ALTER TABLE reports ADD COLUMN {column_name} {column_type}")
                )


def ensure_sqlite_community_posts_schema() -> None:
    """Ensure SQLite community_posts table has all expected columns."""
    if settings.DB_ENGINE != "sqlite":
        return

    inspector = inspect(engine)
    if "community_posts" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("community_posts")}
    columns_to_add = {
        "author_id": "VARCHAR",
        "author_name": "VARCHAR",
        "author_avatar": "VARCHAR",
        "comment_count": "INTEGER",
        "share_count": "INTEGER",
        "view_count": "INTEGER",
        "is_pinned": "BOOLEAN",
        "is_verified": "BOOLEAN",
        "status": "VARCHAR",
        "tags": "VARCHAR",
        "location": "VARCHAR",
        "image_url": "VARCHAR",
        "featured": "BOOLEAN",
        "featured_at": "DATETIME",
        "updated_at": "DATETIME",
    }

    with engine.begin() as conn:
        for column_name, column_type in columns_to_add.items():
            if column_name not in existing_columns:
                conn.execute(
                    text(f"ALTER TABLE community_posts ADD COLUMN {column_name} {column_type}")
                )


def ensure_sqlite_sicknesses_schema() -> None:
    """Ensure SQLite sicknesses table has all expected columns."""
    if settings.DB_ENGINE != "sqlite":
        return

    inspector = inspect(engine)
    if "sicknesses" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("sicknesses")}
    columns_to_add = {
        "description": "TEXT",
        "prevention": "TEXT",
        "category": "VARCHAR",
        "contagious": "BOOLEAN",
        "causes": "TEXT",
        "incubation_period": "VARCHAR",
        "transmission_methods": "TEXT",
        "affected_age_group": "VARCHAR",
        "typical_treatment_duration": "VARCHAR",
        "requires_veterinary_care": "BOOLEAN",
        "prognosis": "TEXT",
        "view_count": "INTEGER",
        "helpful_count": "INTEGER",
        "comment_count": "INTEGER",
        "reported_by_id": "VARCHAR",
        "is_verified": "BOOLEAN",
        "verified_by": "VARCHAR",
        "updated_at": "DATETIME",
    }

    with engine.begin() as conn:
        for column_name, column_type in columns_to_add.items():
            if column_name not in existing_columns:
                conn.execute(
                    text(f"ALTER TABLE sicknesses ADD COLUMN {column_name} {column_type}")
                )


def ensure_sqlite_users_schema() -> None:
    if settings.DB_ENGINE != "sqlite":
        return

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" not in existing_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'"))


def ensure_sqlite_comments_schema() -> None:
    if settings.DB_ENGINE != "sqlite":
        return

    inspector = inspect(engine)
    table_columns = {
        "report_comments": "user_id",
        "community_post_comments": "user_id",
    }

    with engine.begin() as conn:
        for table_name, column_name in table_columns.items():
            if table_name not in inspector.get_table_names():
                continue
            existing_columns = {
                column["name"] for column in inspector.get_columns(table_name)
            }
            if column_name not in existing_columns:
                conn.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} VARCHAR")
                )
