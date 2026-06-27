import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DIR, portPos, routePath } from "../../lib/design-system/geometry";
import {
	LIBRARY,
	makeBlock,
	nextBlockNum,
} from "../../lib/design-system/library";
import { createSmartLockSeed } from "../../lib/design-system/seed";
import type {
	DesignDocument,
	LibraryCategory,
	PortRef,
} from "../../lib/design-system/types";
import type { CanvasView, Editing, Selection } from "./DesignCanvas.types";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

export function useDesignCanvasController(initialDoc?: DesignDocument) {
	const seed = useRef(createSmartLockSeed());
	const [doc, setDocState] = useState(initialDoc ?? seed.current.doc);
	const [view, setViewState] = useState<CanvasView>({
		pan: { x: 120, y: 70 },
		zoom: 0.72,
	});
	const [selection, setSelectionState] = useState<Selection>(null);

	const docRef = useRef(doc);
	const viewRef = useRef(view);
	const selectionRef = useRef(selection);
	const editingRef = useRef<Editing>(null);
	const pastRef = useRef<DesignDocument[]>([]);
	const futureRef = useRef<DesignDocument[]>([]);
	const interactionRef = useRef<
		| { type: "pan"; sx: number; sy: number; px: number; py: number }
		| { type: "block"; id: string; ox: number; oy: number; moved: boolean }
		| { type: "wire"; from: PortRef }
		| null
	>(null);
	const dragStartDocRef = useRef<DesignDocument | null>(null);
	const uidRef = useRef(seed.current.uid);
	const dragTypeRef = useRef<string | null>(null);
	const svgRef = useRef<SVGSVGElement | null>(null);
	const stageRef = useRef<HTMLElement | null>(null);

	const [histVersion, setHistVersion] = useState(0);
	const [categories, setCategories] = useState<LibraryCategory[]>(LIBRARY);
	const [search, setSearch] = useState("");
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("canvas");
	const [resolving, setResolving] = useState(false);
	const [editing, setEditing] = useState<Editing>(null);
	const [tempWire, setTempWire] = useState<{
		from: PortRef;
		to: { x: number; y: number };
	} | null>(null);
	const [dropActive, setDropActive] = useState(false);

	const nextId = (prefix: string) => `${prefix}_${uidRef.current++}`;
	const bumpHistory = useCallback(
		() => setHistVersion((version) => version + 1),
		[],
	);

	const applyDoc = useCallback((next: DesignDocument) => {
		docRef.current = next;
		setDocState(next);
	}, []);

	const applyView = useCallback((next: CanvasView) => {
		viewRef.current = next;
		setViewState(next);
	}, []);

	const applySelection = useCallback((next: Selection) => {
		selectionRef.current = next;
		setSelectionState(next);
	}, []);

	const mutate = useCallback(
		(next: DesignDocument) => {
			pastRef.current = [docRef.current, ...pastRef.current].slice(0, 100);
			futureRef.current = [];
			applyDoc(next);
			bumpHistory();
		},
		[applyDoc, bumpHistory],
	);

	const undo = useCallback(() => {
		if (!pastRef.current.length) return;
		const [prev, ...rest] = pastRef.current;
		futureRef.current = [docRef.current, ...futureRef.current];
		pastRef.current = rest;
		applyDoc(prev);
		applySelection(null);
		bumpHistory();
	}, [applyDoc, applySelection, bumpHistory]);

	const redo = useCallback(() => {
		if (!futureRef.current.length) return;
		const [next, ...rest] = futureRef.current;
		pastRef.current = [docRef.current, ...pastRef.current];
		futureRef.current = rest;
		applyDoc(next);
		applySelection(null);
		bumpHistory();
	}, [applyDoc, applySelection, bumpHistory]);

	useEffect(() => {
		editingRef.current = editing;
	}, [editing]);

	const clientToCanvas = useCallback((cx: number, cy: number) => {
		const rect = svgRef.current!.getBoundingClientRect();
		const currentView = viewRef.current;
		return {
			x: (cx - rect.left - currentView.pan.x) / currentView.zoom,
			y: (cy - rect.top - currentView.pan.y) / currentView.zoom,
		};
	}, []);

	const canvasToWrapper = useCallback((cx: number, cy: number) => {
		const currentView = viewRef.current;
		return {
			x: currentView.pan.x + cx * currentView.zoom,
			y: currentView.pan.y + cy * currentView.zoom,
		};
	}, []);

	const blockMap = useMemo(
		() => new Map(doc.blocks.map((block) => [block.id, block])),
		[doc.blocks],
	);
	const connected = useMemo(() => {
		const set = new Set<string>();
		for (const wire of doc.wires) {
			set.add(wire.from.blockId);
			set.add(wire.to.blockId);
		}
		return set;
	}, [doc.wires]);

	const warnings = useMemo(
		() => doc.blocks.filter((block) => !connected.has(block.id)).length,
		[doc.blocks, connected],
	);
	const errors = useMemo(() => {
		let count = 0;
		for (const block of doc.blocks) {
			if (block.ports.B.includes("SUPPLY")) {
				const hasSupply = doc.wires.some(
					(wire) =>
						(wire.from.blockId === block.id && wire.from.side === "B") ||
						(wire.to.blockId === block.id && wire.to.side === "B"),
				);
				if (!hasSupply) count += 1;
			}
		}
		return count;
	}, [doc]);

	const addBlockAt = useCallback(
		(type: string, cx: number, cy: number) => {
			const currentDoc = docRef.current;
			const id = nextId("b");
			const block = makeBlock(
				type,
				cx - 64,
				cy - 52,
				id,
				nextBlockNum(currentDoc.blocks),
			);
			mutate({ ...currentDoc, blocks: [...currentDoc.blocks, block] });
			applySelection({ kind: "block", id });
		},
		[mutate, applySelection],
	);

	const addBlockCentered = useCallback(
		(type: string) => {
			const rect = svgRef.current!.getBoundingClientRect();
			const center = clientToCanvas(
				rect.left + rect.width / 2,
				rect.top + rect.height / 2,
			);
			addBlockAt(type, center.x, center.y);
		},
		[addBlockAt, clientToCanvas],
	);

	const onMove = useCallback(
		(event: PointerEvent) => {
			const interaction = interactionRef.current;
			if (!interaction) return;

			if (interaction.type === "pan") {
				applyView({
					...viewRef.current,
					pan: {
						x: interaction.px + (event.clientX - interaction.sx),
						y: interaction.py + (event.clientY - interaction.sy),
					},
				});
			} else if (interaction.type === "block") {
				const canvas = clientToCanvas(event.clientX, event.clientY);
				let nextX = canvas.x - interaction.ox;
				let nextY = canvas.y - interaction.oy;
				if (event.shiftKey) {
					nextX = Math.round(nextX / 22) * 22;
					nextY = Math.round(nextY / 22) * 22;
				}
				interaction.moved = true;
				const currentDoc = docRef.current;
				applyDoc({
					...currentDoc,
					blocks: currentDoc.blocks.map((block) =>
						block.id === interaction.id
							? { ...block, x: nextX, y: nextY }
							: block,
					),
				});
			} else if (interaction.type === "wire") {
				setTempWire({
					from: interaction.from,
					to: clientToCanvas(event.clientX, event.clientY),
				});
			}
		},
		[applyView, applyDoc, clientToCanvas],
	);

	const onUp = useCallback(
		(event: PointerEvent) => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			const interaction = interactionRef.current;
			interactionRef.current = null;
			if (stageRef.current) stageRef.current.style.cursor = "";
			if (!interaction) return;

			if (interaction.type === "wire") {
				setTempWire(null);
				const element = document.elementFromPoint(event.clientX, event.clientY);
				const portElement =
					element instanceof Element ? element.closest("[data-port]") : null;
				if (portElement) {
					const to = JSON.parse(
						portElement.getAttribute("data-port")!,
					) as PortRef;
					if (to.blockId !== interaction.from.blockId) {
						const currentDoc = docRef.current;
						const fromBlock = currentDoc.blocks.find(
							(block) => block.id === interaction.from.blockId,
						);
						const label =
							fromBlock?.ports[interaction.from.side][interaction.from.idx] ??
							"NET";
						const duplicate = currentDoc.wires.some(
							(wire) =>
								wire.from.blockId === interaction.from.blockId &&
								wire.from.side === interaction.from.side &&
								wire.from.idx === interaction.from.idx &&
								wire.to.blockId === to.blockId &&
								wire.to.side === to.side &&
								wire.to.idx === to.idx,
						);
						if (!duplicate) {
							mutate({
								...currentDoc,
								wires: [
									...currentDoc.wires,
									{ id: nextId("w"), from: interaction.from, to, label },
								],
							});
						}
					}
				}
			} else if (
				interaction.type === "block" &&
				interaction.moved &&
				dragStartDocRef.current
			) {
				pastRef.current = [dragStartDocRef.current, ...pastRef.current].slice(
					0,
					100,
				);
				futureRef.current = [];
				bumpHistory();
			}
			dragStartDocRef.current = null;
		},
		[onMove, mutate, bumpHistory],
	);

	const beginInteraction = useCallback(() => {
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	}, [onMove, onUp]);

	const onSvgPointerDown = useCallback(
		(event: React.PointerEvent<SVGSVGElement>) => {
			if (editingRef.current) return;
			const target = event.target as Element;
			const portElement = target.closest("[data-port]");
			if (portElement) {
				const from = JSON.parse(
					portElement.getAttribute("data-port")!,
				) as PortRef;
				const block = docRef.current.blocks.find(
					(candidate) => candidate.id === from.blockId,
				);
				if (!block) return;
				interactionRef.current = { type: "wire", from };
				setTempWire({ from, to: portPos(block, from.side, from.idx) });
				beginInteraction();
				return;
			}

			const blockElement = target.closest(".block");
			if (blockElement) {
				const id = blockElement.getAttribute("data-id")!;
				const block = docRef.current.blocks.find(
					(candidate) => candidate.id === id,
				);
				if (!block) return;
				applySelection({ kind: "block", id });
				const start = clientToCanvas(event.clientX, event.clientY);
				dragStartDocRef.current = docRef.current;
				interactionRef.current = {
					type: "block",
					id,
					ox: start.x - block.x,
					oy: start.y - block.y,
					moved: false,
				};
				beginInteraction();
				return;
			}

			const wireHit = target.closest(".wire-hit");
			if (wireHit) {
				applySelection({ kind: "wire", id: wireHit.getAttribute("data-wid")! });
				return;
			}

			applySelection(null);
			const currentView = viewRef.current;
			interactionRef.current = {
				type: "pan",
				sx: event.clientX,
				sy: event.clientY,
				px: currentView.pan.x,
				py: currentView.pan.y,
			};
			if (stageRef.current) stageRef.current.style.cursor = "grabbing";
			beginInteraction();
		},
		[applySelection, beginInteraction, clientToCanvas],
	);

	const onSvgDoubleClick = useCallback(
		(event: React.MouseEvent<SVGSVGElement>) => {
			const target = event.target as Element;
			const labelHit = target.closest("[data-label-wid]");
			if (labelHit) {
				const id = labelHit.getAttribute("data-label-wid")!;
				const wire = docRef.current.wires.find(
					(candidate) => candidate.id === id,
				);
				if (!wire) return;
				const source = docRef.current.blocks.find(
					(block) => block.id === wire.from.blockId,
				);
				const targetBlock = docRef.current.blocks.find(
					(block) => block.id === wire.to.blockId,
				);
				if (!source || !targetBlock) return;
				const { mid } = routePath(
					portPos(source, wire.from.side, wire.from.idx),
					DIR[wire.from.side],
					portPos(targetBlock, wire.to.side, wire.to.idx),
					DIR[wire.to.side],
				);
				setEditing({
					kind: "wire",
					id,
					cx: mid.x,
					cy: mid.y,
					w: 70,
					value: wire.label,
				});
				return;
			}

			const blockElement = target.closest(".block");
			if (blockElement) {
				const id = blockElement.getAttribute("data-id")!;
				const block = docRef.current.blocks.find(
					(candidate) => candidate.id === id,
				);
				if (!block) return;
				setEditing({
					kind: "block",
					id,
					cx: block.x + block.w / 2,
					cy: block.y + block.h - 13,
					w: block.w - 16,
					value: block.type,
				});
			}
		},
		[],
	);

	const commitEdit = useCallback(() => {
		const edit = editingRef.current;
		if (!edit) return;
		const value = edit.value.trim();
		const currentDoc = docRef.current;
		if (edit.kind === "block") {
			if (value) {
				mutate({
					...currentDoc,
					blocks: currentDoc.blocks.map((block) =>
						block.id === edit.id ? { ...block, type: value } : block,
					),
				});
			}
		} else {
			mutate({
				...currentDoc,
				wires: currentDoc.wires.map((wire) =>
					wire.id === edit.id ? { ...wire, label: value } : wire,
				),
			});
		}
		setEditing(null);
	}, [mutate]);

	const zoomBy = useCallback(
		(factor: number) => {
			const rect = svgRef.current!.getBoundingClientRect();
			const currentView = viewRef.current;
			const middleX = rect.width / 2;
			const middleY = rect.height / 2;
			const before = {
				x: (middleX - currentView.pan.x) / currentView.zoom,
				y: (middleY - currentView.pan.y) / currentView.zoom,
			};
			const zoom = Math.min(
				MAX_ZOOM,
				Math.max(MIN_ZOOM, currentView.zoom * factor),
			);
			applyView({
				zoom,
				pan: { x: middleX - before.x * zoom, y: middleY - before.y * zoom },
			});
		},
		[applyView],
	);

	const fitView = useCallback(() => {
		const currentDoc = docRef.current;
		if (!currentDoc.blocks.length) {
			applyView({ pan: { x: 120, y: 70 }, zoom: 0.72 });
			return;
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const block of currentDoc.blocks) {
			minX = Math.min(minX, block.x);
			minY = Math.min(minY, block.y);
			maxX = Math.max(maxX, block.x + block.w);
			maxY = Math.max(maxY, block.y + block.h);
		}

		const padding = 80;
		const rect = svgRef.current!.getBoundingClientRect();
		const width = maxX - minX + padding * 2;
		const height = maxY - minY + padding * 2;
		const zoom = Math.max(
			MIN_ZOOM,
			Math.min(2.2, rect.width / width, rect.height / height),
		);
		applyView({
			zoom,
			pan: {
				x: (rect.width - (maxX + minX) * zoom) / 2,
				y: (rect.height - (maxY + minY) * zoom) / 2,
			},
		});
	}, [applyView]);

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;
		const handler = (event: WheelEvent) => {
			event.preventDefault();
			const rect = svgRef.current!.getBoundingClientRect();
			const currentView = viewRef.current;
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;
			const before = {
				x: (mouseX - currentView.pan.x) / currentView.zoom,
				y: (mouseY - currentView.pan.y) / currentView.zoom,
			};
			const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
			const zoom = Math.min(
				MAX_ZOOM,
				Math.max(MIN_ZOOM, currentView.zoom * factor),
			);
			applyView({
				zoom,
				pan: { x: mouseX - before.x * zoom, y: mouseY - before.y * zoom },
			});
		};
		stage.addEventListener("wheel", handler, { passive: false });
		return () => stage.removeEventListener("wheel", handler);
	}, [applyView]);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if (editingRef.current) return;
			const selected = selectionRef.current;
			const meta = event.ctrlKey || event.metaKey;
			if (meta && event.key.toLowerCase() === "z") {
				event.preventDefault();
				if (event.shiftKey) redo();
				else undo();
				return;
			}
			if (meta && event.key.toLowerCase() === "y") {
				event.preventDefault();
				redo();
				return;
			}
			if ((event.key === "Delete" || event.key === "Backspace") && selected) {
				event.preventDefault();
				const currentDoc = docRef.current;
				if (selected.kind === "block") {
					mutate({
						blocks: currentDoc.blocks.filter(
							(block) => block.id !== selected.id,
						),
						wires: currentDoc.wires.filter(
							(wire) =>
								wire.from.blockId !== selected.id &&
								wire.to.blockId !== selected.id,
						),
					});
				} else {
					mutate({
						...currentDoc,
						wires: currentDoc.wires.filter((wire) => wire.id !== selected.id),
					});
				}
				applySelection(null);
			}
			if (event.key === "Escape") applySelection(null);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [mutate, applySelection, undo, redo]);

	const onToggleCategory = useCallback((name: string) => {
		setCategories((current) =>
			current.map((category) =>
				category.name === name
					? { ...category, open: !category.open }
					: category,
			),
		);
	}, []);

	const onDragItem = useCallback((type: string, event: React.DragEvent) => {
		dragTypeRef.current = type;
		event.dataTransfer.setData("text/plain", type);
		event.dataTransfer.effectAllowed = "copy";
	}, []);

	const onResolve = useCallback(() => {
		setResolving(true);
		window.setTimeout(() => setResolving(false), 1100);
	}, []);

	const tempPath = useMemo(() => {
		if (!tempWire) return null;
		const block = blockMap.get(tempWire.from.blockId);
		if (!block) return null;
		const point = portPos(block, tempWire.from.side, tempWire.from.idx);
		const direction = DIR[tempWire.from.side];
		return routePath(point, direction, tempWire.to, {
			x: -direction.x || 1,
			y: 0,
		}).d;
	}, [tempWire, blockMap]);

	const editWrapper = editing ? canvasToWrapper(editing.cx, editing.cy) : null;
	void histVersion;

	return {
		activeTab,
		addBlockAt,
		addBlockCentered,
		blockMap,
		categories,
		collapsed,
		commitEdit,
		connected,
		doc,
		dropActive,
		editWrapper,
		editing,
		errors,
		fitView,
		futureRef,
		onDragItem,
		onResolve,
		onSvgDoubleClick,
		onSvgPointerDown,
		onToggleCategory,
		pastRef,
		redo,
		search,
		selection,
		setActiveTab,
		setCollapsed,
		setDropActive,
		setEditing,
		setSearch,
		stageRef,
		svgRef,
		tempPath,
		undo,
		view,
		warnings,
		zoomBy,
		clientToCanvas,
		dragTypeRef,
		resolving,
	};
}
