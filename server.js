const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/pages/index.html');
});

const dbPath = path.join(__dirname, 'db.json');

// Función helper para leer DB
const readDB = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ solicitudes: [] }));
    }
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
};

// Función helper para escribir DB
const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

// GET: Obtener todas las solicitudes
app.get('/api/solicitudes', (req, res) => {
    try {
        const db = readDB();
        res.json(db.solicitudes);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer la base de datos' });
    }
});

// POST: Nueva solicitud con simulación de IA
app.post('/api/solicitudes', async (req, res) => {
    try {
        const nuevaSolicitud = req.body;
        
        // Simular tiempo de procesamiento de IA (2 segundos)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Lógica de "IA" simulada
        const inversion = Number(nuevaSolicitud.inversion);
        const empleos = Number(nuevaSolicitud.empleos);
        
        let puntaje = 50;
        let clasificacion = 'Revisar';
        
        if (inversion >= 150000 && empleos >= 10) {
            puntaje = Math.min(100, 60 + (inversion / 100000) + (empleos));
            clasificacion = puntaje > 80 ? 'Recomendada' : 'Revisar';
        } else {
            puntaje = Math.max(0, 30 + (inversion / 200000));
            clasificacion = 'Rechazada';
        }

        const solicitudEvaluada = {
            id: Date.now().toString(),
            ...nuevaSolicitud,
            evaluacion: {
                puntaje: Math.round(puntaje),
                clasificacion: clasificacion,
                fecha: new Date().toISOString()
            }
        };

        const db = readDB();
        db.solicitudes.push(solicitudEvaluada);
        writeDB(db);

        res.status(201).json(solicitudEvaluada);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
