export type Country = { iso: string; name: string; dial: string };

export const DEFAULT_COUNTRY = "SA";
export const COUNTRIES: Country[] = [
  { iso: "SA", name: "Saudi Arabia", dial: "+966" },
  ...([
    { iso: "DZ", name: "Algeria", dial: "+213" },
    { iso: "AR", name: "Argentina", dial: "+54" },
    { iso: "AU", name: "Australia", dial: "+61" },
    { iso: "AT", name: "Austria", dial: "+43" },
    { iso: "BH", name: "Bahrain", dial: "+973" },
    { iso: "BD", name: "Bangladesh", dial: "+880" },
    { iso: "BE", name: "Belgium", dial: "+32" },
    { iso: "BR", name: "Brazil", dial: "+55" },
    { iso: "CA", name: "Canada", dial: "+1" },
    { iso: "CL", name: "Chile", dial: "+56" },
    { iso: "CN", name: "China", dial: "+86" },
    { iso: "CO", name: "Colombia", dial: "+57" },
    { iso: "DK", name: "Denmark", dial: "+45" },
    { iso: "EG", name: "Egypt", dial: "+20" },
    { iso: "ET", name: "Ethiopia", dial: "+251" },
    { iso: "FI", name: "Finland", dial: "+358" },
    { iso: "FR", name: "France", dial: "+33" },
    { iso: "DE", name: "Germany", dial: "+49" },
    { iso: "GH", name: "Ghana", dial: "+233" },
    { iso: "GR", name: "Greece", dial: "+30" },
    { iso: "HK", name: "Hong Kong", dial: "+852" },
    { iso: "IN", name: "India", dial: "+91" },
    { iso: "ID", name: "Indonesia", dial: "+62" },
    { iso: "IR", name: "Iran", dial: "+98" },
    { iso: "IQ", name: "Iraq", dial: "+964" },
    { iso: "IE", name: "Ireland", dial: "+353" },
    { iso: "IT", name: "Italy", dial: "+39" },
    { iso: "JP", name: "Japan", dial: "+81" },
    { iso: "JO", name: "Jordan", dial: "+962" },
    { iso: "KE", name: "Kenya", dial: "+254" },
    { iso: "KW", name: "Kuwait", dial: "+965" },
    { iso: "LB", name: "Lebanon", dial: "+961" },
    { iso: "LY", name: "Libya", dial: "+218" },
    { iso: "MY", name: "Malaysia", dial: "+60" },
    { iso: "MX", name: "Mexico", dial: "+52" },
    { iso: "MA", name: "Morocco", dial: "+212" },
    { iso: "NP", name: "Nepal", dial: "+977" },
    { iso: "NL", name: "Netherlands", dial: "+31" },
    { iso: "NZ", name: "New Zealand", dial: "+64" },
    { iso: "NG", name: "Nigeria", dial: "+234" },
    { iso: "NO", name: "Norway", dial: "+47" },
    { iso: "OM", name: "Oman", dial: "+968" },
    { iso: "PK", name: "Pakistan", dial: "+92" },
    { iso: "PS", name: "Palestine", dial: "+970" },
    { iso: "PH", name: "Philippines", dial: "+63" },
    { iso: "PL", name: "Poland", dial: "+48" },
    { iso: "PT", name: "Portugal", dial: "+351" },
    { iso: "QA", name: "Qatar", dial: "+974" },
    { iso: "RU", name: "Russia", dial: "+7" },
    { iso: "SG", name: "Singapore", dial: "+65" },
    { iso: "ZA", name: "South Africa", dial: "+27" },
    { iso: "KR", name: "South Korea", dial: "+82" },
    { iso: "ES", name: "Spain", dial: "+34" },
    { iso: "LK", name: "Sri Lanka", dial: "+94" },
    { iso: "SD", name: "Sudan", dial: "+249" },
    { iso: "SE", name: "Sweden", dial: "+46" },
    { iso: "CH", name: "Switzerland", dial: "+41" },
    { iso: "SY", name: "Syria", dial: "+963" },
    { iso: "TH", name: "Thailand", dial: "+66" },
    { iso: "TN", name: "Tunisia", dial: "+216" },
    { iso: "TR", name: "Türkiye", dial: "+90" },
    { iso: "UA", name: "Ukraine", dial: "+380" },
    { iso: "AE", name: "United Arab Emirates", dial: "+971" },
    { iso: "GB", name: "United Kingdom", dial: "+44" },
    { iso: "US", name: "United States", dial: "+1" },
    { iso: "VN", name: "Vietnam", dial: "+84" },
    { iso: "YE", name: "Yemen", dial: "+967" },
  ] satisfies Country[]),
];
const BY_DIAL_DESC = [...COUNTRIES].sort(
  (a, b) => b.dial.length - a.dial.length || (a.iso === "US" ? -1 : b.iso === "US" ? 1 : 0)
);

export const flagEmoji = (iso: string) =>
  String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));

export function splitPhone(phone: string): { phoneCountry: string; phoneNumber: string } {
  const raw = phone.trim().replace(/^00/, "+");

  if (raw.startsWith("+")) {
    const match = BY_DIAL_DESC.find((c) => raw.startsWith(c.dial));
    if (match) {
      return { phoneCountry: match.iso, phoneNumber: raw.slice(match.dial.length).trim() };
    }
    return { phoneCountry: "", phoneNumber: raw };
  }

  return { phoneCountry: DEFAULT_COUNTRY, phoneNumber: raw.replace(/^0(?!0)/, "") };
}

export function joinPhone(phoneCountry: string, phoneNumber: string) {
  const number = phoneNumber.trim();
  if (!number) return "";
  const dial = COUNTRIES.find((c) => c.iso === phoneCountry)?.dial;
  return dial ? `${dial} ${number}` : number;
}