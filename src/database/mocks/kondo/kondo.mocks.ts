import { CreateKondoDto } from '../../../kondo/dto/create-kondo.dto';
import { CreateKondoWithRelationsDto } from '../../../kondo/dto/create-kondo-with-relations.dto';
import { KondoTypes, KondoStatus } from '../../../kondo/entities/kondo.entity';

export const mockKondoData: CreateKondoDto = {
    // Basic Information
    name: "Condomínio Vila Verde Premium",
    slug: "vila-verde-premium",
    email: "contato@vilaverdepremium.com.br",
    active: true,
    status: KondoStatus.DONE,
    highlight: true,
    featured_image: "https://example.com/images/vila-verde-featured.jpg",
    type: KondoTypes.Casas,
    description: "Um condomínio premium localizado em uma das áreas mais valorizadas da região metropolitana de Belo Horizonte. Com infraestrutura completa e acabamento de primeira qualidade, oferece o melhor em qualidade de vida para sua família. Localizado em área nobre com fácil acesso às principais vias da cidade.",

    // Address Information
    minutes_from_bh: "25 minutos do centro de BH",
    cep: "34000-000",
    address_street_and_numbers: "Rua das Palmeiras, 1500 - Lote 45",
    neighborhood: "Jardim Botânico",
    city: "Nova Lima",

    // Financial Details
    lot_avg_price: 850000.00,
    condo_rent: 450.00,
    lots_available: true,
    lots_min_size: "600 m²",
    finance: true,
    finance_tranches: "Até 120 parcelas",
    finance_fees: false,
    entry_value_percentage: "20%",
    total_area: "125 hectares",
    immediate_delivery: true,

    // Infrastructure Description
    infra_description: "Infraestrutura completa com clube, áreas de lazer, segurança 24h, e toda a comodidade que sua família merece. Projeto paisagístico assinado por renomado arquiteto, com preservação da mata nativa e integração com a natureza.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: true,
    infra_security_team: true,
    infra_wall: true,

    // Convenience Infrastructure
    infra_sports_court: true,
    infra_barbecue_zone: true,
    infra_pool: true,
    infra_living_space: true,
    infra_pet_area: true,
    infra_kids_area: true,
    infra_grass_area: true,
    infra_gourmet_area: true,
    infra_parking_lot: true,
    infra_market_nearby: false,
    infra_party_saloon: true,
    infra_lounge_bar: true,
    infra_home_office: true,

    // Extra Infrastructure
    infra_lagoon: true,
    infra_generates_power: true,
    infra_woods: true,
    infra_vegetable_garden: true,
    infra_nature_trail: true,
    infra_gardens: true,
    infra_heliport: false,
    infra_gym: true,
    infra_interactive_lobby: true,

    // Contact Information
    url: "https://vilaverdepremium.com.br",
    phone: "(31) 99999-8888",
    video: "https://youtube.com/watch?v=exemplo-vila-verde"
};

// Alternative mock data for different types
export const mockKondoBairroData: CreateKondoDto = {
    name: "Residencial Bairro Planejado Horizonte",
    slug: "bairro-horizonte",
    email: "vendas@bairroorizonte.com.br",
    active: true,
    status: KondoStatus.TEXT_READY,
    highlight: false,
    featured_image: "https://example.com/images/bairro-horizonte.jpg",
    type: KondoTypes.Bairro,
    description: "Bairro planejado com conceito sustentável e moderna infraestrutura urbana. Um novo jeito de viver com comodidade, segurança e qualidade de vida.",

    // Address Information
    minutes_from_bh: "35 minutos do centro de BH",
    cep: "34100-000",
    address_street_and_numbers: "Rodovia MG-010, Km 15",
    neighborhood: "Região Metropolitana",
    city: "Ribeirão das Neves",

    // Financial Details
    lot_avg_price: 180000.00,
    condo_rent: 0.00, // Bairro planejado geralmente não tem taxa condominial
    lots_available: true,
    lots_min_size: "250 m²",
    finance: true,
    finance_tranches: "Até 180 parcelas",
    finance_fees: true,
    entry_value_percentage: "0%", // Entrada facilitada
    total_area: "500 hectares",
    immediate_delivery: false,

    // Infrastructure Description
    infra_description: "Bairro planejado com conceito de cidade inteligente, incluindo infraestrutura completa de saneamento, energia solar comunitária, e áreas verdes preservadas.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: false, // Bairro aberto
    infra_security_team: true,
    infra_wall: false,

    // Convenience Infrastructure
    infra_sports_court: true,
    infra_barbecue_zone: false,
    infra_pool: false,
    infra_living_space: true,
    infra_pet_area: true,
    infra_kids_area: true,
    infra_grass_area: true,
    infra_gourmet_area: false,
    infra_parking_lot: false, // Cada lote tem seu estacionamento
    infra_market_nearby: true,
    infra_party_saloon: false,
    infra_lounge_bar: false,
    infra_home_office: false,

    // Extra Infrastructure
    infra_lagoon: false,
    infra_generates_power: true,
    infra_woods: true,
    infra_vegetable_garden: true,
    infra_nature_trail: true,
    infra_gardens: true,
    infra_heliport: false,
    infra_gym: false,
    infra_interactive_lobby: false,

    // Contact Information
    url: "https://bairroorizonte.com.br",
    phone: "(31) 98765-4321",
    video: "https://youtube.com/watch?v=exemplo-bairro-horizonte"
};

// Mock data for commercial type
export const mockKondoComercialData: CreateKondoDto = {
    name: "Centro Empresarial Tech Park",
    slug: "tech-park-comercial",
    email: "comercial@techpark.com.br",
    active: true,
    status: KondoStatus.MEDIA_GATHERING,
    highlight: true,
    featured_image: "https://example.com/images/tech-park.jpg",
    type: KondoTypes.Comercial,
    description: "Centro empresarial moderno com salas comerciais e escritórios de alto padrão. Localização estratégica com fácil acesso e toda infraestrutura para o seu negócio prosperar.",

    // Address Information
    minutes_from_bh: "15 minutos do centro de BH",
    cep: "30000-000",
    address_street_and_numbers: "Avenida do Contorno, 7500",
    neighborhood: "Funcionários",
    city: "Belo Horizonte",

    // Financial Details
    lot_avg_price: 1200000.00,
    condo_rent: 800.00,
    lots_available: true,
    lots_min_size: "50 m²",
    finance: true,
    finance_tranches: "Até 100 parcelas",
    finance_fees: false,
    entry_value_percentage: "30%",
    total_area: "25 hectares",
    immediate_delivery: true,

    // Infrastructure Description
    infra_description: "Complexo empresarial com tecnologia de ponta, sistema de automação predial, heliponto executivo e toda comodidade para empresas modernas.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: true,
    infra_security_team: true,
    infra_wall: true,

    // Convenience Infrastructure
    infra_sports_court: false,
    infra_barbecue_zone: false,
    infra_pool: false,
    infra_living_space: true,
    infra_pet_area: false,
    infra_kids_area: false,
    infra_grass_area: true,
    infra_gourmet_area: true,
    infra_parking_lot: true,
    infra_market_nearby: true,
    infra_party_saloon: true,
    infra_lounge_bar: true,
    infra_home_office: true,

    // Extra Infrastructure
    infra_lagoon: false,
    infra_generates_power: true,
    infra_woods: false,
    infra_vegetable_garden: false,
    infra_nature_trail: false,
    infra_gardens: true,
    infra_heliport: true,
    infra_gym: true,
    infra_interactive_lobby: true,

    // Contact Information
    url: "https://techpark.com.br",
    phone: "(31) 91234-5678",
    video: "https://youtube.com/watch?v=exemplo-tech-park"
};

// Mock data with relations
export const mockKondoWithRelationsData: CreateKondoWithRelationsDto = {
    // Basic Information
    name: "Condomínio Vila Verde Premium",
    slug: "vila-verde-premium",
    email: "contato@vilaverdepremium.com.br",
    active: true,
    status: KondoStatus.DONE,
    highlight: true,
    featured_image: "https://example.com/images/vila-verde-featured.jpg",
    type: KondoTypes.Casas,
    description: "Um condomínio premium localizado em uma das áreas mais valorizadas da região metropolitana de Belo Horizonte. Com infraestrutura completa e acabamento de primeira qualidade, oferece o melhor em qualidade de vida para sua família.",

    // Address Information
    minutes_from_bh: "25 minutos do centro de BH",
    cep: "34000-000",
    address_street_and_numbers: "Rua das Palmeiras, 1500 - Lote 45",
    neighborhood: "Jardim Botânico",
    city: "Nova Lima",

    // Financial Details
    lot_avg_price: 850000.00,
    condo_rent: 450.00,
    lots_available: true,
    lots_min_size: "600 m²",
    finance: true,
    finance_tranches: "Até 120 parcelas",
    finance_fees: false,
    entry_value_percentage: "20%",
    total_area: "125 hectares",
    immediate_delivery: true,

    // Infrastructure Description
    infra_description: "Infraestrutura completa com clube, áreas de lazer, segurança 24h, e toda a comodidade que sua família merece.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: true,
    infra_security_team: true,
    infra_wall: true,

    // Convenience Infrastructure
    infra_sports_court: true,
    infra_barbecue_zone: true,
    infra_pool: true,
    infra_living_space: true,
    infra_pet_area: true,
    infra_kids_area: true,
    infra_grass_area: true,
    infra_gourmet_area: true,
    infra_parking_lot: true,
    infra_market_nearby: false,
    infra_party_saloon: true,
    infra_lounge_bar: true,
    infra_home_office: true,

    // Extra Infrastructure
    infra_lagoon: true,
    infra_generates_power: true,
    infra_woods: true,
    infra_vegetable_garden: true,
    infra_nature_trail: true,
    infra_gardens: true,
    infra_heliport: false,
    infra_gym: true,
    infra_interactive_lobby: true,

    // Contact Information
    url: "https://vilaverdepremium.com.br",
    phone: "(31) 99999-8888",
    video: "https://youtube.com/watch?v=exemplo-vila-verde",

    // Relations - Media
    medias: [
        {
            filename: "vila-verde-aerial.jpg",
            type: "image",
            active: true
        },
        {
            filename: "vila-verde-entrance.jpg",
            type: "image",
            active: true
        },
        {
            filename: "vila-verde-pool-area.jpg",
            type: "image",
            active: true
        },
        {
            filename: "vila-verde-sports-court.jpg",
            type: "image",
            active: true
        },
        {
            filename: "vila-verde-promotional-video.mp4",
            type: "video",
            active: true
        },
        {
            filename: "vila-verde-gourmet-area.jpg",
            type: "image",
            active: true
        },
        {
            filename: "vila-verde-playground.jpg",
            type: "image",
            active: true
        },
        {
            filename: "vila-verde-security-gate.jpg",
            type: "image",
            active: true
        }
    ]
};

// Additional Casa-type kondos with DONE status
export const mockKondoCasas2Data: CreateKondoDto = {
    name: "Condomínio Reserva do Vale",
    slug: "reserva-do-vale",
    email: "vendas@reservadovale.com.br",
    active: true,
    status: KondoStatus.DONE,
    highlight: true,
    featured_image: "https://example.com/images/reserva-vale-featured.jpg",
    type: KondoTypes.Casas,
    description: "Condomínio exclusivo no coração da mata atlântica, oferecendo lotes amplos com vista privilegiada para o vale. Perfeito para quem busca tranquilidade sem abrir mão da sofisticação.",

    // Address Information
    minutes_from_bh: "40 minutos do centro de BH",
    cep: "34200-000",
    address_street_and_numbers: "Estrada do Vale, Km 8",
    neighborhood: "Vale Verde",
    city: "Brumadinho",

    // Financial Details
    lot_avg_price: 650000.00,
    condo_rent: 380.00,
    lots_available: true,
    lots_min_size: "800 m²",
    finance: true,
    finance_tranches: "Até 100 parcelas",
    finance_fees: false,
    entry_value_percentage: "15%",
    total_area: "80 hectares",
    immediate_delivery: true,

    // Infrastructure Description
    infra_description: "Ambiente preservado com trilhas ecológicas, clube completo e segurança integrada com a natureza.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: true,
    infra_security_team: true,
    infra_wall: false, // Segurança integrada

    // Convenience Infrastructure
    infra_sports_court: true,
    infra_barbecue_zone: true,
    infra_pool: true,
    infra_living_space: true,
    infra_pet_area: true,
    infra_kids_area: true,
    infra_grass_area: true,
    infra_gourmet_area: true,
    infra_parking_lot: true,
    infra_market_nearby: false,
    infra_party_saloon: true,
    infra_lounge_bar: false,
    infra_home_office: true,

    // Extra Infrastructure
    infra_lagoon: false,
    infra_generates_power: true,
    infra_woods: true,
    infra_vegetable_garden: true,
    infra_nature_trail: true,
    infra_gardens: true,
    infra_heliport: false,
    infra_gym: true,
    infra_interactive_lobby: false,

    // Contact Information
    url: "https://reservadovale.com.br",
    phone: "(31) 94444-5555",
    video: "https://youtube.com/watch?v=reserva-vale-video"
};

export const mockKondoCasas3Data: CreateKondoDto = {
    name: "Condomínio Sunset Hills",
    slug: "sunset-hills",
    email: "contato@sunsethills.com.br",
    active: true,
    status: KondoStatus.DONE,
    highlight: false,
    featured_image: "https://example.com/images/sunset-hills-featured.jpg",
    type: KondoTypes.Casas,
    description: "Condomínio de alto padrão com vista panorâmica da serra, oferecendo o melhor do luxo residencial em harmonia com a natureza exuberante da região.",

    // Address Information
    minutes_from_bh: "50 minutos do centro de BH",
    cep: "34300-000",
    address_street_and_numbers: "Rodovia dos Inconfidentes, Km 12",
    neighborhood: "Serra da Piedade",
    city: "Caeté",

    // Financial Details
    lot_avg_price: 750000.00,
    condo_rent: 520.00,
    lots_available: true,
    lots_min_size: "1000 m²",
    finance: true,
    finance_tranches: "Até 144 parcelas",
    finance_fees: true,
    entry_value_percentage: "25%",
    total_area: "200 hectares",
    immediate_delivery: false,

    // Infrastructure Description
    infra_description: "Vista privilegiada da serra, clube de campo completo, campo de golfe e infraestrutura premium para toda família.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: true,
    infra_security_team: true,
    infra_wall: true,

    // Convenience Infrastructure
    infra_sports_court: true,
    infra_barbecue_zone: true,
    infra_pool: true,
    infra_living_space: true,
    infra_pet_area: true,
    infra_kids_area: true,
    infra_grass_area: true,
    infra_gourmet_area: true,
    infra_parking_lot: true,
    infra_market_nearby: false,
    infra_party_saloon: true,
    infra_lounge_bar: true,
    infra_home_office: true,

    // Extra Infrastructure
    infra_lagoon: true,
    infra_generates_power: false,
    infra_woods: true,
    infra_vegetable_garden: false,
    infra_nature_trail: true,
    infra_gardens: true,
    infra_heliport: true,
    infra_gym: true,
    infra_interactive_lobby: true,

    // Contact Information
    url: "https://sunsethills.com.br",
    phone: "(31) 93333-4444",
    video: "https://youtube.com/watch?v=sunset-hills-tour"
};

export const mockKondoCasas4Data: CreateKondoDto = {
    name: "Residencial Pedra Azul",
    slug: "pedra-azul-residencial",
    email: "vendas@pedraazul.com.br",
    active: true,
    status: KondoStatus.DONE,
    highlight: true,
    featured_image: "https://example.com/images/pedra-azul-featured.jpg",
    type: KondoTypes.Casas,
    description: "Condomínio familiar com conceito sustentável, localizado em área nobre com fácil acesso às principais vias. Ideal para famílias que buscam qualidade de vida e segurança.",

    // Address Information
    minutes_from_bh: "30 minutos do centro de BH",
    cep: "34400-000",
    address_street_and_numbers: "Avenida das Amendoeiras, 2500",
    neighborhood: "Alphaville",
    city: "Nova Lima",

    // Financial Details
    lot_avg_price: 580000.00,
    condo_rent: 320.00,
    lots_available: true,
    lots_min_size: "450 m²",
    finance: true,
    finance_tranches: "Até 120 parcelas",
    finance_fees: false,
    entry_value_percentage: "10%",
    total_area: "60 hectares",
    immediate_delivery: true,

    // Infrastructure Description
    infra_description: "Condomínio sustentável com energia solar, sistema de captação de água da chuva e amplas áreas verdes preservadas.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: true,
    infra_security_team: true,
    infra_wall: true,

    // Convenience Infrastructure
    infra_sports_court: true,
    infra_barbecue_zone: true,
    infra_pool: true,
    infra_living_space: true,
    infra_pet_area: true,
    infra_kids_area: true,
    infra_grass_area: true,
    infra_gourmet_area: true,
    infra_parking_lot: true,
    infra_market_nearby: true,
    infra_party_saloon: true,
    infra_lounge_bar: false,
    infra_home_office: true,

    // Extra Infrastructure
    infra_lagoon: false,
    infra_generates_power: true,
    infra_woods: false,
    infra_vegetable_garden: true,
    infra_nature_trail: false,
    infra_gardens: true,
    infra_heliport: false,
    infra_gym: true,
    infra_interactive_lobby: true,

    // Contact Information
    url: "https://pedraazul.com.br",
    phone: "(31) 92222-3333",
    video: "https://youtube.com/watch?v=pedra-azul-video"
};

export const mockKondoCasas5Data: CreateKondoDto = {
    name: "Condomínio Portal das Águas",
    slug: "portal-das-aguas",
    email: "contato@portalaguas.com.br",
    active: true,
    status: KondoStatus.DONE,
    highlight: false,
    featured_image: "https://example.com/images/portal-aguas-featured.jpg",
    type: KondoTypes.Casas,
    description: "Condomínio às margens de uma represa cristalina, oferecendo atividades aquáticas e um estilo de vida único em contato com a natureza.",

    // Address Information
    minutes_from_bh: "45 minutos do centro de BH",
    cep: "34500-000",
    address_street_and_numbers: "Estrada da Represa, 1800",
    neighborhood: "Águas Claras",
    city: "Rio Acima",

    // Financial Details
    lot_avg_price: 420000.00,
    condo_rent: 280.00,
    lots_available: true,
    lots_min_size: "500 m²",
    finance: true,
    finance_tranches: "Até 180 parcelas",
    finance_fees: true,
    entry_value_percentage: "5%",
    total_area: "150 hectares",
    immediate_delivery: false,

    // Infrastructure Description
    infra_description: "Localizado às margens da represa com marina privativa, clube náutico e trilhas aquáticas para toda família.",

    // Basic Infrastructure
    infra_eletricity: true,
    infra_water: true,
    infra_sidewalks: true,
    infra_internet: true,

    // Security Infrastructure
    infra_lobby_24h: true,
    infra_security_team: true,
    infra_wall: false,

    // Convenience Infrastructure
    infra_sports_court: true,
    infra_barbecue_zone: true,
    infra_pool: false, // Tem a represa
    infra_living_space: true,
    infra_pet_area: true,
    infra_kids_area: true,
    infra_grass_area: true,
    infra_gourmet_area: true,
    infra_parking_lot: true,
    infra_market_nearby: false,
    infra_party_saloon: true,
    infra_lounge_bar: true,
    infra_home_office: false,

    // Extra Infrastructure
    infra_lagoon: true, // A represa
    infra_generates_power: false,
    infra_woods: true,
    infra_vegetable_garden: false,
    infra_nature_trail: true,
    infra_gardens: true,
    infra_heliport: false,
    infra_gym: false,
    infra_interactive_lobby: false,

    // Contact Information
    url: "https://portalaguas.com.br",
    phone: "(31) 91111-2222",
    video: "https://youtube.com/watch?v=portal-aguas-drone"
};