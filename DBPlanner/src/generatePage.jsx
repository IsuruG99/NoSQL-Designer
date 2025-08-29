import { useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SchemaContext } from "./context/SchemaContext.jsx";
import Panel from "./components/layout/basicPanel.jsx";

function Generate() {
  const [detailedData, setDetailedData] = useState({
    description: "",
    entities: "",
    constraints: ""
  });
  const [simplifiedData, setSimplifiedData] = useState({
    systemType: "",
    dataPurpose: ""
  });
  const [uploadFile, setUploadFile] = useState(null);


  const [inputMode, setInputMode] = useState("Detailed");
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(null);
  const { schema, setSchema } = useContext(SchemaContext);
  const { entities, setEntities } = useContext(SchemaContext);
  const navigate = useNavigate();

  const handleDetailedChange = (field) => (e) => {
    setDetailedData(prev => ({ ...prev, [field]: e.target.value }));
  };
  const handleSimplifiedChange = (field) => (e) => {
    setSimplifiedData(prev => ({ ...prev, [field]: e.target.value }));
  };


  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setElapsedTime(0);
    setGenerated(false);
    setError(null);

    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);

    const handleSchemaResponse = (data) => {
      if (data.schema) {
        setSchema(data.schema);
        if (data.schema.collections && typeof data.schema.collections === "object") {
          setEntities(Object.values(data.schema.collections));
        } else if (Array.isArray(data.schema.entities)) {
          setEntities(data.schema.entities);
        }
        setGenerated(true);
      } else {
        throw new Error(data.detail || "Invalid schema format received");
      }
    };

    try {
      if (inputMode === "Upload") {
        if (!uploadFile) throw new Error("Please upload a file");

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target.result;
            const response = await fetch("http://127.0.0.1:8000/api/convert-schema", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileContent: content, filename: uploadFile.name })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            handleSchemaResponse(data);
          } catch (err) {
            setError(err.message);
            setSchema(null);
          } finally {
            clearInterval(timer);
            setLoading(false);
          }
        };
        reader.readAsText(uploadFile);
        return;
      }

      let payload;
      if (inputMode === "Simplified") {
        const { systemType, dataPurpose } = simplifiedData;
        if (!systemType.trim() || !dataPurpose.trim()) {
          throw new Error("Both fields are required for Simplified input");
        }
        payload = {
          systemType,
          dataPurpose,
          mode: "Simplified"
        };
      } else if (inputMode === "Detailed") {
        const { description, entities, constraints } = detailedData;
        if (!description.trim()) {
          throw new Error("Description is required for Detailed input");
        }
        payload = {
          description,
          entities,
          constraints,
          mode: "Detailed"
        };
      }

      const response = await fetch("http://127.0.0.1:8000/api/generate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      handleSchemaResponse(data);
    } catch (err) {
      setError(err.message);
      setSchema(null);
    } finally {
      if (inputMode !== "Upload") {
        clearInterval(timer);
        setLoading(false);
      }
    }
  }, [inputMode, detailedData, simplifiedData, uploadFile, setSchema, setEntities]);


  const handleNavigate = useCallback(() => navigate("/editor"), [navigate]);

  return (
   <div className="flex flex-col items-center w-full h-full p-4">
  <div className="w-full max-w-4xl">
    <div className="flex space-x-2 mb-4 justify-center">
      {["Simplified", "Detailed", "Upload"].map(mode => (
        <button
          key={mode}
          onClick={() => setInputMode(mode)}
          className={`px-4 py-2 rounded-lg font-semibold border-b-4 transition-all ${inputMode === mode
            ? "bg-blue-600 border-blue-800 text-white"
            : "bg-gray-700 border-gray-800 text-gray-300 hover:bg-gray-600"}`}
        >
          {mode}
        </button>
      ))}
    </div>

    <div className="space-y-4">
      <div className="p-3 bg-gray-800 text-white rounded-lg border-l-4 border-yellow-500 text-sm">
        <p>
          <span className="font-semibold">Privacy Notice:</span> All inputs (text or uploaded files) are sent to the Gemini API for processing. Avoid including sensitive or personal information.
        </p>
      </div>

      {inputMode === "Detailed" && (
        <>
          <textarea
            value={detailedData.description}
            onChange={handleDetailedChange("description")}
            placeholder="Describe your database requirements in detail... (e.g., A database for a restaurant to manage staff, orders, ingredients...)"
            className="w-full p-3 bg-gray-800 text-white rounded-lg h-24 resize-none"
            required
          />
          <input
            value={detailedData.entities}
            onChange={handleDetailedChange("entities")}
            placeholder="(Optional) Main categories in your database... (e.g., staff, orders, ingredients)"
            className="w-full p-3 bg-gray-800 text-white rounded-lg"
          />
          <input
            value={detailedData.constraints}
            onChange={handleDetailedChange("constraints")}
            placeholder="(Optional) Any specific rules or constraints... (e.g., don't store OrderID, ingredients can be in multiple orders)"
            className="w-full p-3 bg-gray-800 text-white rounded-lg"
          />
        </>
      )}

      {inputMode === "Simplified" && (
        <div className="flex flex-wrap bg-gray-800 text-white p-3 rounded-lg">
          <span>&nbsp;Create a NoSQL database for a&nbsp;</span>
          <input
            type="text"
            value={simplifiedData.systemType}
            onChange={handleSimplifiedChange("systemType")}
            className="bg-gray-700 text-white px-2 py-1 rounded mx-1 min-w-[100px] flex-grow"
            placeholder="Tourist Hotel"
          />
          <span>&nbsp;system to manage&nbsp;</span>
          <input
            type="text"
            value={simplifiedData.dataPurpose}
            onChange={handleSimplifiedChange("dataPurpose")}
            className="bg-gray-700 text-white px-2 py-1 rounded mx-1 min-w-[100px] flex-grow"
            placeholder="bookings, customers, rooms"
          />
          <span>.</span>
        </div>
      )}

      {inputMode === "Upload" && (
        <div className="bg-gray-800 p-3 rounded-lg text-white space-y-2">
          <p className="text-sm">Upload your schema file (.json, .cql, .bson, sql)</p>
          <p className="text-sm">(.txt not supported)</p>
          <input
            type="file"
            accept=".json,.cql,.bson,.sql"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="w-full text-white bg-gray-700 p-2 rounded-lg"
          />
        </div>
      )}
    </div>

    <div className="flex flex-col space-y-3 mt-6">
      <button
        onClick={handleGenerate}
        disabled={loading || !detailedData.description.trim()}
        className={`w-full p-3 rounded-lg font-semibold border-b-4 transition-all ${loading || !detailedData.description.trim()
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 border-blue-800"}`}
      >
        {loading ? `Generating... (${elapsedTime}s)` : "Generate"}
      </button>

      {error && (
        <div className="p-3 bg-red-900 text-white rounded-lg">
          Error: {error}
        </div>
      )}

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
</div>
  );
}

export default Generate;