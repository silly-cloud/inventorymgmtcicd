const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js
const Products = require('../Models/Products'); // Assuming you have a Product model

// Mock the Product model - no actual database operations will be performed
jest.mock('../Models/Products');
describe('GET /products', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return all products with status 201', async () => {
        const mockProducts = [
            { _id: 'abc123', ProductName: 'Laptop', ProductPrice: 999, ProductBarcode: 111111111111 },
            { _id: 'def456', ProductName: 'Mouse', ProductPrice: 29, ProductBarcode: 222222222222 }
        ];
 
        Products.find.mockResolvedValue(mockProducts);

        const res = await request(app).get('/products');

        expect(res.status).toBe(201);
        expect(res.body).toHaveLength(2);
        expect(res.body[0].ProductName).toBe('Laptop');
        expect(Products.find).toHaveBeenCalledWith({});
    });

    it('should return empty array when no products exist', async () => {
        Products.find.mockResolvedValue([]);

        const res = await request(app).get('/products');

        expect(res.status).toBe(201);
        expect(res.body).toHaveLength(0);
    });

    it('should handle database errors', async () => {
        Products.find.mockRejectedValue(new Error('DB connection failed'));

        const res = await request(app).get('/products');

        expect(res.status).toBe(500);
    });
});

describe('GET /products/:id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a single product by ID', async () => {
        const mockProduct = {
            _id: 'abc123',
            ProductName: 'Laptop',
            ProductPrice: 999,
            ProductBarcode: 111111111111
        };

        Products.findById.mockResolvedValue(mockProduct);

        const res = await request(app).get('/products/abc123');

        expect(res.status).toBe(201);
        expect(res.body.ProductName).toBe('Laptop');
        expect(Products.findById).toHaveBeenCalledWith('abc123');
    });

    it('should return 500 on database error', async () => {
        Products.findById.mockRejectedValue(new Error('DB error'));

        const res = await request(app).get('/products/abc123');

        expect(res.status).toBe(500);
    });
});

describe('POST /insertproduct', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should insert a new product', async () => {
        Products.findOne.mockResolvedValue(null);

        const mockSaved = {
            _id: 'new123',
            ProductName: 'Keyboard',
            ProductPrice: 79,
            ProductBarcode: 333333333333
        };

        Products.prototype.save = jest.fn().mockResolvedValue(mockSaved);

        const res = await request(app)
            .post('/insertproduct')
            .send({
                ProductName: 'Keyboard',
                ProductPrice: 79,
                ProductBarcode: 333333333333
            });

        expect(res.status).toBe(201);
        expect(Products.findOne).toHaveBeenCalledWith({ ProductBarcode: 333333333333 });
    });

    it('should reject duplicate barcode with 422', async () => {
        Products.findOne.mockResolvedValue({ ProductBarcode: 333333333333 });

        const res = await request(app)
            .post('/insertproduct')
            .send({
                ProductName: 'Keyboard',
                ProductPrice: 79,
                ProductBarcode: 333333333333
            });

        expect(res.status).toBe(422);
    });

    it('should return 500 on database error', async () => {
        Products.findOne.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
            .post('/insertproduct')
            .send({
                ProductName: 'Keyboard',
                ProductPrice: 79,
                ProductBarcode: 333333333333
            });

        expect(res.status).toBe(500);
    });
});

describe('PUT /updateproduct/:id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should update a product', async () => {
        const mockUpdated = {
            _id: 'abc123',
            ProductName: 'Laptop Pro',
            ProductPrice: 1299,
            ProductBarcode: 111111111111
        };

        Products.findByIdAndUpdate.mockResolvedValue(mockUpdated);

        const res = await request(app)
            .put('/updateproduct/abc123')
            .send({
                ProductName: 'Laptop Pro',
                ProductPrice: 1299,
                ProductBarcode: 111111111111
            });

        expect(res.status).toBe(201);
        expect(res.body.ProductName).toBe('Laptop Pro');
        expect(Products.findByIdAndUpdate).toHaveBeenCalledWith(
            'abc123',
            { ProductName: 'Laptop Pro', ProductPrice: 1299, ProductBarcode: 111111111111 },
            { new: true }
        );
    });

    it('should return 500 on database error', async () => {
        Products.findByIdAndUpdate.mockRejectedValue(new Error('DB error'));

        const res = await request(app)
            .put('/updateproduct/abc123')
            .send({
                ProductName: 'Laptop Pro',
                ProductPrice: 1299,
                ProductBarcode: 111111111111
            });

        expect(res.status).toBe(500);
    });
});

describe('DELETE /deleteproduct/:id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a product', async () => {
        const mockDeleted = {
            _id: 'abc123',
            ProductName: 'Laptop',
            ProductPrice: 999,
            ProductBarcode: 111111111111
        };

        Products.findByIdAndDelete.mockResolvedValue(mockDeleted);

        const res = await request(app).delete('/deleteproduct/abc123');

        expect(res.status).toBe(201);
        expect(Products.findByIdAndDelete).toHaveBeenCalledWith('abc123');
    });

    it('should return 500 on database error', async () => {
        Products.findByIdAndDelete.mockRejectedValue(new Error('DB error'));

        const res = await request(app).delete('/deleteproduct/abc123');

        expect(res.status).toBe(500);
    });
});