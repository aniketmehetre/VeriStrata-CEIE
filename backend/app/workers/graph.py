"""
VeriStrata CEIE – Evidence Graph Worker (NetworkX).
Constructs multi-layer provenance and evidence graphs:
  - Links contradictory claims directly to source document IDs, page indexes, and bounding boxes.
  - Generates minimal contradiction subgraphs for judicial inspection.
"""
from __future__ import annotations
import aiosqlite
import networkx as nx
from app.utils.helpers import from_json
from app.utils.audit import write_audit


async def build_evidence_graph(db: aiosqlite.Connection, case_id: str) -> dict:
    G = nx.DiGraph()

    # 1. Document Strata Nodes
    async with db.execute("SELECT * FROM documents WHERE case_id = ?", (case_id,)) as cur:
        docs = [dict(r) for r in await cur.fetchall()]
        for d in docs:
            G.add_node(
                d["document_id"],
                node_type="DOCUMENT",
                label=d["source_name"],
                classification=d["classification"],
                sha256=d["original_sha256"],
                page_count=d["page_count"],
            )

    # 2. Extracted Claim Nodes with Exact Spatial Coordinates
    async with db.execute(
        "SELECT c.*, d.source_name FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        claims = [dict(r) for r in await cur.fetchall()]
        for c in claims:
            cid = c["claim_id"]
            bbox = from_json(c.get("bbox_norm", "[]"))
            G.add_node(
                cid,
                node_type="CLAIM",
                label=f"{c['field_name']}: {c['normalized_value'] or c['raw_text']}",
                field_name=c["field_name"],
                raw_text=c["raw_text"],
                normalized_value=c["normalized_value"],
                document_id=c["document_id"],
                source_document=c["source_name"],
                page_index=c["page_index"],
                bbox_norm=bbox,
                confidence=c["extraction_confidence"],
            )
            # Link Document to Claim
            G.add_edge(c["document_id"], cid, relation="has_claim")

    # 3. Cross-Document Correlation Edges
    async with db.execute("SELECT * FROM correlation_edges WHERE case_id = ?", (case_id,)) as cur:
        edges = [dict(r) for r in await cur.fetchall()]
        for e in edges:
            if G.has_node(e["claim_id_a"]) and G.has_node(e["claim_id_b"]):
                G.add_edge(
                    e["claim_id_a"],
                    e["claim_id_b"],
                    relation=e["outcome"],
                    relation_type=e["relation_type"],
                    match_score=e["match_score"],
                )

    # 4. SMT Hypothesis Testing Nodes
    async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (case_id,)) as cur:
        hyps = [dict(r) for r in await cur.fetchall()]
        for h in hyps:
            hid = h["hypothesis_id"]
            G.add_node(
                hid,
                node_type="HYPOTHESIS",
                label=f"SMT: {h['name']} [{h['outcome']}]",
                hypothesis_name=h["name"],
                outcome=h["outcome"],
                explanation=h["explanation"],
                residual_conflict=h["residual_conflict"],
                solver_version=h["solver_version"],
            )
            for eid in from_json(h.get("evidence_used", "[]")):
                if G.has_node(eid):
                    G.add_edge(eid, hid, relation="tested_by")

    # 5. Forensic Finding & Minimal Contradiction Witness Nodes
    async with db.execute("SELECT * FROM findings WHERE case_id = ?", (case_id,)) as cur:
        findings = [dict(r) for r in await cur.fetchall()]
        for f in findings:
            fid = f["finding_id"]
            G.add_node(
                fid,
                node_type="FINDING",
                label=f"{f['finding_type']} ({f['status']})",
                status=f["status"],
                priority=f["priority"],
                review_required=bool(f["review_required"]),
            )
            witness_ids = from_json(f.get("witness_claim_ids", "[]"))
            for wid in witness_ids:
                if G.has_node(wid):
                    G.add_edge(wid, fid, relation="minimal_witness")

    data = nx.node_link_data(G)
    await write_audit(db, "GRAPH_GENERATED", case_id, payload={"nodes": G.number_of_nodes(), "edges": G.number_of_edges()})
    return data


async def get_subgraph_for_finding(db: aiosqlite.Connection, finding_id: str) -> dict:
    async with db.execute("SELECT case_id, witness_claim_ids FROM findings WHERE finding_id = ?", (finding_id,)) as cur:
        f = await cur.fetchone()
    if not f:
        return {"nodes": [], "links": []}

    full_graph = await build_evidence_graph(db, f["case_id"])
    G = nx.node_link_graph(full_graph)

    # Extract finding node + witness claims + parent documents
    witness_ids = set(from_json(f["witness_claim_ids"]))
    subgraph_nodes = {finding_id} | witness_ids

    for wid in witness_ids:
        if G.has_node(wid):
            # Add parents (documents) and children (hypotheses)
            subgraph_nodes.update(G.predecessors(wid))
            subgraph_nodes.update(G.successors(wid))

    valid_nodes = [n for n in subgraph_nodes if G.has_node(n)]
    sub_G = G.subgraph(valid_nodes)
    return nx.node_link_data(sub_G)
