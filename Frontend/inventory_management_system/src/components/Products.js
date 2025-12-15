import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Products() {

    const [productData, setProductData] = useState([]);

    useEffect(() => {
        getProducts();
    }, []);

    const getProducts = async () => {
        try {
            const res = await fetch("/products");

            const data = await res.json();

            if (res.status === 201) {
                setProductData(data);
            } else {
                console.log("Something went wrong.");
            }
        } catch (err) {
            console.log(err);
        }
    };

    const deleteProduct = async (id) => {
        try {
            const response = await fetch(`/deleteproduct/${id}`, {
                method: "DELETE"
            });

            const deletedata = await response.json();

            if (response.status === 422 || !deletedata) {
                console.log("Error deleting product");
            } else {
                console.log("Product deleted");
                getProducts();
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className='container-fluid p-5'>
            <h1>Products Inventory</h1>

            <div className='add_button'>
                <NavLink to="/insertproduct" className='btn btn-primary fs-5'>
                    + Add New Product
                </NavLink>
            </div>

            <div className="overflow-auto mt-3" style={{ maxHeight: "38rem" }}>
                <table className="table table-striped table-hover mt-3 fs-5">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Product Name</th>
                            <th>Product Price</th>
                            <th>Product Barcode</th>
                            <th>Update</th>
                            <th>Delete</th>
                        </tr>
                    </thead>

                    <tbody>
                        {productData.map((element, id) => (
                            <tr key={element._id}>
                                <th>{id + 1}</th>
                                <td>{element.ProductName}</td>
                                <td>{element.ProductPrice}</td>
                                <td>{element.ProductBarcode}</td>
                                <td>
                                    <NavLink
                                        to={`/updateproduct/${element._id}`}
                                        className="btn btn-primary">
                                        Update
                                    </NavLink>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => deleteProduct(element._id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>
        </div>
    );
}

