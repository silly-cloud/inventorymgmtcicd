import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom';

export default function InsertProduct() {
    const [productName, setProductName] = useState("");
    const [productPrice, setProductPrice] = useState();
    const [productBarcode, setProductBarcode] = useState();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const setName = (e) => setProductName(e.target.value);
    const setPrice = (e) => setProductPrice(e.target.value);

    const setBarcode = (e) => {
        const value = e.target.value.slice(0, 12);
        setProductBarcode(value);
    };

    const addProduct = async (e) => {
        e.preventDefault();

        if (!productName || !productPrice || !productBarcode) {
            setError("*Please fill in all the required fields.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/insertproduct", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ProductName: productName,
                    ProductPrice: productPrice,
                    ProductBarcode: productBarcode
                })
            });

            await res.json();

            if (res.status === 201) {
                alert("Data Inserted");
                setProductName("");
                setProductPrice(0);
                setProductBarcode(0);
                navigate('/products');
            } else if (res.status === 422) {
                alert("Product is already added with that barcode.");
            } else {
                setError("Something went wrong.");
            }
        } catch (err) {
            setError("An error occurred.");
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='container-fluid p-5'>
            <h1>Enter Product Information</h1>

            <div className="mt-5 col-lg-6 fs-4">
                <label className="form-label fw-bold">Product Name</label>
                <input
                    type="text"
                    onChange={setName}
                    value={productName}
                    className="form-control fs-5"
                    required
                />
            </div>

            <div className="mt-3 col-lg-6 fs-4">
                <label className="form-label fw-bold">Product Price</label>
                <input
                    type="number"
                    onChange={setPrice}
                    value={productPrice}
                    className="form-control fs-5"
                    required
                />
            </div>

            <div className="mt-3 mb-5 col-lg-6 fs-4">
                <label className="form-label fw-bold">Product Barcode</label>
                <input
                    type="number"
                    onChange={setBarcode}
                    value={productBarcode}
                    className="form-control fs-5"
                    required
                />
            </div>

            <div className='d-flex justify-content-center col-lg-6'>
                <NavLink to="/products" className='btn btn-primary me-5 fs-4'>
                    Cancel
                </NavLink>
                <button
                    onClick={addProduct}
                    className="btn btn-primary fs-4"
                    disabled={loading}
                >
                    {loading ? 'Inserting...' : 'Insert'}
                </button>
            </div>

            {error && (
                <div className="text-danger mt-3 fs-5 fw-bold">
                    {error}
                </div>
            )}
        </div>
    );
}

