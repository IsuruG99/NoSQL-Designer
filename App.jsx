import React, { useState } from 'react';

function App() {
  const [input, setInput] = useState({ description: '', entities: '', tasks: '', constraints: '' });
  const [cards, setCards] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async () => {
    const response = await fetch('http://localhost:8000/api/generate-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await response.json();
    setCards(data.schema);  // assuming the API returns data in a 'schema' field
  };

  return (
    <div>
      <h1>DrawYourDB</h1>
      <div>
        <label>Description</label>
        <input type="text" name="description" value={input.description} onChange={handleInputChange} />
      </div>
      <div>
        <label>Entities</label>
        <input type="text" name="entities" value={input.entities} onChange={handleInputChange} />
      </div>
      <div>
        <label>Tasks</label>
        <input type="text" name="tasks" value={input.tasks} onChange={handleInputChange} />
      </div>
      <div>
        <label>Constraints</label>
        <input type="text" name="constraints" value={input.constraints} onChange={handleInputChange} />
      </div>
      <button onClick={handleSubmit}>Generate Schema</button>

      <div className="cards">
        {cards.map((card, index) => (
          <div key={index} className="card">
            <h3>{card.title}</h3>
            <ul>
              {Object.entries(card.subAttributes).map(([key, value]) => (
                <li key={key}>{key}: {value}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

