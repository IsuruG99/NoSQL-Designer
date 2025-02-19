import { useState } from "react";

function App() {
  const [description, setDescription] = useState("");
  const [entities, setEntities] = useState("");
  const [constraints, setConstraints] = useState("");
  const [schema, setSchema] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleGenerate = async () => {
    setLoading(true);
    setElapsedTime(0);

    // Start a timer
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, entities, constraints }),
      });

      const data = await response.json();
      setSchema(data.schema);
    } catch (error) {
      setSchema("Error: Failed to fetch schema.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>NoSQL Schema Generator</h1>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <input value={entities} onChange={(e) => setEntities(e.target.value)} placeholder="Entities (comma-separated)" />
      <input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Constraints" />
      <button onClick={handleGenerate} disabled={loading}>Generate</button>

      {loading ? <p>⏳ Waiting for backend... {elapsedTime} sec elapsed</p> : <pre>{schema}</pre>}
    </div>
  );
}

export default App;
