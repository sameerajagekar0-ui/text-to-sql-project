import React, { useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

function App() {

  // ================= STATE =================
  const [dbConnected, setDbConnected] = useState(false);
  const [status, setStatus] = useState("");

  const [form, setForm] = useState({
    db_host: "localhost",
    db_user: "",
    db_password: "",
    db_name: ""
  });

  const [messages, setMessages] = useState([
    { text: "Connect database to start querying.", type: "bot" }
  ]);
  
  const [question, setQuestion] = useState("");
  const [sql, setSql] = useState("");
  const [result, setResult] = useState({ columns: [], rows: [] });
  const typeText = (text, callback) => {
  let i = 0;
  let current = "";

  const interval = setInterval(() => {
    current += text.charAt(i);
    callback(current);
    i++;

    if (i >= text.length) {
      clearInterval(interval);
    }
  }, 20);
};
  // ================= CONNECT DB =================
  const connectDB = async () => {
    setStatus("Connecting...");

    try {
      const res = await fetch(`${API_BASE}/connect-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error();

      setStatus("✅ Connected");
      setDbConnected(true);

      setMessages(prev => [
        ...prev,
        { text: "Database connected successfully.", type: "bot" }
      ]);

    } catch {
      setStatus("❌ Failed");
    }
  };

  // ================= ASK QUESTION =================
const askQuestion = async () => {
  if (!question || !dbConnected) return;

  // Add user message
  setMessages(prev => [...prev, { text: question, type: "user" }]);

  // API call
  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  // ✅ FIRST get data
  const data = await res.json();

  setSql(data.sql || "");

  // Add empty bot message
  setMessages(prev => {
    const newMessages = [...prev, { text: "", type: "bot" }];
    const msgIndex = newMessages.length - 1;

    // ✅ NOW use data safely
    typeText(data.answer || "No answer", (typedText) => {
      setMessages(current => {
        const updated = [...current];
        updated[msgIndex] = { text: typedText, type: "bot" };
        return updated;
      });
    });

    return newMessages;
  });

  setQuestion("");
};
  // ================= EXECUTE SQL =================
  const executeSQL = async () => {
    if (!sql) return;

    const res = await fetch(`${API_BASE}/execute-sql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql })
    });

    const data = await res.json();
    setResult(data);
  };

  // ================= UI =================
  return (
    <div className="app">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>🗄️ Database</h2>

        <input value={form.db_host}
          onChange={e => setForm({ ...form, db_host: e.target.value })} />

        <input placeholder="User"
          onChange={e => setForm({ ...form, db_user: e.target.value })} />

        <input type="password" placeholder="Password"
          onChange={e => setForm({ ...form, db_password: e.target.value })} />

        <input placeholder="Database"
          onChange={e => setForm({ ...form, db_name: e.target.value })} />

        <button onClick={connectDB}>Connect</button>

        <div className="status">{status}</div>
      </div>
      

      {/* CHAT */}
      <div className="chat">
        <div className="header">🤖 Text-to-SQL RAG ChatBot</div>

  <div className="chat-body">
  {messages.map((msg, i) => (
  <div key={i} className={`message ${msg.type}`}>
    {msg.text}

    {msg.type === "bot" && i === messages.length - 1 && (
      <span className="cursor"></span>
    )}
  </div>
))}
  
</div>

        <div className="footer">
          <input
            value={question}
            disabled={!dbConnected}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          />

          <button disabled={!dbConnected} onClick={askQuestion}>
            ➤
          </button>
        </div>
      </div>


      {/* SQL PANEL */}
      <div className="sql-panel">

        <div className="sql-header">
          🧾 Generated SQL Query
        </div>

        <div className="sql-body">

          <pre>{sql || "-- SQL will appear here --"}</pre>

          <div className="sql-actions">
            <button className="execute-btn" onClick={executeSQL}>
              ▶ Execute
            </button>

            <button className="copy-btn"
              onClick={() => navigator.clipboard.writeText(sql)}>
              📋 Copy
            </button>
          </div>

          {/* RESULT TABLE */}
          <div className="result-panel">
            <h3>📊 Query Result</h3>

            <div className="table-wrapper">
              {result.columns?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      {result.columns.map((c, i) => (
                        <th key={i}>{c}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : "No data"}
              
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

export default App;