const express = require('express');
const multer = require('multer');
const axios = require('axios');
const router = express.Router();

// Configuración de multer para manejar el archivo
const upload = multer({ dest: 'uploads/' }); // Se guarda temporalmente en el directorio 'uploads/'

// URL of the catalog-service microservice
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://34.200.3.211:5003';
// URL of the catalog-del-service microservice
const CATALOG_DEL_SERVICE_URL = process.env.CATALOG_DEL_SERVICE_URL || 'http://localhost:5011';
// URL del microservicio de imágenes
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 'http://34.200.3.211:5009';  // Cambia a la URL de tu servicio


// Helper function to handle requests to the microservice
const fetchFromCatalogService = async (method, url, data = null, token = null) => {
    try {
        const config = { method, url, data, headers: {} };
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`Error in catalog-service request: ${error.message}`);
        return { success: false, error: error.response?.data || 'Unknown error' };
    }
};

// Helper function para manejar las solicitudes al microservicio de imágenes
const fetchFromImageService = async (method, url, data = null, token = null) => {
    try {
        const config = { method, url, data, headers: {} };
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`Error in image-service request: ${error.message}`);
        return { success: false, error: error.response?.data || 'Unknown error' };
    }
};

// Route to get all models
router.get('/models', async (req, res) => {
    const { success, data, error } = await fetchFromCatalogService('get', `${CATALOG_SERVICE_URL}/models`);
    if (success) {
        res.status(200).json(data);
    } else {
        res.status(500).json({ message: 'Error fetching models', error });
    }
});

// Route to get models by user ID
router.get('/models/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { success, data, error } = await fetchFromCatalogService('get', `${CATALOG_SERVICE_URL}/models/user/${userId}`);
    if (success) {
        res.status(200).json(data);
    } else {
        res.status(500).json({ message: 'Error fetching user models', error });
    }
});

// Route to add a new model
router.post('/models', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];  // Extract token from headers
    const { success, data, error } = await fetchFromCatalogService('post', `${CATALOG_SERVICE_URL}/models`, req.body, token);
    if (success) {
        res.status(201).json(data);
    } else {
        res.status(500).json({ message: 'Error adding model', error });
    }
});

// Route to get a specific model by name
router.get('/models/:modelName', async (req, res) => {
    const modelName = req.params.modelName;
    const { success, data, error } = await fetchFromCatalogService('get', `${CATALOG_SERVICE_URL}/models/${modelName}`);
    if (success) {
        res.status(200).json(data);
    } else {
        res.status(404).json({ message: 'Model not found', error });
    }
});

// Route to get a specific model by ID
router.get('/models/id/:modelId', async (req, res) => {
    const modelId = req.params.modelId;  // Cambiar a modelId
    const { success, data, error } = await fetchFromCatalogService('get', `${CATALOG_SERVICE_URL}/models/id/${modelId}`);
    if (success) {
        res.status(200).json(data);
    } else {
        res.status(404).json({ message: 'Model not found', error });
    }
});

// Route to delete a model
router.delete('/models/:modelName', async (req, res) => {
    const modelName = req.params.modelName;
    const token = req.headers.authorization?.split(" ")[1];  // Extract token from headers
    const { success, data, error } = await fetchFromCatalogService('delete', `${CATALOG_DEL_SERVICE_URL}/models/${modelName}`, null, token);
    if (success) {
        res.status(200).json(data);
    } else {
        res.status(404).json({ message: 'Error deleting model', error });
    }
});

// Route to delete a model by ID
router.delete('/models/id/:modelId', async (req, res) => {  // Cambiar ruta a usar modelId
    const modelId = req.params.modelId;  // Cambiar a modelId
    const token = req.headers.authorization?.split(" ")[1];  // Extract token from headers
    const { success, data, error } = await fetchFromCatalogService('delete', `${CATALOG_DEL_SERVICE_URL}/models/id/${modelId}`, null, token);
    if (success) {
        res.status(200).json(data);
    } else {
        res.status(404).json({ message: 'Error deleting model', error });
    }
});

// Ruta para subir imagen
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const modelId = req.body.model_id;
        if (!req.file || !modelId) {
            return res.status(400).json({ message: 'Image file and model_id are required' });
        }

        // Lee el archivo de la imagen y envíalo al microservicio de imágenes
        const imageFile = req.file;
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imageFile.path));
        formData.append('model_id', modelId);

        // Enviar la imagen al microservicio de imágenes
        const { success, data, error } = await fetchFromImageService('post', `${IMAGE_SERVICE_URL}/upload`, formData);
        if (success) {
            res.status(200).json({ message: 'Image uploaded successfully', image_data: data });
        } else {
            res.status(500).json({ message: 'Failed to upload image', error });
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }
});

module.exports = router;