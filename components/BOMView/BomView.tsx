import { bomRows, bomSummary } from "./bomData";
import { BomSummary } from "./BomSummary";
import { BomTable } from "./BomTable";
import { BomToolbar } from "./BomToolbar";
import "./bom-view.css";

export function BomView() {
	return (
		<div className="bom-page">
			<main className="bom-main">
				<BomSummary items={bomSummary} />
				<section className="bom-table-section" data-testid="bom-table">
					<BomToolbar />
					<BomTable rows={bomRows} />
				</section>
			</main>
		</div>
	);
}

export default BomView;
