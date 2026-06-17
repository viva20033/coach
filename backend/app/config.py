from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_http_proxy: str = ""  # e.g. http://host:3128 or socks5://host:1080
    database_url: str = "sqlite:///./izo_coach.db"
    secret_key: str = "change-me"
    cors_origins: str = "http://localhost:5173"
    dev_mode: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
