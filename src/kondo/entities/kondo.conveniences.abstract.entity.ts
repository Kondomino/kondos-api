
export const convenience_types = [
    'basic',
    'convenience',
    'security',
    'extra'
]
export const basic_conveniences = [
    'infra_eletricity',
    'infra_water',
    'infra_sidewalks',
    'infra_internet'
];
export const extra_conveniences = [
    'infra_lagoon',
    'infra_generates_power',
    'infra_woods',
    'infra_vegetable_garden',
    'infra_nature_trail',
];
export const conveniences_conveniences = [
    'infra_sports_court',
    'infra_barbecue_zone',
    'infra_pool',
    'infra_living_space',
    'infra_pet_area',
    'infra_kids_area',
    'infra_grass_area',
];
export const security_conveniences = [
    'infra_lobby_24h',
    'infra_security_team',
    'infra_wall',
];

export interface KondoConveniencesType {
    
    type: string,
    conveniences: string[]
    /*
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
    */
}