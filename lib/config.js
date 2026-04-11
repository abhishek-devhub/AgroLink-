/**
 * AgroLink — Central Configuration
 * Single source of truth for all app-wide constants.
 * No more hardcoded lists scattered across pages.
 */

export const CROPS = [
  'Wheat', 'Rice', 'Tomato', 'Onion', 'Potato',
  'Sugarcane', 'Soybean', 'Cotton', 'Maize', 'Chilli',
  'Garlic', 'Ginger', 'Groundnut', 'Mustard', 'Turmeric', 'Other',
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

export const UNITS = [
  { value: 'quintal', label: 'Quintal' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ton', label: 'Metric Ton' },
];

export const GRADES = [
  { value: 'A', label: 'A — Premium Quality' },
  { value: 'B', label: 'B — Standard Quality' },
  { value: 'C', label: 'C — Economy Grade' },
];

export const COURIER_PARTNERS = [
  'Delhivery', 'BlueDart', 'DTDC', 'India Post',
  'Ekart', 'Professional Couriers', 'Other',
];

// Default Pune coords used when geolocation is denied
export const DEFAULT_LAT = 18.52;
export const DEFAULT_LON = 73.86;
export const DEFAULT_LOCATION = 'Pune, Maharashtra';

/** App-wide metadata */
export const APP_META = {
  name: 'AgroLink',
  tagline: 'Fair deals, straight from the field',
  supportPhone: '1800-AGRO-LINK',
  supportEmail: 'namaste@agrolink.in',
  hqLocation: 'Pune, Maharashtra',
  year: new Date().getFullYear(),
};
