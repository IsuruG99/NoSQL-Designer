import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SchemaContext } from "./SchemaContext.jsx";
import Panel from "./basicPanel.jsx";

function Generate() {
  const [description, setDescription] = useState("");
  const [entities, setEntities] = useState("");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generated, setGenerated] = useState(false);
  const { schema, setSchema } = useContext(SchemaContext);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true);
    setElapsedTime(0);
    setGenerated(false);

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
      setGenerated(true);
    } catch (error) {
      setSchema("Error: Failed to fetch schema.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full ">
      <div className="input w-full max-w-3xl space-y-4">
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Description" 
          className="w-full p-3 bg-gray-800 text-white rounded-lg h-24 resize-none overflow-y-auto"
        />
        <input 
          value={entities} 
          onChange={(e) => setEntities(e.target.value)} 
          placeholder="Entities (comma-separated)" 
          className="w-full p-3 bg-gray-800 text-white rounded-lg"
        />
        <input 
          value={constraints} 
          onChange={(e) => setConstraints(e.target.value)} 
          placeholder="Constraints (comma-separated)" 
          className="w-full p-3 bg-gray-800 text-white rounded-lg"
        />
        <button 
          onClick={handleGenerate} 
          disabled={loading} 
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          Generate
        </button>
      </div>

      <Panel schema={schema} loading={loading} elapsedTime={elapsedTime} className="w-full" />
      {generated && (
        <button 
          onClick={() => navigate("/editor")}
          className="mt-4 p-3 bg-cyan-600 hover:bg-cyan-600 rounded-lg font-semibold"
        >
          Move to Detailed View?
        </button>
      )}
    </div>
  );
}

export default Generate;