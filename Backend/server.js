const connectToMongo = require('./db');
const app = require('./app');

const port = process.env.PORT || 3001;

connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
});