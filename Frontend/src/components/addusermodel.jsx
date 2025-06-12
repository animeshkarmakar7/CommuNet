import React, { useState } from "react";
import axios from "axios";

const AddUserModal = ({ existingUsers, onClose, onAdd }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const res = await axios.get(`http://localhost:5000/api/users/search?name=${search}`);
    const newUsers = res.data.filter((u) => !existingUsers.some((eu) => eu._id === u._id));
    setResults(newUsers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white rounded p-4 w-96">
        <h3 className="text-xl mb-2">Add New Chat</h3>
        <input
          className="w-full border rounded p-2 mb-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded mb-3" onClick={handleSearch}>
          Search
        </button>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((u) => (
            <div key={u._id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
              <span>{u.name}</span>
              <button onClick={() => onAdd(u)} className="text-green-600 font-semibold">
                Add
              </button>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="text-red-500 mt-4">
          Close
        </button>
      </div>
    </div>
  );
};

export default AddUserModal;
