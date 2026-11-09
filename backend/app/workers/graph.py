"""
TraceDoc – Evidence Graph Worker (NetworkX).
Builds navigational evidence graphs and extracts minimal contradiction subgraphs.
"""
from __future__ import annotations
import aiosqlite
import networkx as nx
from app.utils.helpers import from_json
from app.utils.audit import write_audit


async def build_evidence_graph(db: aiosqlite.Connection, case_id: str) -> dict:
    G = nx.DiGraph()

    # 1. Documents & Claims
    async with db.execute("SELECT * FROM documents WHERE case_id = ?", (case_id,)) as cur:
        for d in await cur.fetchall():
            G.add_node(d["document_id"], node_type="DOCUMENT", label=d["source_name"], type=d["classification"])

    async with db.execute(
        "SELECT c.* FROM claims c JOIN documents d ON d.document_id = c.document_id WHERE d.case_id = ?",
        (case_id,),
    ) as cur:
        for c in await cur.fetchall():
            cid = c["claim_id"]
            G.add_node(cid, node_type="CLAIM", label=f"{c['field_name']}: {c['normalized_value'] or c['raw_text']}", bbox_norm=from_json(c["bbox_norm"]))
            G.add_edge(c["document_id"], cid, relation="has_claim")

    # 2. Correlation Edges & Hypotheses
    async with db.execute("SELECT * FROM correlation_edges WHERE case_id = ?", (case_id,)) as cur:
        for e in await cur.fetchall():
            if G.has_node(e["claim_id_a"]) and G.has_node(e["claim_id_b"]):
                G.add_edge(e["claim_id_a"], e["claim_id_b"], relation=e["outcome"], type=e["relation_type"])

    async with db.execute("SELECT * FROM hypothesis_tests WHERE case_id = ?", (case_id,)) as cur:
        for h in await cur.fetchall():
            hid = h["hypothesis_id"]
            G.add_node(hid, node_type="HYPOTHESIS", label=f"{h['name']} [{h['outcome']}]", outcome=h["outcome"])
            for eid in from_json(h["evidence_used"]):
                if G.has_node(eid):
                    G.add_edge(eid, hid, relation="tested_by")

    # 3. Findings
    async with db.execute("SELECT * FROM findings WHERE case_id = ?", (case_id,)) as cur:
        for f in await cur.fetchall():
            fid = f["finding_id"]
            G.add_node(fid, node_type="FINDING", label=f"{f['finding_type']} ({f['status']})", status=f["status"])
            for wid in from_json(f["witness_claim_ids"]):
                if G.has_node(wid):
                    G.add_edge(wid, fid, relation="witnesses")

    data = nx.node_link_data(G)
    await write_audit(db, "GRAPH_GENERATED", case_id, payload={"nodes": G.number_of_nodes(), "edges": G.number_of_edges()})
    return data


async def get_subgraph_for_finding(db: aiosqlite.Connection, finding_id: str) -> dict:
    async with db.execute("SELECT case_id FROM findings WHERE finding_id = ?", (finding_id,)) as cur:
        f = await cur.fetchone()
    if not f:
        return {"nodes": [], "links": []}
    return await build_evidence_graph(db, f["case_id"])
