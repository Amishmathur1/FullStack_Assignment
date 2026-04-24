import { useState } from 'react'
import axios from 'axios'

// Recursive component to render the tree with line connectors
const TreeNode = ({ nodeName, childrenObj }) => {
  const childKeys = Object.keys(childrenObj || {})
  
  return (
    <div className="tree-node-wrapper">
      <div className="tree-node-item">
        <span className="tree-node-label">{nodeName}</span>
      </div>
      {childKeys.length > 0 && (
        <div className="tree-children">
          {childKeys.map((key) => (
            <TreeNode key={key} nodeName={key} childrenObj={childrenObj[key]} />
          ))}
        </div>
      )}
    </div>
  )
}

function App() {
  const [inputVal, setInputVal] = useState('[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)

    try {
      let parsedData = [];
      let rawText = inputVal.trim();
      
      try {
        // Attempt strict JSON parse first
        let jsonObj = JSON.parse(rawText);
        if (Array.isArray(jsonObj)) {
          parsedData = jsonObj; // [ "A->B", ... ]
        } else if (jsonObj && typeof jsonObj === 'object' && Array.isArray(jsonObj.data)) {
          parsedData = jsonObj.data; // { "data": [ "A->B", ... ] }
        } else {
          throw new Error("Valid JSON, but unhandled structure.");
        }
      } catch (err) {
        // Fallback: assume raw comma-separated strings, possibly missing brackets
        let cleanedText = rawText.replace(/^[\{\[]/, '').replace(/[\}\]]$/, '').trim();
        if (cleanedText) {
          parsedData = cleanedText.split(',').map(item => {
            // Remove lingering quotes and whitespace
            return item.trim().replace(/^["']|["']$/g, '');
          });
        } else {
          throw new Error("Invalid input format. Please try standard formatted JSON.");
        }
      }

      // Hardcoded local URL for now. Will be replaced by standard routing during deployment.
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const response = await axios.post(`${API_URL}/bfhl`, { data: parsedData })
      
      setData(response.data)
    } catch (err) {
      if (err.response) {
        setError(err.response.data.error || "Server responded with an error")
      } else {
        setError(err.message || "Failed to connect to the API. Is the backend running?")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-wrapper">
      <div className="animated-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="container">
        <div className="hero-section">
        <div className="hero-content">
          <h1>Graph Visualizer <span className="highlight">Pro</span></h1>
          <p>An intelligent engine for hierarchical data mapping, cycle detection, and structured graph analysis built for the SRM Full Stack Engineering Challenge.</p>
        </div>
      </div>

      <div className="input-section">
        <label htmlFor="nodes-input">Node Array (JSON format)</label>
        <p className="hint">Enter an array of strings representing parent-child relationships (e.g., "A-&gt;B")</p>
        
        <textarea 
          id="nodes-input" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder='["A->B", "B->C"]'
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Processing...' : 'Submit to /bfhl'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error: </strong> {error}
        </div>
      )}

      {data && (
        <div className="response-section">
          <h2>Analysis Results</h2>
          
          <div className="user-info">
            <div className="user-badge">
              <span>User ID</span>
              <strong>{data.user_id}</strong>
            </div>
            <div className="user-badge">
              <span>Email ID</span>
              <strong>{data.email_id}</strong>
            </div>
            <div className="user-badge">
              <span>Roll Number</span>
              <strong>{data.college_roll_number}</strong>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span>Total Non-Cyclic Trees</span>
              <strong>{data.summary.total_trees}</strong>
            </div>
            <div className="summary-card">
              <span>Total Cycles</span>
              <strong>{data.summary.total_cycles}</strong>
            </div>
            <div className="summary-card">
              <span>Largest Tree Root</span>
              <strong>{data.summary.largest_tree_root || "N/A"}</strong>
            </div>
          </div>
          
          <div className="issues-grid">
            {data.invalid_entries?.length > 0 && (
              <div className="issue-card invalid">
                <h3>⚠️ Invalid Entries ({data.invalid_entries.length})</h3>
                <div className="tags">
                  {data.invalid_entries.map((req, i) => (
                    <span key={i} className="tag">{req}</span>
                  ))}
                </div>
              </div>
            )}
            
            {data.duplicate_edges?.length > 0 && (
              <div className="issue-card duplicate">
                <h3>🔁 Duplicate Edges ({data.duplicate_edges.length})</h3>
                <div className="tags">
                  {data.duplicate_edges.map((req, i) => (
                    <span key={i} className="tag">{req}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <h3 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Generated Hierarchies</h3>
          <div className="tree-grid">
            {data.hierarchies.map((hier, idx) => (
              <div className="tree-card" key={idx}>
                <div className="tree-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <h3>Root <span className="tree-node-label root-label">{hier.root}</span></h3>
                    {hier.has_cycle && <span className="badge cycle">Cycle Detected</span>}
                  </div>
                  {!hier.has_cycle && (
                    <span className="badge depth">Depth <b>{hier.depth}</b></span>
                  )}
                </div>
                
                {hier.has_cycle ? (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    This group forms a closed cycle. No valid tree structure could be generated.
                  </p>
                ) : (
                  <div style={{ paddingLeft: '0.5rem' }}>
                    {Object.keys(hier.tree || {}).map(rootKey => (
                      <TreeNode key={rootKey} nodeName={rootKey} childrenObj={hier.tree[rootKey]} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {data.hierarchies.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>No valid hierarchies found.</p>
            )}
          </div>

          <h3 style={{ marginBottom: '1.5rem', marginTop: '3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
             Raw API Expected JSON Output
          </h3>
          <div className="json-container">
            <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default App
