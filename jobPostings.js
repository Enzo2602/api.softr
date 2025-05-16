// /home/enzochavezrossi/Documentos/CITIAPP/api.softr/jobPostings.js
const Airtable = require('airtable');

// Estos valores se obtendrán de las variables de entorno en Vercel
const { 
    AIRTABLE_API_KEY, 
    AIRTABLE_BASE_ID, 
    AIRTABLE_EMPRESAS_TABLE_ID, 
    AIRTABLE_OFERTAS_TABLE_ID,
    AIRTABLE_SUSCRIPCIONES_TABLE_ID, 
    FIELD_ID_PUESTO_VACANTE,
    FIELD_ID_AREA_PUESTO,
    FIELD_ID_NIVEL_EXPERIENCIA,
    FIELD_ID_MODALIDAD_TRABAJO,
    FIELD_ID_PAIS,
    FIELD_ID_PROVINCIA,
    FIELD_ID_UBICACION, 
    FIELD_ID_TIPO_CONTRATO,
    FIELD_ID_RANGO_SALARIAL,
    FIELD_ID_DESCRIPCION_PUESTO,
    FIELD_ID_EMPRESA_EN_OFERTAS, 
    FIELD_ID_TIPO_PUBLICACION_OFERTA, 
    FIELD_ID_EMPRESA_PUBLI_GRATUITA_USADA, 
    FIELD_ID_EMPRESA_AVISOS_PAGADOS_DISP, 
    FIELD_ID_EMPRESA_PLAN_ACTUAL, 
    FIELD_ID_EMPRESA_FECHA_VENCIMIENTO, 
    FIELD_ID_AVISOS_USADOS_SUSCRIPCION, 
    FIELD_ID_EMPRESA_SUSCRIPCION_ACTIVA_LINK,
    FIELD_ID_SUSCRIPCIONES_ID_EMPRESAS,
    FIELD_ID_SUSCRIPCIONES_ESTADO,
    FIELD_ID_SUSCRIPCIONES_AVISOS_RESTANTES,
    FIELD_ID_SUSCRIPCIONES_FECHA_EXPIRACION,
    FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS
} = process.env;

let base;
function getAirtableBase() {
    if (!base) {
        if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
            base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
        } else {
            console.error('Error Crítico: Variables de entorno de Airtable (API Key o Base ID) no configuradas.');
            throw new Error('Configuración de Airtable incompleta. Faltan API Key o Base ID.');
        }
    }
    return base;
}

/**
 * Maneja la creación de una nueva oferta de empleo.
 */
async function createJobPosting(req, res) {
    console.log('Solicitud para crear oferta:', req.body);
    console.log('Company ID de query params:', req.query.companyId);

    try {
        getAirtableBase(); 
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

    const envVarNames = {
        AIRTABLE_EMPRESAS_TABLE_ID: process.env.AIRTABLE_EMPRESAS_TABLE_ID,
        AIRTABLE_OFERTAS_TABLE_ID: process.env.AIRTABLE_OFERTAS_TABLE_ID,
        AIRTABLE_SUSCRIPCIONES_TABLE_ID: process.env.AIRTABLE_SUSCRIPCIONES_TABLE_ID,
        FIELD_ID_PUESTO_VACANTE: process.env.FIELD_ID_PUESTO_VACANTE,
        FIELD_ID_AREA_PUESTO: process.env.FIELD_ID_AREA_PUESTO,
        FIELD_ID_NIVEL_EXPERIENCIA: process.env.FIELD_ID_NIVEL_EXPERIENCIA,
        FIELD_ID_MODALIDAD_TRABAJO: process.env.FIELD_ID_MODALIDAD_TRABAJO,
        FIELD_ID_PAIS: process.env.FIELD_ID_PAIS,
        FIELD_ID_PROVINCIA: process.env.FIELD_ID_PROVINCIA,
        FIELD_ID_UBICACION: process.env.FIELD_ID_UBICACION,
        FIELD_ID_TIPO_CONTRATO: process.env.FIELD_ID_TIPO_CONTRATO,
        FIELD_ID_RANGO_SALARIAL: process.env.FIELD_ID_RANGO_SALARIAL,
        FIELD_ID_DESCRIPCION_PUESTO: process.env.FIELD_ID_DESCRIPCION_PUESTO,
        FIELD_ID_EMPRESA_EN_OFERTAS: process.env.FIELD_ID_EMPRESA_EN_OFERTAS,
        FIELD_ID_TIPO_PUBLICACION_OFERTA: process.env.FIELD_ID_TIPO_PUBLICACION_OFERTA,
        FIELD_ID_EMPRESA_PUBLI_GRATUITA_USADA: process.env.FIELD_ID_EMPRESA_PUBLI_GRATUITA_USADA,
        FIELD_ID_EMPRESA_AVISOS_PAGADOS_DISP: process.env.FIELD_ID_EMPRESA_AVISOS_PAGADOS_DISP, 
        FIELD_ID_EMPRESA_PLAN_ACTUAL: process.env.FIELD_ID_EMPRESA_PLAN_ACTUAL, 
        FIELD_ID_EMPRESA_FECHA_VENCIMIENTO: process.env.FIELD_ID_EMPRESA_FECHA_VENCIMIENTO, 
        FIELD_ID_EMPRESA_SUSCRIPCION_ACTIVA_LINK: process.env.FIELD_ID_EMPRESA_SUSCRIPCION_ACTIVA_LINK,
        FIELD_ID_SUSCRIPCIONES_ID_EMPRESAS: process.env.FIELD_ID_SUSCRIPCIONES_ID_EMPRESAS,
        FIELD_ID_SUSCRIPCIONES_ESTADO: process.env.FIELD_ID_SUSCRIPCIONES_ESTADO,
        FIELD_ID_SUSCRIPCIONES_AVISOS_RESTANTES: process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_RESTANTES,
        FIELD_ID_SUSCRIPCIONES_FECHA_EXPIRACION: process.env.FIELD_ID_SUSCRIPCIONES_FECHA_EXPIRACION,
        FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS: process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS
    };

    const missingVars = Object.entries(envVarNames)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        console.error('Error: Faltan las siguientes variables de entorno para IDs de Airtable:', missingVars.join(', '));
        return res.status(500).json({
            error: 'Configuración del servidor incompleta. Faltan IDs de Airtable.',
            missing_variables: missingVars
        });
    }

    const { 
        puestoVacante, areaPuesto, nivelExperiencia, modalidadTrabajo, pais, provincia, localidad, tipoContrato, rangoSalarial, descripcionPuesto, beneficios, nombreEmpresaVisible, emailNotificaciones, empresaId } = req.body;

    // Validate that empresaId is provided, as it's crucial for subscription checking
    // empresaId from req.body will be used for subscription logic after fetching the company record.
    // companyRecordId from req.query.companyId is used to fetch the company record itself.
    const companyRecordId = req.query.companyId; 
    const empresaIdFromBody = req.body.empresaId; // Let's keep this distinct for clarity

    if (!empresaIdFromBody) {
        console.error('Error: empresaId is missing in the request body.');
        return res.status(400).json({ error: 'Company ID (empresaId from body) is required for subscription logic.' });
    } 

    if (!companyRecordId) {
        return res.status(400).json({ error: 'Falta companyId en los parámetros de la URL.' });
    }

    try {
        console.log(`Verificando empresa ID: ${companyRecordId} en tabla ${process.env.AIRTABLE_EMPRESAS_TABLE_ID}`);
        const empresaRecords = await base(process.env.AIRTABLE_EMPRESAS_TABLE_ID).select({
            filterByFormula: `RECORD_ID() = '${companyRecordId}'`,
            maxRecords: 1
        }).firstPage();

        if (!empresaRecords || empresaRecords.length === 0) {
            return res.status(404).json({ error: 'Empresa no encontrada.' });
        }
        const empresaRecord = empresaRecords[0];
        const empresaAirtableId = empresaRecord.id;
        console.log('Datos de la empresa:', empresaRecord.fields);

        // Asegurarnos que el empresaId de body (para lógica de suscripción) y el recordId de la empresa consultada coincidan
        // o que se use consistentemente el empresaAirtableId (RECORD_ID() de la empresa)
        if (empresaIdFromBody !== empresaAirtableId) {
            // Esta situación podría ocurrir si el ID en el body es diferente al ID en la URL query param.
            // Para la lógica de suscripción y actualización de 'Empresas', usaremos empresaAirtableId, que es el RECORD_ID() verificado.
            console.warn(`[createJobPosting] Discrepancia: empresaId en body ('${empresaIdFromBody}') es diferente a empresaAirtableId ('${empresaAirtableId}'). Se usará '${empresaAirtableId}'.`);
        }

        let puedePublicar = false;
        let tipoDePublicacionParaOferta = 'No Determinado'; // 'Gratuita', 'PagadaSuscripcion'
        let infoParaActualizar = {}; // Store details for what to update post-creation

        // 1. Check for free post availability from 'Empresas' table
        const publicacionGratuitaUsada = empresaRecord.get(process.env.FIELD_ID_EMPRESA_PUBLI_GRATUITA_USADA) || false;
        console.log(`[createJobPosting] Empresa ${empresaAirtableId} - Publicación gratuita usada: ${publicacionGratuitaUsada}`);

        if (!publicacionGratuitaUsada) {
            puedePublicar = true;
            tipoDePublicacionParaOferta = 'Gratuita';
            infoParaActualizar = {
                tabla: process.env.AIRTABLE_EMPRESAS_TABLE_ID,
                recordId: empresaAirtableId,
                fieldToUpdate: process.env.FIELD_ID_EMPRESA_PUBLI_GRATUITA_USADA,
                newValue: true
            };
            console.log(`[createJobPosting] Permiso: Publicación gratuita disponible para empresa ${empresaAirtableId}.`);
        } else {
            // 2. Free post used, check 'Suscripciones' table
            console.log(`[createJobPosting] Publicación gratuita ya usada por ${empresaAirtableId}. Verificando suscripciones...`);
            const subscriptionStatus = await getSubscriptionStatus(empresaAirtableId); // Usamos empresaAirtableId que es el Record ID

            if (subscriptionStatus.canPublish) {
                puedePublicar = true;
                tipoDePublicacionParaOferta = 'PagadaSuscripcion';
                infoParaActualizar = {
                    tabla: process.env.AIRTABLE_SUSCRIPCIONES_TABLE_ID,
                    recordId: subscriptionStatus.subscriptionRecordId,
                    fieldToUpdate: process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS,
                    newValue: subscriptionStatus.currentAdsUsed + 1
                };
                console.log(`[createJobPosting] Permiso: Publicación por suscripción disponible. ID Suscripcion: ${subscriptionStatus.subscriptionRecordId}, Nuevo conteo de avisos usados: ${subscriptionStatus.currentAdsUsed + 1}`);
            } else {
                console.warn(`[createJobPosting] Empresa ${empresaAirtableId} no puede publicar: ${subscriptionStatus.message}`);
                return res.status(402).json({ error: subscriptionStatus.message || 'No tiene una publicación gratuita disponible ni una suscripción activa con avisos restantes.' });
            }
        }

        if (!puedePublicar) { // Should not be reached if logic above is correct, but as a safeguard
            console.error("[createJobPosting] Error lógico: No se determinó el estado de publicación.");
            return res.status(500).json({ error: 'Error interno al determinar el permiso de publicación.' });
        }
        console.log(`[createJobPosting] Tipo de publicación determinado: ${tipoDePublicacionParaOferta}`);

        const ofertaDataAirtable = {
            [process.env.FIELD_ID_PUESTO_VACANTE]: puestoVacante, // Campo obligatorio o de identificación
            [process.env.FIELD_ID_EMPRESA_EN_OFERTAS]: [empresaAirtableId] // Probablemente link obligatorio
        };

        // Campo País aislado
        if (pais) ofertaDataAirtable[process.env.FIELD_ID_PAIS] = pais;

        if (areaPuesto) ofertaDataAirtable[process.env.FIELD_ID_AREA_PUESTO] = areaPuesto;
        if (nivelExperiencia) {
            ofertaDataAirtable[process.env.FIELD_ID_NIVEL_EXPERIENCIA] = Array.isArray(nivelExperiencia) ? nivelExperiencia : [nivelExperiencia];
        }
        if (modalidadTrabajo) {
            ofertaDataAirtable[process.env.FIELD_ID_MODALIDAD_TRABAJO] = Array.isArray(modalidadTrabajo) ? modalidadTrabajo : [modalidadTrabajo];
        }
        if (provincia && provincia.trim() !== '' && provincia !== 'No aplica para este país') {
            ofertaDataAirtable[process.env.FIELD_ID_PROVINCIA] = provincia;
        }
        if (localidad) ofertaDataAirtable[process.env.FIELD_ID_UBICACION] = localidad;
        if (tipoContrato) ofertaDataAirtable[process.env.FIELD_ID_TIPO_CONTRATO] = tipoContrato;
        if (descripcionPuesto) ofertaDataAirtable[process.env.FIELD_ID_DESCRIPCION_PUESTO] = descripcionPuesto;
        if (rangoSalarial) ofertaDataAirtable[process.env.FIELD_ID_RANGO_SALARIAL] = rangoSalarial;

        console.log('Creando oferta en Airtable con datos:', JSON.stringify(ofertaDataAirtable));
        const nuevasOfertas = await base(process.env.AIRTABLE_OFERTAS_TABLE_ID).create([
            { fields: ofertaDataAirtable }
        ]);

        if (!nuevasOfertas || nuevasOfertas.length === 0) {
            throw new Error('La creación de la oferta en Airtable no devolvió resultados.');
        }
        const nuevaOfertaCreada = nuevasOfertas[0];
        console.log('Oferta creada:', nuevaOfertaCreada.id);

        // Actualizar la tabla correspondiente ('Empresas' o 'Suscripciones')
        if (tipoDePublicacionParaOferta === 'PagadaSuscripcion' && infoParaActualizar.tabla && infoParaActualizar.recordId) {
            try {
                console.log(`[createJobPosting] Actualizando tabla: ${infoParaActualizar.tabla}, Record ID: ${infoParaActualizar.recordId}, Campo: ${infoParaActualizar.fieldToUpdate}, Nuevo Valor: ${infoParaActualizar.newValue}`);
                await base(infoParaActualizar.tabla).update([
                    {
                        id: infoParaActualizar.recordId,
                        fields: {
                            [infoParaActualizar.fieldToUpdate]: infoParaActualizar.newValue
                        }
                    }
                ]);
                console.log(`[createJobPosting] Actualización exitosa para ${tipoDePublicacionParaOferta}.`);
            } catch (updateError) {
                console.error(`[createJobPosting] Error al actualizar la tabla ${infoParaActualizar.tabla} para el record ${infoParaActualizar.recordId}:`, updateError);
                // La oferta ya fue creada. Se loguea el fallo de actualización, pero se continúa para enviar respuesta de éxito.
            }
        } else if (tipoDePublicacionParaOferta === 'Gratuita') {
            console.log(`[createJobPosting] Publicación gratuita utilizada. La actualización del estado en 'Empresas' es manejada por automatización en Airtable.`);
        }

        return res.status(201).json({ 
            message: `Oferta de empleo creada con éxito (${tipoDePublicacionParaOferta}).`, 
            recordId: nuevaOfertaCreada.id 
        });

    } catch (error) {
        console.error('Error detallado en createJobPosting:', error);
        let statusCode = 500;
        let errorMessage = 'Error interno del servidor al procesar la oferta.';

        if (error.message) {
            if (error.message.includes('Authentication required')) {
                errorMessage = 'Error de autenticación con Airtable. Verifica las credenciales y permisos en Vercel.';
            } else if (error.message.includes('NOT_FOUND')) {
                errorMessage = 'No se encontró la tabla o base en Airtable. Verifica los IDs de tabla/base.';
                statusCode = 404;
            } else if (error.statusCode) {
                statusCode = error.statusCode;
                errorMessage = error.message; 
            }
        }
        return res.status(statusCode).json({ error: errorMessage, details: error.toString() });
    }
}

async function getSubscriptionStatus(companyId) {
    console.log(`[getSubscriptionStatus] Called for companyId: ${companyId}`);

    // Ensure required environment variables for subscriptions are loaded
    const requiredSubscriptionEnvVars = [
        'AIRTABLE_API_KEY',
        'AIRTABLE_BASE_ID',
        'AIRTABLE_SUSCRIPCIONES_TABLE_ID',
        'FIELD_ID_SUSCRIPCIONES_EMPRESA_LINK',
        'FIELD_ID_SUSCRIPCIONES_ESTADO',
        'FIELD_ID_SUSCRIPCIONES_FECHA_PAGO',
        'FIELD_ID_SUSCRIPCIONES_CANTIDAD_COMPRADOS',
        'FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS',
    ];
    const missingSubscriptionEnvVars = requiredSubscriptionEnvVars.filter(envVar => !process.env[envVar]);
    if (missingSubscriptionEnvVars.length > 0) {
        console.error('[getSubscriptionStatus] Missing required environment variables for subscriptions:', missingSubscriptionEnvVars.join(', '));
        return { canPublish: false, message: `Server configuration error: Missing subscription environment variables.` };
    }

    const formula = `AND(
        {${process.env.FIELD_ID_SUSCRIPCIONES_EMPRESA_LINK}} = '${companyId}',
        {${process.env.FIELD_ID_SUSCRIPCIONES_ESTADO}} = 'Activa',
        ({${process.env.FIELD_ID_SUSCRIPCIONES_CANTIDAD_COMPRADOS}} - IF({${process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS}}, {${process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS}}, 0)) > 0
    )`;
    // Using IF to default Avisos Usados to 0 if it's blank/null, crucial for the formula.

    console.log(`[getSubscriptionStatus] Airtable query formula: ${formula}`);

    try {
        const records = await base(process.env.AIRTABLE_SUSCRIPCIONES_TABLE_ID)
            .select({
                filterByFormula: formula,
                sort: [{ field: process.env.FIELD_ID_SUSCRIPCIONES_FECHA_PAGO, direction: 'desc' }],
                maxRecords: 1, // We only need the most recent, active subscription with posts
                fields: [ // Explicitly request fields needed to reduce data transfer
                    process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS,
                    process.env.FIELD_ID_SUSCRIPCIONES_CANTIDAD_COMPRADOS, // For logging/debugging if needed
                    process.env.FIELD_ID_SUSCRIPCIONES_PLAN // For context if needed
                ]
            })
            .firstPage();

        if (records.length === 0) {
            console.warn(`[getSubscriptionStatus] No active subscription found for company ${companyId} with available posts.`);
            return { canPublish: false, message: 'No active subscription found with available job posts.' };
        }

        const subscription = records[0];
        const currentAdsUsed = subscription.get(process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS) || 0;
        // const totalAdsBought = subscription.get(process.env.FIELD_ID_SUSCRIPCIONES_CANTIDAD_COMPRADOS) || 0;
        // const plan = subscription.get(process.env.FIELD_ID_SUSCRIPCIONES_PLAN);
        // console.log(`[getSubscriptionStatus] Found subscription: ID=${subscription.id}, Plan=${plan}, AdsBought=${totalAdsBought}, AdsUsed=${currentAdsUsed}`);

        return {
            canPublish: true,
            subscriptionRecordId: subscription.id,
            currentAdsUsed: currentAdsUsed,
        };
    } catch (error) {
        console.error('[getSubscriptionStatus] Error querying Airtable for subscription:', error);
        return { canPublish: false, message: `Error checking subscription status: ${error.message}` };
    }
}

module.exports = createJobPosting;
