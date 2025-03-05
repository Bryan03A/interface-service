const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuración de Elasticsearch
const elasticsearchURL = 'https://12ec27c893754239a19725b8623fb4ab.us-central1.gcp.cloud.es.io:443';
const elasticsearchUsername = 'elastic'; // Usuario de autenticación
const elasticsearchPassword = 'FZpk75ia4U0uCfC0T3WcAzAt'; // Contraseña de autenticación

// Ruta para búsqueda simple
router.get('/', async (req, res) => {
    console.log("Buscando con parámetros:", req.query);
    
    const query = req.query.q ? req.query.q.toLowerCase() : '';  // Convertir a minúsculas

    try {
        // Consulta simplificada: solo búsqueda en el campo 'name' y 'description'
        const esQuery = {
            query: {
                bool: {
                    should: [
                        { match: { name: query } },  // Buscar coincidencias exactas en 'name'
                        { match: { description: { query, fuzziness: "AUTO" } } }  // Búsqueda difusa en 'description'
                    ]
                }
            }
        };

        // Realizar la consulta a Elasticsearch
        const response = await axios.post(`${elasticsearchURL}/models/_search`, esQuery, {
            headers: { 'Content-Type': 'application/json' },
            auth: {
                username: elasticsearchUsername,
                password: elasticsearchPassword
            }
        });

        // Verificar si la respuesta contiene resultados
        if (response.data.hits && response.data.hits.hits) {
            console.log("Resultados encontrados:", response.data.hits.hits);
            // Enviar los resultados al cliente
            res.json(response.data.hits.hits);
        } else {
            // Si no hay resultados
            console.log("No se encontraron resultados.");
            res.status(404).send('No se encontraron modelos.');
        }
    } catch (error) {
        console.error('Error en la búsqueda:', error.response?.data || error.message);
        res.status(500).send('Error al realizar la búsqueda');
    }
});

module.exports = router;