import express from 'express';
import { getAllCustomers, getCustomersByProduk, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Routes for customer management
router.get('/', verifyToken, getAllCustomers);
router.get('/produk/:produk_id', verifyToken, getCustomersByProduk);
router.get('/:id', verifyToken, getCustomerById);
router.post('/', verifyToken, createCustomer);
router.put('/:id', verifyToken, updateCustomer);
router.delete('/:id', verifyToken, deleteCustomer);

export default router;
