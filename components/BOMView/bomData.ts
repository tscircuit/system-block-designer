export interface BomSummaryItem {
	label: string;
	value: string;
}

export interface BomRow {
	manufacturer: string;
	mpn: string;
	packageName: string;
	value: string;
	quantity: string;
	functionalBlock: string;
	partName: string;
	lifecycle: "Active" | "End Of Life";
	unitPrice: string;
	stock: string;
	leadTime: string;
}

export const bomSummary: BomSummaryItem[] = [
	{ label: "BOM Last updated", value: "26 Jun 2026" },
	{ label: "Unique Components", value: "18" },
	{ label: "Est. Price", value: "6.69 USD" },
	{ label: "Maximum lead time", value: "99 weeks" },
];

export const bomRows: BomRow[] = [
	{
		manufacturer: "TE CONNECTIVITY LTD",
		mpn: "5-534237-3",
		packageName: "-",
		value: "FEMALE",
		quantity: "1",
		functionalBlock: "1. Batteries",
		partName: "5-534237-3 Female Header V1",
		lifecycle: "Active",
		unitPrice: "1.6922 USD",
		stock: "12755",
		leadTime: "16 week(s)",
	},
	{
		manufacturer: "PANASONIC CORP",
		mpn: "ERJ2RKF3322X",
		packageName: "0402",
		value: "33.2 kOhm",
		quantity: "1",
		functionalBlock: "1. Batteries",
		partName: "5-534237-3 Female Header V1",
		lifecycle: "Active",
		unitPrice: "0.061 USD",
		stock: "485068",
		leadTime: "16 week(s)",
	},
	{
		manufacturer: "PANASONIC CORP",
		mpn: "ERJ2RKF3321X",
		packageName: "0402",
		value: "3.32 kOhm",
		quantity: "1",
		functionalBlock: "1. Batteries",
		partName: "5-534237-3 Female Header V1",
		lifecycle: "Active",
		unitPrice: "0.061 USD",
		stock: "807790",
		leadTime: "15 week(s)",
	},
	{
		manufacturer: "MURATA MANUFACTURING CO LTD",
		mpn: "GCM155R71E104KE02D",
		packageName: "1005M/0402",
		value: "100 nF",
		quantity: "1",
		functionalBlock: "2. LED Drivers",
		partName: "PCA9532D,118 V1",
		lifecycle: "Active",
		unitPrice: "0.0429 USD",
		stock: "5088006",
		leadTime: "13 week(s)",
	},
	{
		manufacturer: "YAGEO CORP",
		mpn: "RC0201FR-0710KL",
		packageName: "0201",
		value: "10 kOhm",
		quantity: "1",
		functionalBlock: "2. LED Drivers",
		partName: "PCA9532D,118 V1",
		lifecycle: "Active",
		unitPrice: "0.022 USD",
		stock: "123636708",
		leadTime: "15 week(s)",
	},
	{
		manufacturer: "GENERIC SEMICONDUCTORS",
		mpn: "CTRL9532D,118",
		packageName: "-",
		value: "-",
		quantity: "1",
		functionalBlock: "2. LED Drivers",
		partName: "PCA9532D,118 V1",
		lifecycle: "End Of Life",
		unitPrice: "1.66 USD",
		stock: "-",
		leadTime: "99 week(s)",
	},
	{
		manufacturer: "KYOCERA AVX COMPONENTS CORP",
		mpn: "06035C104K4T2A",
		packageName: "0603",
		value: "100 nF",
		quantity: "1",
		functionalBlock: "3. HDMI Connector",
		partName: "HD05-19-TH-TR V1",
		lifecycle: "Active",
		unitPrice: "0.0462 USD",
		stock: "35034080",
		leadTime: "11 week(s)",
	},
];
