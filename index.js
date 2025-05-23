// index.js - API para Softr - CitiJob

const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
require('dotenv').config(); // Carga variables de entorno desde .env (para desarrollo local)
const { createJobPosting, publicarAvisoGratis } = require('./jobPostings'); // Importar funciones

// Inicializar aplicación Express
const app = express();
const PORT = process.env.PORT || 3001; // Puerto para desarrollo local

// --- Configuración de CORS ---
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'; // Permite todos los orígenes por defecto

app.use(cors({
  origin: function (origin, callback) {
    // Para desarrollo local o si no se especifica origen (ej. Postman), permitir
    if (!origin || allowedOrigin === '*' || origin === allowedOrigin) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origen no permitido: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Middleware para parsear JSON y URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'

// --- Configuración de Airtable ---
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_EMPRESAS_TABLE_NAME = process.env.AIRTABLE_EMPRESAS_TABLE_NAME || 'Empresas';

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error("FATAL: AIRTABLE_API_KEY o AIRTABLE_BASE_ID no están definidas en las variables de entorno.");
  // En un escenario real, podrías querer que el servidor no inicie o maneje esto de forma más robusta.
  // process.exit(1); // Descomentar si quieres que falle al iniciar si faltan las claves
}

let base;
try {
  base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
  console.log(`Conectado a Airtable Base ID: ${AIRTABLE_BASE_ID}, Tabla de Empresas: ${AIRTABLE_EMPRESAS_TABLE_NAME}`);
} catch (error) {
  console.error("FATAL: Error configurando Airtable. Verifica AIRTABLE_API_KEY y AIRTABLE_BASE_ID.", error);
  // process.exit(1); // Descomentar si quieres que falle al iniciar
}

// --- Rutas de la API ---

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API de CitiJob para Softr funcionando. ¡Bienvenido!' });
});

/**
 * Endpoint: /api/check-publish-status
 * Query Params: companyId (RECORD_ID de la empresa en Airtable)
 * Retorna el estado de publicación de la empresa.
 */
app.get('/api/check-publish-status', async (req, res) => {
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId es requerido como query parameter.' });
  }

  if (!base) {
    console.error('DIAGNOSTICO - Airtable base no inicializada en check-publish-status');
    return res.status(500).json({ error: 'Error interno del servidor: Conexión a base de datos no disponible.' });
  }

  try {
    const records = await base(AIRTABLE_EMPRESAS_TABLE_NAME).select({
      filterByFormula: `{RECORD ID} = '${companyId}'`, // Usar RECORD_ID() o el nombre del campo Primary
      fields: ['PublicacionGratuitaUtilizada', 'AvisosPagadosDisponibles'],
      maxRecords: 1
    }).firstPage();

    if (!records || records.length === 0) {
      console.warn(`DIAGNOSTICO - Empresa no encontrada para companyId: ${companyId} en check-publish-status`);
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    const empresa = records[0].fields;
    const gratuitaUtilizada = empresa['PublicacionGratuitaUtilizada'] || false;
    const avisosPagados = empresa['AvisosPagadosDisponibles'] || 0;

    let statusResponse;
    if (!gratuitaUtilizada) {
      statusResponse = {
        canPublish: true,
        reason: "CAN_PUBLISH_FREE",
        message: "Publicación gratuita disponible.",
        paidCreditsAvailable: avisosPagados, // Informar también los pagados por si acaso
        freePublicationUsed: false
      };
    } else if (avisosPagados > 0) {
      statusResponse = {
        canPublish: true,
        reason: "CAN_PUBLISH_PAID",
        message: `Puede publicar utilizando uno de sus ${avisosPagados} créditos.`,
        paidCreditsAvailable: avisosPagados,
        freePublicationUsed: true
      };
    } else {
      statusResponse = {
        canPublish: false,
        reason: "NEEDS_CREDITS",
        message: "Ha utilizado su publicación gratuita y no tiene créditos pagados. Necesita comprar créditos.",
        paidCreditsAvailable: 0,
        freePublicationUsed: true
      };
    }
    console.log(`DIAGNOSTICO - Check Publish Status para ${companyId}:`, JSON.stringify(statusResponse));
    res.status(200).json(statusResponse);

  } catch (error) {
    console.error(`DIAGNOSTICO - Error en /api/check-publish-status para companyId ${companyId}:`, error);
    res.status(500).json({ error: 'Error interno del servidor al consultar estado de publicación.' });
  }
});

/**
 * Endpoint: /api/get-account-summary
 * Query Params: companyId (RECORD_ID de la empresa en Airtable)
 * Retorna el resumen de la cuenta de la empresa.
 */
app.get('/api/get-account-summary', async (req, res) => {
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId es requerido como query parameter.' });
  }

  if (!base) {
    console.error('DIAGNOSTICO - Airtable base no inicializada en get-account-summary');
    return res.status(500).json({ error: 'Error interno del servidor: Conexión a base de datos no disponible.' });
  }

  try {
    const records = await base(AIRTABLE_EMPRESAS_TABLE_NAME).select({
      filterByFormula: `{RECORD ID} = '${companyId}'`, // Usar RECORD_ID() o el nombre del campo Primary
      fields: [
        'Plan Actual', 
        'Fecha Expiración (from Suscripcion Activa)',
        'PublicacionGratuitaUtilizada',
        'AvisosPagadosDisponibles'
      ],
      maxRecords: 1
    }).firstPage();

    if (!records || records.length === 0) {
      console.warn(`DIAGNOSTICO - Empresa no encontrada para companyId: ${companyId} en get-account-summary`);
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    const empresa = records[0].fields;

    const planName = empresa['Plan Actual'] || 'No especificado'; 
    const rawExpiryDate = empresa['Fecha Expiración (from Suscripcion Activa)'];
    const freePublicationUsed = empresa['PublicacionGratuitaUtilizada'] || false;
    const paidCredits = empresa['AvisosPagadosDisponibles'] || 0;
    
    let nextPaymentDateFormatted = 'No especificado';
    if (rawExpiryDate) {
        const date = new Date(rawExpiryDate);
        if (!isNaN(date.getTime())) { // Check if date is valid
            nextPaymentDateFormatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        }
    }

    // Si el plan es "Free", la fecha de pago no aplica
    if (planName === "Free") {
        nextPaymentDateFormatted = "No aplica";
    }

    const canPublishFree = !freePublicationUsed;
    const canPublishPaid = paidCredits > 0;

    const summaryResponse = {
      planName: planName,
      nextPaymentDate: nextPaymentDateFormatted,
      freePublicationUsed: freePublicationUsed,
      availableCredits: paidCredits, // Cambiado de 'paidCredits' para más claridad en el frontend
      canPublishFree: canPublishFree,
      canPublishPaid: canPublishPaid
    };

    console.log(`DIAGNOSTICO - Get Account Summary para ${companyId}:`, JSON.stringify(summaryResponse));
    res.status(200).json(summaryResponse);

  } catch (error) {
    console.error(`DIAGNOSTICO - Error en /api/get-account-summary para companyId ${companyId}:`, error);
    return res.status(500).json({ error: 'Error interno del servidor al verificar el estado.' });
  }
});

// Endpoint para publicar un aviso gratuito
// Requiere companyId en la URL query: /api/publicarAvisoGratis?companyId=RECORD_ID
// y los datos de la oferta en el body.
app.post('/api/publicarAvisoGratis', publicarAvisoGratis);

// Endpoint para crear una nueva oferta de empleo
// La lógica completa, incluyendo chequeo de empresa, suscripción y creación de oferta, está en jobPostings.js
app.post('/api/jobPostings', createJobPosting);

/**
 * Endpoint: /api/submit-job-posting
 * Query Params: companyId (RECORD_ID de la empresa en Airtable)
 * Body: Datos del formulario de la oferta de empleo.
 * Crea una nueva oferta de empleo.
 */
app.post('/api/submit-job-posting', async (req, res) => {
  try {
    // createJobPosting maneja la respuesta (req, res) internamente
    await createJobPosting(req, res); 
  } catch (error) {
    // Este catch es un respaldo si createJobPosting falla catastróficamente ANTES de enviar una respuesta.
    console.error('DIAGNOSTICO - Error general en /api/submit-job-posting (desde index.js):', error);
    if (!res.headersSent) { // Solo enviar respuesta si no se ha enviado ya una
      res.status(500).json({ error: 'Error interno del servidor al procesar la creación de la oferta.' });
    }
  }
});

// --- Iniciar el servidor (solo para desarrollo local) ---
// Vercel maneja esto automáticamente en producción.
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
    console.log(`Para probar localmente, visita: http://localhost:${PORT}`);
    console.log('Endpoints disponibles:');
    console.log(`  GET http://localhost:${PORT}/api/check-publish-status?companyId=TU_RECORD_ID`);
    console.log(`  GET http://localhost:${PORT}/api/get-account-summary?companyId=TU_RECORD_ID`);
    console.log(`  POST http://localhost:${PORT}/api/submit-job-posting`);
  });
}

// Exportar la app para que Vercel la use
module.exports = app;
