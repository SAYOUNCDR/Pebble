import json
import re

from app.llm.dmr_client import DMRClient


def _flatten_tree(nodes: list[dict[str, object]], parent_id: str | None = None) -> list[dict[str, object]]:
    flat: list[dict[str, object]] = []
    for node in nodes:
        node_id = str(node.get("node_id", "")).strip()
        title = str(node.get("title", "")).strip()
        text = str(node.get("text", node.get("summary", ""))).strip()
        page_index = int(node.get("page_index", 1))
        children = node.get("nodes", [])
        child_nodes = children if isinstance(children, list) else []
        flat.append(
            {
                "node_id": node_id,
                "title": title,
                "text": text,
                "page_index": page_index,
                "parent_id": parent_id,
                "children": child_nodes,
            }
        )
        flat.extend(_flatten_tree(child_nodes, parent_id=node_id))
    return flat


def _extract_json_object(text: str) -> dict[str, object] | None:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        loaded = json.loads(text[start : end + 1])
        return loaded if isinstance(loaded, dict) else None
    except json.JSONDecodeError:
        return None


def _score_node(query: str, node: dict[str, object]) -> int:
    query_terms = [term for term in re.split(r"[^a-z0-9]+", query.lower()) if len(term) >= 3]
    haystack = f"{str(node.get('title', '')).lower()} {str(node.get('text', '')).lower()}"
    score = 0
    for term in query_terms:
        if term in haystack:
            score += 2
    for keyword in ("maintenance", "inspection", "safety", "warning", "service", "procedure", "check"):
        if keyword in haystack:
            score += 1
    return score


def _fallback_node_ids(query: str, flat_nodes: list[dict[str, object]], max_nodes: int) -> list[str]:
    ranked = sorted(flat_nodes, key=lambda node: _score_node(query, node), reverse=True)
    selected: list[str] = []
    for node in ranked:
        node_id = str(node.get("node_id", "")).strip()
        if node_id and node_id not in selected:
            selected.append(node_id)
        if len(selected) >= max_nodes:
            break
    return selected


def _find_node_by_id(nodes: list[dict[str, object]], node_id: str) -> dict[str, object] | None:
    for node in nodes:
        if str(node.get("node_id", "")).strip() == node_id:
            return node
        children = node.get("nodes", [])
        child_nodes = children if isinstance(children, list) else []
        found = _find_node_by_id(child_nodes, node_id)
        if found:
            return found
    return None


def _extract_nodes(nodes: list[dict[str, object]], node_ids: list[str]) -> list[dict[str, object]]:
    selected_nodes: list[dict[str, object]] = []
    for node_id in node_ids:
        node = _find_node_by_id(nodes, node_id)
        if node:
            selected_nodes.append(node)
    return selected_nodes


def _build_tree_prompt(
    objective: str,
    tree_preview: list[dict[str, object]],
    expert_rules: str | None,
    max_nodes: int,
) -> str:
    serialized_nodes = "\n".join(
        f"- node_id={node['node_id']} | title={node['title']} | page={node['page_index']} | summary={str(node['text'])[:220]}"
        for node in tree_preview
        if node.get("node_id")
    )
    expert_block = f"\nExpert rules:\n{expert_rules}\n" if expert_rules else "\n"

    return (
        "You are a tree-search router for a technical manual.\n"
        "Select the most relevant node IDs for the objective.\n"
        f"Max node IDs: {max_nodes}\n"
        f"Objective: {objective}\n"
        f"{expert_block}"
        "Return valid JSON only with this shape:\n"
        '{"thinking":"short reason","node_list":["0001","0002"]}\n'
        "Candidate nodes:\n"
        f"{serialized_nodes}"
    )


async def llm_tree_search(
    objective: str,
    tree_nodes: list[dict[str, object]],
    max_nodes: int,
    expert_rules: str | None = None,
) -> tuple[list[str], str]:
    flat_nodes = _flatten_tree(tree_nodes)
    if not flat_nodes:
        return [], "Tree has no nodes."

    preview = flat_nodes[:120]
    prompt = _build_tree_prompt(
        objective=objective,
        tree_preview=preview,
        expert_rules=expert_rules,
        max_nodes=max_nodes,
    )

    dmr_client = DMRClient()
    try:
        model_output = await dmr_client.chat(
            messages=[
                {"role": "system", "content": "Return only JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )
    except Exception as error:  # noqa: BLE001
        fallback_ids = _fallback_node_ids(objective, flat_nodes, max_nodes=max_nodes)
        return fallback_ids, f"Tree search fallback used (LLM error: {error})"

    payload = _extract_json_object(model_output)
    if not payload:
        fallback_ids = _fallback_node_ids(objective, flat_nodes, max_nodes=max_nodes)
        return fallback_ids, "Tree search fallback used (invalid JSON from model)."

    raw_node_list = payload.get("node_list", [])
    if not isinstance(raw_node_list, list):
        fallback_ids = _fallback_node_ids(objective, flat_nodes, max_nodes=max_nodes)
        return fallback_ids, "Tree search fallback used (node_list missing)."

    selected_ids: list[str] = []
    valid_id_set = {str(node.get("node_id", "")).strip() for node in flat_nodes}
    for raw_node_id in raw_node_list:
        node_id = str(raw_node_id).strip()
        if node_id and node_id in valid_id_set and node_id not in selected_ids:
            selected_ids.append(node_id)
        if len(selected_ids) >= max_nodes:
            break

    if not selected_ids:
        selected_ids = _fallback_node_ids(objective, flat_nodes, max_nodes=max_nodes)
        return selected_ids, "Tree search fallback used (no valid node IDs selected)."

    thinking = str(payload.get("thinking", "")).strip()
    return selected_ids, thinking or "Tree search selected relevant nodes."


def tree_nodes_to_sections(tree_nodes: list[dict[str, object]], node_ids: list[str]) -> list[dict[str, object]]:
    selected = _extract_nodes(tree_nodes, node_ids=node_ids)
    sections: list[dict[str, object]] = []
    for idx, node in enumerate(selected, start=1):
        node_id = str(node.get("node_id", f"node-{idx}")).strip()
        title = str(node.get("title", "Untitled Section")).strip()
        page_index = int(node.get("page_index", 1))
        text = str(node.get("text", node.get("summary", ""))).strip()
        sections.append(
            {
                "section_id": node_id,
                "title": title,
                "page_start": page_index,
                "page_end": page_index,
                "summary": text[:900],
            }
        )
    return sections

