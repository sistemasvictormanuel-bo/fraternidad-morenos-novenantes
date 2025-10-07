// server.js

const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors()); 
// Configuración de la base de datos (¡Actualiza con tus credenciales!)
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bdtesthuella'
});

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a MySQL: ' + err.stack);
        return;
    }
    console.log('Conexión exitosa a MySQL.');
});

// Middleware para procesar JSON y datos grandes (necesario para la imagen Base64)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Directorio para guardar las huellas (asegúrate de que este directorio exista)
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'huellas');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ----------------------------------------------------
// ENDPOINT: GUARDAR HUELLA
// ----------------------------------------------------
app.post('/api/guardar_huella', (req, res) => {
    // 1. Obtener datos del cuerpo de la petición
    const { fraterno_id, image_base64 } = req.body;

    if (!fraterno_id || !image_base64) {
        return res.status(400).send({ success: false, message: 'Faltan fraterno_id o datos de la imagen.' });
    }

    // El Base64 viene con el prefijo 'data:image/png;base64,...'
    const base64Data = image_base64.replace(/^data:image\/png;base64,/, "");

    // Generar un nombre de archivo único
    const fileName = `huella_${fraterno_id}_${Date.now()}.png`;
    const fullPath = path.join(UPLOADS_DIR, fileName);
    const relativePath = `/uploads/huellas/${fileName}`; // Ruta que guardaremos en DB

    // 2. GUARDAR EL ARCHIVO PNG EN EL SERVIDOR
    fs.writeFile(fullPath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error al guardar el archivo:', err);
            return res.status(500).send({ success: false, message: 'Error al guardar la imagen en el servidor.' });
        }

        // 3. GUARDAR LA RUTA EN LA BASE DE DATOS
        const sql = 'INSERT INTO images (fraterno_id, image_path) VALUES (?, ?)';
        
        connection.query(sql, [fraterno_id, relativePath], (dbErr, result) => {
            if (dbErr) {
                console.error('Error al insertar en DB:', dbErr.message);
                // Opcional: intentar eliminar el archivo si falla la DB
                fs.unlink(fullPath, () => {}); 
                return res.status(500).send({ success: false, message: 'Error al registrar la imagen en la base de datos.' });
            }
            
            res.status(201).send({ 
                success: true, 
                message: 'Huella guardada exitosamente.',
                id: result.insertId,
                path: relativePath
            });
        });
    });
});

// ----------------------------------------------------
// ENDPOINT: OBTENER HUELLA (Ejemplo)
// ----------------------------------------------------
app.get('/api/obtener_huella/:fraterno_id', (req, res) => {
    const { fraterno_id } = req.params;
    
    // Solo toma la imagen más reciente para ese fraterno
    const sql = 'SELECT image_path, created_at FROM images WHERE fraterno_id = ? ORDER BY created_at DESC LIMIT 1';

    connection.query(sql, [fraterno_id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err.message);
            return res.status(500).send({ success: false, message: 'Error al consultar la base de datos.' });
        }
        
        if (results.length === 0) {
            return res.status(404).send({ success: false, message: 'No se encontraron huellas para el ID de fraterno.' });
        }

        const imagePath = results[0].image_path;
        const fullPath = path.join(__dirname, imagePath); // Recrear la ruta absoluta

        // Enviar el archivo si existe, sino solo la ruta (depende de tu configuración de Express)
        if (fs.existsSync(fullPath)) {
            res.sendFile(fullPath);
        } else {
             res.status(404).send({ success: false, message: 'Archivo de imagen no encontrado en el servidor.', path: imagePath });
        }
    });
});
app.get('/api/huellas/all', (req, res) => {
    const sql = 'SELECT fraterno_id, huella_feature_set FROM images WHERE huella_feature_set IS NOT NULL';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener Feature Sets:', err.message);
            return res.status(500).json({ success: false, message: 'Error al consultar Feature Sets.' });
        }
        
        const huellasBase64 = results.map(row => ({
            fraternoId: row.fraterno_id,
            // 🛑 CAMBIO CLAVE: Ya es un String (LONGTEXT), lo pasamos directamente
            huella_feature_set: row.huella_feature_set 
        }));

        // El Agente Java espera un JSON Array
        res.status(200).json(huellasBase64);
    });
});
// ----------------------------------------------------
// NUEVO ENDPOINT: GUARDAR FEATURE SET (ENROLAMIENTO)
// ¡Es llamado por el Agente Java, NO por el Web Client!
// ----------------------------------------------------
app.post('/api/guardar_feature_set', (req, res) => {
    const { fraterno_id, feature_set_base64 } = req.body;

    if (!fraterno_id || !feature_set_base64) {
        return res.status(400).json({ success: false, message: 'Faltan fraterno_id o feature_set_base64.' });
    }
    
    // 🛑 CAMBIO CLAVE: NO SE USA Buffer.from()
    // feature_set_base64 se guarda directamente como STRING en LONGTEXT
    
    const sql = `
        INSERT INTO images (fraterno_id, huella_feature_set) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE huella_feature_set = VALUES(huella_feature_set)
    `; 

    connection.query(sql, [fraterno_id, feature_set_base64], (dbErr, result) => {
        if (dbErr) {
            console.error('Error al insertar Feature Set en DB:', dbErr.message);
            return res.status(500).json({ success: false, message: 'Error al registrar el Feature Set.' });
        }
        
        res.status(201).json({ 
            success: true, 
            message: 'Feature Set de huella guardado exitosamente.',
            id: result.insertId || fraterno_id
        });
    });
});
app.listen(PORT, () => {
    console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});

// ----------------------------------------------------
// ENDPOINT: OBTENER TODOS LOS FEATURE SETS (Para Match 1:N)
// Llama tu Agente Java para verificación.
// ----------------------------------------------------
