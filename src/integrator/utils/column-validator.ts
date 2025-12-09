/**
 * Column Validator Utility
 * 
 * Validates Excel columns against Kondo model schema
 * and tracks unmapped/uncaptured columns
 */

// Define all valid Kondo model properties
const validKondoProperties = [
  // Basic Information
  'name',
  'slug',
  'email',
  'active',
  'status',
  'highlight',
  'featured_image',
  'type',
  'description',
  
  // Address Information
  'minutes_from_bh',
  'cep',
  'address_street_and_numbers',
  'neighborhood',
  'city',
  
  // Financial Details
  'lot_avg_price',
  'condo_rent',
  'lots_available',
  'lots_min_size',
  'finance',
  'finance_tranches',
  'finance_fees',
  'entry_value_percentage',
  'total_area',
  'immediate_delivery',
  'delivery',
  
  // Infrastructure Description
  'infra_description',
  
  // Basic Infrastructure
  'infra_eletricity',
  'infra_water',
  'infra_sidewalks',
  'infra_internet',
  
  // Security Infrastructure
  'infra_lobby_24h',
  'infra_security_team',
  'infra_wall',
  
  // Convenience Infrastructure
  'infra_sports_court',
  'infra_barbecue_zone',
  'infra_pool',
  'infra_living_space',
  'infra_pet_area',
  'infra_kids_area',
  'infra_grass_area',
  'infra_gourmet_area',
  'infra_parking_lot',
  'infra_market_nearby',
  'infra_party_saloon',
  'infra_lounge_bar',
  'infra_home_office',
  
  // Extra Infrastructure
  'infra_lagoon',
  'infra_generates_power',
  'infra_woods',
  'infra_vegetable_garden',
  'infra_nature_trail',
  'infra_gardens',
  'infra_heliport',
  'infra_gym',
  'infra_interactive_lobby',
  
  // Contact Information
  'url',
  'phone',
  'video',
];

/**
 * Check if a column name is valid in the Kondo model
 * @param columnName - The column name to validate
 * @returns true if column exists in model, false otherwise
 */
export function isValidColumn(columnName: string): boolean {
  return validKondoProperties.includes(columnName);
}

/**
 * Filter column names and separate valid from invalid ones
 * @param columnNames - Array of column names from Excel
 * @returns Object with valid and invalid column arrays
 */
export function validateColumns(columnNames: string[]): {
  validColumns: string[];
  invalidColumns: string[];
} {
  const validColumns: string[] = [];
  const invalidColumns: string[] = [];

  columnNames.forEach(column => {
    if (isValidColumn(column)) {
      validColumns.push(column);
    } else {
      invalidColumns.push(column);
    }
  });

  return { validColumns, invalidColumns };
}

/**
 * Get the list of all valid properties
 * @returns Array of all valid Kondo properties
 */
export function getValidProperties(): string[] {
  return [...validKondoProperties];
}

/**
 * Check multiple columns and return validation report
 * @param columnNames - Array of column names to validate
 * @returns Validation report with counts and details
 */
export function getValidationReport(columnNames: string[]): {
  total: number;
  valid: number;
  invalid: number;
  uncapturedColumns: string[];
} {
  const { validColumns, invalidColumns } = validateColumns(columnNames);

  return {
    total: columnNames.length,
    valid: validColumns.length,
    invalid: invalidColumns.length,
    uncapturedColumns: invalidColumns,
  };
}
