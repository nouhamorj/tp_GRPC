const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mysql = require('mysql');

// Load the gRPC service definition
const PROTO_PATH = __dirname + '/my-service.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const serviceProto = grpc.loadPackageDefinition(packageDefinition).myservice;

// Database connection parameters
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db',
};

// Create a MySQL connection
const connection = mysql.createConnection(dbConfig);

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to the database');
});

// Define the gRPC service
const myService = {
  getRecord: (call, callback) => {
    const id = call.request.id;

    // Query the database to get the record with the specified ID
    connection.query('SELECT * FROM records WHERE id = ?', [id], (error, results) => {
      if (error) {
        console.error('Error executing database query:', error);
        callback(error);
        return;
      }

      // Check if a record was found
      if (results.length === 0) {
        callback({ code: grpc.status.NOT_FOUND, details: 'Record not found' });
        return;
      }

      // Return the data to the client
      const record = results[0];
      callback(null, { record: record.id });
    });
  },
};

// Create a gRPC server
const server = new grpc.Server();

// Add the gRPC service to the server
server.addService(serviceProto.MyService.service, myService);

// Bind and start the server
const PORT = process.env.PORT || 50051;
server.bindAsync(`127.0.0.1:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`Listening on port ${PORT}`);
  server.start();
});
