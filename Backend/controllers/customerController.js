import db from '../config/db.js';
import Customer from '../models/Customer.js';

// Get all customers
export const getAllCustomers = (req, res) => {
  const query = 'SELECT * FROM customers ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    const customers = results.map(row => new Customer(row).toJSON());
    res.json(customers);
  });
};

// Get customers by produk_id
export const getCustomersByProduk = (req, res) => {
  const { produk_id } = req.params;
  const query = 'SELECT * FROM customers WHERE produk_id = ? ORDER BY created_at DESC';
  db.query(query, [produk_id], (err, results) => {
    if (err) {
      console.error('Error fetching customers by produk:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    const customers = results.map(row => new Customer(row).toJSON());
    res.json(customers);
  });
};

// Get customer by ID
export const getCustomerById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM customers WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching customer:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const customer = new Customer(results[0]).toJSON();
    res.json(customer);
  });
};

// Create new customer
export const createCustomer = (req, res) => {
  const { nama, produk_id, alamat } = req.body;

  // Validate input
  const errors = Customer.validate({ nama, produk_id, alamat });
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const query = 'INSERT INTO customers (nama, produk_id, alamat) VALUES (?, ?, ?)';
  db.query(query, [nama, produk_id, alamat], (err, result) => {
    if (err) {
      console.error('Error creating customer:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(201).json({
      message: 'Customer created successfully',
      id: result.insertId
    });
  });
};

// Update customer
export const updateCustomer = (req, res) => {
  const { id } = req.params;
  const { nama, produk_id, alamat } = req.body;

  // Validate input
  const errors = Customer.validate({ nama, produk_id, alamat });
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const query = 'UPDATE customers SET nama = ?, produk_id = ?, alamat = ? WHERE id = ?';
  db.query(query, [nama, produk_id, alamat, id], (err, result) => {
    if (err) {
      console.error('Error updating customer:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer updated successfully' });
  });
};

// Delete customer
export const deleteCustomer = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM customers WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
};
