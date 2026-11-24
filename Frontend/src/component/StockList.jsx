import React, { useState } from 'react';

function StockList({ items, onUpdateSuccess }) {
  // 1. State to manage which item is currently being edited
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // 2. Open form with existing values
  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData(item); // Load existing values into form fields
  };

  // 3. Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 4. Submit updated data to Backend API
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/stocks/${editingItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        onUpdateSuccess(updatedData); // Refresh or update UI
        setEditingItem(null); // Close modal/form
      } else {
        console.error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  return (
    <div>
      {/* Stock Items List */}
      <ul>
        {items.map((item) => (
          <li key={item._id}>
            {item.name} - ${item.price} (Qty: {item.quantity})
            <button onClick={() => handleEditClick(item)}>Update</button>
          </li>
        ))}
      </ul>

      {/* Conditional Edit Form / Modal */}
      {editingItem && (
        <form onSubmit={handleUpdateSubmit} className="edit-modal">
          <h3>Edit Item</h3>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
          />
          <input
            type="number"
            name="price"
            value={formData.price || ''}
            onChange={handleChange}
          />
          <input
            type="number"
            name="quantity"
            value={formData.quantity || ''}
            onChange={handleChange}
          />
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setEditingItem(null)}>Cancel</button>
        </form>
      )}
    </div>
  );
}

export default StockList;