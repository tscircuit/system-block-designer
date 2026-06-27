import type { BomRow } from "./bomData";
import { FilterIcon, InfoIcon, SortIcon } from "./BomIcons";

interface BomColumn {
	key: keyof Pick<
		BomRow,
		| "manufacturer"
		| "mpn"
		| "packageName"
		| "value"
		| "quantity"
		| "functionalBlock"
		| "lifecycle"
		| "unitPrice"
		| "stock"
		| "leadTime"
	>;
	label: string;
	width: number;
	align?: "right";
	filter?: boolean;
	sort?: boolean;
	info?: boolean;
}

const columns: BomColumn[] = [
	{
		key: "manufacturer",
		label: "Manufacturer",
		width: 280,
		filter: true,
		sort: true,
	},
	{ key: "mpn", label: "MPN", width: 170, sort: true },
	{
		key: "packageName",
		label: "Package",
		width: 102,
		align: "right",
		sort: true,
	},
	{ key: "value", label: "Value", width: 82, align: "right" },
	{
		key: "quantity",
		label: "Quantity",
		width: 102,
		align: "right",
		sort: true,
	},
	{ key: "functionalBlock", label: "Functional Block(s)", width: 314 },
	{ key: "lifecycle", label: "Lifecycle", width: 108, filter: true },
	{
		key: "unitPrice",
		label: "Est. Unit Price",
		width: 142,
		align: "right",
		sort: true,
		info: true,
	},
	{
		key: "stock",
		label: "Est. Stock",
		width: 112,
		align: "right",
		sort: true,
		info: true,
	},
	{ key: "leadTime", label: "Lead time", width: 120, sort: true, info: true },
];

interface BomTableProps {
	rows: BomRow[];
}

export function BomTable({ rows }: BomTableProps) {
	return (
		<div className="bom-table-wrap">
			<table className="bom-table">
				<colgroup>
					{columns.map((column) => (
						<col key={column.key} style={{ width: column.width }} />
					))}
				</colgroup>
				<thead>
					<tr>
						{columns.map((column) => (
							<th
								key={column.key}
								className={column.align === "right" ? "is-right" : undefined}
							>
								<span className="bom-th-content">
									<span>
										{column.info && <InfoIcon />}
										{column.label}
									</span>
									<span className="bom-th-icons">
										{column.sort && <SortIcon />}
										{column.filter && <FilterIcon />}
									</span>
								</span>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.mpn}>
							<td>
								<div className="bom-manufacturer">{row.manufacturer}</div>
								<a href="#">View Alternatives</a>
							</td>
							<td>
								<a href="#">{row.mpn}</a>
							</td>
							<td className="is-right">{row.packageName}</td>
							<td className="is-right">{row.value}</td>
							<td className="is-right">{row.quantity}</td>
							<td>
								<div className="bom-functional-cell">
									<div>
										<a href="#">{row.functionalBlock}</a>
										<div>{row.partName}</div>
									</div>
									<span className="bom-locked">▣ Locked</span>
								</div>
							</td>
							<td>
								<span
									className={`bom-lifecycle ${row.lifecycle === "End Of Life" ? "is-eol" : ""}`}
								>
									{row.lifecycle}
								</span>
							</td>
							<td className="is-right">{row.unitPrice}</td>
							<td className="is-right">{row.stock}</td>
							<td>{row.leadTime}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
