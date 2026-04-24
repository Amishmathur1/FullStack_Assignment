const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/bfhl', (req, res) => {
  const { data } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid payload, expecting { data: [...] }" });
  }

  const invalid_entries = [];
  const duplicate_edges = [];
  const seen_edges = new Set();
  const child_to_parent = new Map();
  const graph = new Map(); // node -> Set of children
  const all_nodes = new Set();
  
  // 1. Validation and Graph Construction
  for (let entry of data) {
    if (typeof entry !== 'string') {
      invalid_entries.push(entry);
      continue;
    }
    const trimmed = entry.trim();
    if (!/^[A-Z]->[A-Z]$/.test(trimmed)) {
      invalid_entries.push(entry);
      continue;
    }
    
    const parent = trimmed[0];
    const child = trimmed[3];
    
    if (parent === child) {
      // Self loop treated as invalid
      invalid_entries.push(entry);
      continue;
    }
    
    // Duplicates check
    if (seen_edges.has(trimmed)) {
      if (!duplicate_edges.includes(trimmed)) {
        duplicate_edges.push(trimmed);
      }
      continue;
    }
    seen_edges.add(trimmed);
    
    // Diamond check: If child already has a parent, ignore this edge
    if (child_to_parent.has(child)) {
      continue;
    }
    
    // Accept edge
    child_to_parent.set(child, parent);
    all_nodes.add(parent);
    all_nodes.add(child);
    
    if (!graph.has(parent)) graph.set(parent, new Set());
    if (!graph.has(child)) graph.set(child, new Set()); 
    graph.get(parent).add(child);
  }
  
  // 2. Find Roots
  const roots = [];
  for (const node of all_nodes) {
    if (!child_to_parent.has(node)) {
      roots.push(node);
    }
  }
  
  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = null;
  let max_depth = 0;
  
  const visited = new Set();
  
  function dfs(node, current_path) {
    visited.add(node);
    current_path.add(node);
    
    let max_subtree_depth = 0;
    let cycle_detected = false;
    let tree_obj = {};
    
    const children = Array.from(graph.get(node) || []).sort();
    
    for (const child of children) {
      if (current_path.has(child)) {
        cycle_detected = true;
        continue; // Don't traverse to avoid infinite loop
      }
      
      const child_result = dfs(child, new Set(current_path));
      if (child_result.cycle_detected) {
        cycle_detected = true;
      } else {
        tree_obj[child] = child_result.tree;
        max_subtree_depth = Math.max(max_subtree_depth, child_result.depth);
      }
    }
    
    return {
      tree: tree_obj,
      depth: 1 + max_subtree_depth,
      cycle_detected
    };
  }
  
  // 3. Process Normal Roots
  roots.sort(); // Deterministic ordering
  for (const root of roots) {
    if (visited.has(root)) continue;
    
    const result = dfs(root, new Set());
    
    if (result.cycle_detected) {
       hierarchies.push({
         root: root,
         tree: {},
         has_cycle: true
       });
       total_cycles++;
    } else {
       hierarchies.push({
         root: root,
         tree: { [root]: result.tree },
         depth: result.depth
       });
       total_trees++;
       
       if (result.depth > max_depth) {
         max_depth = result.depth;
         largest_tree_root = root;
       } else if (result.depth === max_depth) {
         if (!largest_tree_root || root < largest_tree_root) {
            largest_tree_root = root;
         }
       }
    }
  }
  
  // 4. Look for pure cycles (nodes not reachable from any root)
  while(true) {
    let node_to_start = null;
    for (const n of all_nodes) {
       if (!visited.has(n)) {
           if(!node_to_start || n < node_to_start) node_to_start = n;
       }
    }
    
    if (!node_to_start) break;
    
    // Start DFS from this node. By definition, it's a pure cycle.
    const result = dfs(node_to_start, new Set());
    hierarchies.push({
       root: node_to_start,
       tree: {},
       has_cycle: true
    });
    total_cycles++;
  }
  
  const response = {
    user_id: "amishmathur_21102005",
    email_id: "am6778@srmist.edu.in",
    college_roll_number: "RA2311043010071",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root: total_trees > 0 ? largest_tree_root : null
    }
  };
  
  return res.json(response);
});

app.get('/', (req, res) => res.send('API is running. POST to /bfhl'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
