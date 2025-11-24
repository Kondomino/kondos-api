


export interface KondoDetailsType {

    lot_avg_price: string;

    condo_rent: string;

    lots_available: boolean;

    lots_min_size: string;

    finance: boolean; // Financiamento?

    finance_tranches: string; // Financiamento parcelas

    finance_fees: boolean; // Parcelamento com juros? 

    entry_value_percentage: string; // Valor inicial de entrada minimo?

    infra_description: string; // Descrição da Infraestrutura

    infra_lobby_24h: boolean; // Portaria 24h

    infra_security_team: boolean; // Equipe de segurança?

    infra_wall: boolean; // Muro de segurança?

    infra_sports_court: boolean; // Quadra de esportes

    infra_barbecue_zone: boolean; // Churrasqueira

    infra_pool: boolean;

    infra_living_space: boolean; // Espaço de Convivencia

    infra_pet_area: boolean; // Espaço Pet

    infra_kids_area: boolean; // Espaço Kids

    infra_lagoon: boolean; // Lagoa

    infra_eletricity: boolean;

    infra_water: boolean;

    infra_sidewalks: boolean; // Calçadas

    infra_internet: boolean; // Banda larga

    infra_generates_power: boolean; // Gera sua propria energia?
 
    infra_grass_area: boolean; // Area gramada

    infra_woods: boolean; // Bosque

    infra_vegetable_garden: boolean; // Horta

    infra_nature_trail: boolean; // Trilha

    immediate_delivery: boolean; // Entrega imediata do lote
}