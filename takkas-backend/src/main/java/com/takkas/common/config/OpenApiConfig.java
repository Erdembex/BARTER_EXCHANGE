package com.takkas.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Takkas API")
                .version("1.0.0")
                .description("""
                    **Takkas** — Hizmet karşılığı ayrıcalık platformu REST API'si.

                    ### Kimlik Doğrulama
                    Korunan endpoint'ler için `POST /api/auth/login` ile token alıp \
                    **Authorize** butonuna `Bearer <accessToken>` formatında girin.

                    ### Roller
                    - **BUSINESS** — `/api/business/**` endpoint'leri
                    - **INDIVIDUAL** — `/api/individual/**` endpoint'leri
                    - **AUTH** — Herhangi geçerli JWT token
                    """)
                .contact(new Contact().name("Takkas Team")))
            .servers(List.of(
                new Server().url(baseUrl).description("Geliştirme Sunucusu")
            ))
            .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
            .components(new Components()
                .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                    .name(BEARER_SCHEME)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT access token. `/api/auth/login` ile alın.")))
            .tags(List.of(
                new Tag().name("Auth").description("Kayıt, giriş, token yenileme"),
                new Tag().name("Kullanıcı Profil").description("İşletme ve bireysel profil yönetimi"),
                new Tag().name("İlanlar").description("İlan oluşturma, yayınlama, keşfetme"),
                new Tag().name("Başvurular").description("Başvuru akışı — gönder, kabul et, reddet"),
                new Tag().name("Kuponlar").description("Kupon görüntüleme, QR kodu, doğrulama"),
                new Tag().name("Mesajlaşma").description("Sohbetler, mesajlar ve teklifler"),
                new Tag().name("Kupon Takası").description("Swap marketplace — ilan ve teklif yönetimi"),
                new Tag().name("Abonelik").description("Planlar, Stripe ödeme, fatura yönetimi"),
                new Tag().name("Bildirimler").description("Uygulama içi bildirimler ve FCM token")
            ));
    }
}
