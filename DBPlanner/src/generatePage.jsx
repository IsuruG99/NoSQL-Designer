import { useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SchemaContext } from "./context/SchemaContext.jsx";
import Panel from "./components/layout/basicPanel.jsx";

function Generate() {
  const [formData, setFormData] = useState({
    description: "A simple coffee shop",
    entities: "staff, orders, ingredients",
    constraints: "don't store OrderID"
  });

  const [inputMode, setInputMode] = useState("Detailed"); // or "Simplified"
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(null);
  const { schema, setSchema } = useContext(SchemaContext);
  const { entities, setEntities } = useContext(SchemaContext);
  const navigate = useNavigate();

  const handleInputChange = useCallback((field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }

    setLoading(true);
    setElapsedTime(0);
    setGenerated(false);
    setError(null);

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    try {
      const startTime = performance.now();

      const response = await fetch("http://127.0.0.1:8000/api/generate-schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          mode: inputMode, // New field added
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      console.log(`API call took ${endTime - startTime}ms`);

      if (data.schema) {
        console.log("Received schema:", data.schema);
        setSchema(data.schema);

        // --- FIX: Convert collections to entities array if needed ---
        if (data.schema.collections && typeof data.schema.collections === "object") {
          const entitiesArr = Object.values(data.schema.collections);
          setEntities(entitiesArr);
        } else if (Array.isArray(data.schema.entities)) {
          setEntities(data.schema.entities); // fallback for legacy
        }
        setGenerated(true);
      } else {
        throw new Error(data.detail || "Invalid schema format received");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message);
      setSchema(null);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }, [formData, setSchema]);

  const handleNavigate = useCallback(() => {
    navigate("/editor");
  }, [navigate]);

  return (
    <div className="flex flex-col items-center w-full h-full p-4">
      <div className="flex justify-end">
        <select
          value={inputMode}
          onChange={(e) => setInputMode(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded-lg"
        >
          <option value="Detailed">Detailed Input</option>
          <option value="Simplified">Simplified Sentence</option>
        </select>
      </div>
      <div className="w-full max-w-4xl space-y-4">
        {/* Form Inputs */}
        <div className="space-y-4">
          {inputMode === "Detailed" ? (
            <>
              <textarea
                value={formData.description}
                onChange={handleInputChange("description")}
                placeholder="Description *"
                className="w-full p-3 bg-gray-800 text-white rounded-lg h-24 resize-none"
                aria-label="Schema description"
                required
              />
              <input
                value={formData.entities}
                onChange={handleInputChange("entities")}
                placeholder="Entities (comma-separated, optional)"
                className="w-full p-3 bg-gray-800 text-white rounded-lg"
                aria-label="Entities"
              />
              <input
                value={formData.constraints}
                onChange={handleInputChange("constraints")}
                placeholder="Constraints (comma-separated, optional)"
                className="w-full p-3 bg-gray-800 text-white rounded-lg"
                aria-label="Constraints"
              />
            </>
          ) : (
            <div className="flex flex-wrap bg-gray-800 text-white p-3 rounded-lg">
              <span>A&nbsp;</span>
              <input
                type="text"
                value={formData.systemType}
                onChange={handleInputChange("description")}
                className="bg-gray-700 text-white px-2 py-1 rounded mx-1 min-w-[100px] flex-grow"
                placeholder="Reservation"
              />
              <span>&nbsp;System, requires a NoSQL database to store&nbsp;</span>
              <input
                type="text"
                value={formData.dataPurpose}
                className="bg-gray-700 text-white px-2 py-1 rounded mx-1 min-w-[100px] flex-grow"
                placeholder="customer bookings"
              />
              <span>.</span>
            </div>

          )}
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !formData.description.trim()}
            className={`w-full p-3 rounded-lg font-semibold border-b-4 transition-all ${loading || !formData.description.trim()
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 border-blue-800"
              }`}
            aria-busy={loading}
          >
            {loading ? `Generating... (${elapsedTime}s)` : "Generate"}
          </button>

          {error && (
            <div className="p-3 bg-red-900 text-white rounded-lg">
              Error: {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        <Panel
          schema={schema}
          loading={loading}
          elapsedTime={elapsedTime}
          className="w-full"
        />

        {generated && (
          <button
            onClick={handleNavigate}
            className="w-full mt-4 p-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold border-cyan-800 border-b-4 transition-colors"
          >
            Move to Detailed View →
          </button>
        )}
      </div>
    </div>
  );
}

export default Generate;