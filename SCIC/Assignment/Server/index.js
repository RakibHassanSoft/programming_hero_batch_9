const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;


// Use cors middleware
app.use(cors());

// Pagination middleware
const paginate = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Attach pagination parameters to the request object
        req.pagination = { skip, limit, page };

        next(); // Continue to the route handler
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Rakib:rakib111@cluster0.drqortc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });


        // Database and collection references
        const database = client.db('SCIC');
        const products = database.collection('products');

        app.get("/allProducts", async (req, res) => {
            try {
                const allData = await products.find().toArray()
                res.send(allData)
            } catch (error) {
                res.josn({ "error": error.message })
            }
        })

   
        // Pagination route
        app.get('/pagination', async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;
        
                // Fetch products with pagination
                const collection = await products.find().skip(skip).limit(limit).toArray();
                const totalCount = await products.countDocuments();
        
                res.json({
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    products: collection,
                });
            } catch (error) {
                console.error('Error fetching paginated products:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        });
        
        


        //filterring 
        app.get("/filter-products", async (req, res) => {
            // console.log(req.query)
            //http://localhost:3000/filter-products?category=Electronics
            try {
                const { brand, category, minPrice, maxPrice } = req.query;

                // Convert price range to integers
                const min = parseInt(minPrice) || 0;
                const max = parseInt(maxPrice) || 2000;

                // Fetch all products
                const allData = await products.find().toArray();

                // Filter products based on query parameters
                let filteredProducts = allData;

                if (brand) {
                    filteredProducts = filteredProducts.filter(product => product.brand.toLowerCase() === brand.toLowerCase());
                }
                if (category) {
                    filteredProducts = filteredProducts.filter(product => product.category.toLowerCase() === category.toLowerCase());
                }
                filteredProducts = filteredProducts.filter(product => product.price >= min && product.price <= max);

                res.json({
                    count: filteredProducts.length,
                    products: filteredProducts,
                });
            } catch (error) {
                res.json({ "error": error.message });
            }
        });

        // search products
        app.get('/search-products', async (req, res) => {
            //http://localhost:3000/search-products?q=so
            // console.log(req.query)
            try {
                const query = req.query.q || '';
                const allProducts = await products.find().toArray();

                const filteredProducts = allProducts.filter(product =>
                    product.name?.toLowerCase().includes(query.toLowerCase()) ||
                    product.brand?.toLowerCase().includes(query.toLowerCase()) ||
                    product.category?.toLowerCase().includes(query.toLowerCase())
                );

                res.json(filteredProducts);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });




        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// Define a route to get the product data
app.get('/products', (req, res) => {
    res.json(products);
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
