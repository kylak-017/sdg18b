
const express = require('express');
const path = require('path'); //handles file calling and retrieving
const cors = require('cors');
const admin = require("firebase-admin");
const app = express();

const PORT = 3000;




// Initialize Firebase Admin SDK (do this ONCE at the start of your server)
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
async function getServiceAccountKey() {
  const name = 'projects/gems-350b8/secrets/my-service-account-key/versions/latest';
  const [version] = await client.accessSecretVersion({ name }); //get all the version of the secret so far
  console.log("Accessed Secret Manager version:", version.name);
  
  const payload = version.payload.data.toString('utf8');
  const serviceAccount = JSON.parse(payload); //get the actual secret from the version presented

   admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://xxxxx.firebaseio.com' // Replace with your database URL
  });

  console.log("Firebase Admin initialized using Secret Manager.");

}

getServiceAccountKey()
.then(() => {





//API: The "menu" of the backend kitchen. Brings the necessary files that the website asks for and derives it from the public source folder
    //Responsible for reactivity/responsiveness of a web application
    //Usually active as HTTP ports, so that the kitchen knows from which client they have to get orders from and serve obejcts to. 
    
    //USE: About using session
    const corsOptions = {
      origin: 'http://127.0.0.1:5174', // Replace with your frontend's origin
      methods: ['GET', 'POST'], // Specify allowed methods
      allowedHeaders: ['Content-Type', 'Authorization'], // Include 'Authorization'
    };

    

    app.use(cors(corsOptions));    
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public'))); //retrieves all necessary files from public
    app.use('/public', express.static(path.join(__dirname, 'public')));

    app.use((req, res, next) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        res.setHeader("Cross-Origin-Resource-Policy", "same-site");
        next();
      });

    

    //GET: Get the data from the data kitchen and serve it up
    app.get('/', (req,res)=>{
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.get('/api/data', (req, res) => { //req from client, res to display --> '/api/data' is the fetch codename
        res.json({ message: 'Hello from the backend!' }); // Respond with JSON data.
    });

    app.get('/api/model', (req,res) => {
        res.sendFile(path.join(__dirname, 'public/models/bottle.gltf'));
    });

    /*
    app.get('/login.html', (req,res) =>{
        res.sendFile(path.join(__dirname, 'public/success.html'));
    });
    */

   

    //POST: Get certain user input and save it as a dish/ingredient in the data kitchen
    app.post('/api/save-scene', express.json(), (req, res) => { 
        const sceneData = req.body; // Get the scene data from the request
        console.log('Scene data saved:', sceneData);
        res.status(200).json({ message: 'Scene data saved successfully!' });
    });

      

    app.post('/verify-token', async (req, res) => {
      const idToken = req.headers.authorization?.split('Bearer ')[1]; // Or req.headers['x-access-token']
    
      if (!idToken) {
        return res.status(401).json({ error: 'No token provided' });
      }
    
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // Token is valid.
        // decodedToken contains user information (uid, email, etc.)
        console.log("Decoded Token:", decodedToken);
    
        // Access user data from the database
        const userRecord = await admin.auth().getUser(decodedToken.uid)
        console.log('userRecord: ', userRecord)
    
        // You can now access user data and grant access to resources
        res.json({ message: 'Token is valid', user: decodedToken, userData: userRecord }); // or some data
      } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({ error: 'Unauthorized', details: error.message });
      }
    });
    

    app.listen(PORT, () => {
        console.log(`Server running at http://127.0.0.1:${PORT}`);
    });

    

    
    });