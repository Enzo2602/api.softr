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
        puestoVacante, areaPuesto, nivelExperiencia, modalidadTrabajo, 
        pais, provincia, localidad, tipoContrato, rangoSalarial, 
        descripcionPuesto 
    } = req.body;

    const companyRecordId = req.query.companyId; 

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

        const publicacionGratuitaUsada = empresaRecord.fields[process.env.FIELD_ID_EMPRESA_PUBLI_GRATUITA_USADA] || false;
        const planActual = empresaRecord.fields[process.env.FIELD_ID_EMPRESA_PLAN_ACTUAL] ? empresaRecord.fields[process.env.FIELD_ID_EMPRESA_PLAN_ACTUAL][0] : null;
        const avisosPagadosDisponibles = empresaRecord.fields[process.env.FIELD_ID_EMPRESA_AVISOS_PAGADOS_DISP] || 0;
        const fechaVencimientoString = empresaRecord.fields[process.env.FIELD_ID_EMPRESA_FECHA_VENCIMIENTO] ? empresaRecord.fields[process.env.FIELD_ID_EMPRESA_FECHA_VENCIMIENTO][0] : null;
        const hoy = new Date();
        let fechaVencimiento = null;
        if (fechaVencimientoString) {
            fechaVencimiento = new Date(fechaVencimientoString);
        }

        console.log(`Datos empresa: GratuitaUsada=${publicacionGratuitaUsada}, Plan=${planActual}, AvisosDisp=${avisosPagadosDisponibles}, Vencimiento=${fechaVencimientoString}`);

        let puedePublicar = false;
        let tipoDePublicacionParaOferta = ''; 
        let camposEmpresaActualizar = {};

        if (!publicacionGratuitaUsada) {
            puedePublicar = true;
            tipoDePublicacionParaOferta = 'Gratis';
            camposEmpresaActualizar[process.env.FIELD_ID_EMPRESA_PUBLI_GRATUITA_USADA] = true;
            console.log('Permiso: Publicación gratuita disponible.');
        } else {
            const filterFormula = `AND(
                {${process.env.FIELD_ID_SUSCRIPCIONES_ID_EMPRESAS}} = '${companyRecordId}',
                {${process.env.FIELD_ID_SUSCRIPCIONES_ESTADO}} = 'Activa',
                {${process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_RESTANTES}} > 0,
                IS_AFTER({${process.env.FIELD_ID_SUSCRIPCIONES_FECHA_EXPIRACION}}, TODAY())
            )`;

            try {
                const suscripcionRecords = await base(process.env.AIRTABLE_SUSCRIPCIONES_TABLE_ID).select({
                    filterByFormula: filterFormula,
                    maxRecords: 1, // Solo necesitamos una suscripción válida
                    fields: [process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS] // Solo necesitamos el ID y los avisos usados
                }).firstPage();

                if (suscripcionRecords && suscripcionRecords.length > 0) {
                    const suscripcionValida = suscripcionRecords[0];
                    const avisosUsadosActual = suscripcionValida.get(process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS) || 0;
                    puedePublicar = true;
                    tipoDePublicacionParaOferta = 'Pagada';
                    console.log(`Permiso: Publicación pagada disponible. Avisos restantes: ${suscripcionValida.get(process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_RESTANTES)}`);
                }
            } catch (error) {
                console.error('Error buscando suscripción activa:', error);
                // No bloqueamos la respuesta aquí, simplemente no podrá publicar pagado
            }
        }

        if (!puedePublicar) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para publicar esta oferta.' });
        }

        const ofertaDataAirtable = {
            [process.env.FIELD_ID_PUESTO_VACANTE]: puestoVacante,
            [process.env.FIELD_ID_AREA_PUESTO]: areaPuesto,
            [process.env.FIELD_ID_NIVEL_EXPERIENCIA]: [nivelExperiencia], 
            [process.env.FIELD_ID_MODALIDAD_TRABAJO]: [modalidadTrabajo],
            [process.env.FIELD_ID_PAIS]: pais,
            [process.env.FIELD_ID_PROVINCIA]: provincia,
            [process.env.FIELD_ID_UBICACION]: localidad, 
            [process.env.FIELD_ID_TIPO_CONTRATO]: tipoContrato,
            [process.env.FIELD_ID_RANGO_SALARIAL]: rangoSalarial,
            [process.env.FIELD_ID_DESCRIPCION_PUESTO]: descripcionPuesto,
            [process.env.FIELD_ID_EMPRESA_EN_OFERTAS]: [empresaAirtableId], 
            [process.env.FIELD_ID_TIPO_PUBLICACION_OFERTA]: tipoDePublicacionParaOferta
        };

        console.log('Creando oferta en Airtable con datos:', ofertaDataAirtable);
        const nuevasOfertas = await base(process.env.AIRTABLE_OFERTAS_TABLE_ID).create([
            { fields: ofertaDataAirtable }
        ]);

        if (!nuevasOfertas || nuevasOfertas.length === 0) {
            throw new Error('La creación de la oferta en Airtable no devolvió resultados.');
        }
        const nuevaOfertaCreada = nuevasOfertas[0];
        console.log('Oferta creada:', nuevaOfertaCreada.id);

        if (tipoDePublicacionParaOferta === 'Gratis' && Object.keys(camposEmpresaActualizar).length > 0) {
            console.log(`Actualizando empresa ${empresaAirtableId} con campos:`, camposEmpresaActualizar);
            await base(process.env.AIRTABLE_EMPRESAS_TABLE_ID).update([
                { id: empresaAirtableId, fields: camposEmpresaActualizar }
            ]);
            console.log('Empresa actualizada por publicación gratuita.');
        }

        if (tipoDePublicacionParaOferta === 'Pagada') {
            const filterFormula = `AND(
                {${process.env.FIELD_ID_SUSCRIPCIONES_ID_EMPRESAS}} = '${companyRecordId}',
                {${process.env.FIELD_ID_SUSCRIPCIONES_ESTADO}} = 'Activa',
                {${process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_RESTANTES}} > 0,
                IS_AFTER({${process.env.FIELD_ID_SUSCRIPCIONES_FECHA_EXPIRACION}}, TODAY())
            )`;

            try {
                const suscripcionRecords = await base(process.env.AIRTABLE_SUSCRIPCIONES_TABLE_ID).select({
                    filterByFormula: filterFormula,
                    maxRecords: 1, // Solo necesitamos una suscripción válida
                    fields: [process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS] // Solo necesitamos el ID y los avisos usados
                }).firstPage();

                if (suscripcionRecords && suscripcionRecords.length > 0) {
                    const suscripcionValida = suscripcionRecords[0];
                    const avisosUsadosActual = suscripcionValida.get(process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS) || 0;
                    const nuevosAvisosUsados = avisosUsadosActual + 1;

                    await base(process.env.AIRTABLE_SUSCRIPCIONES_TABLE_ID).update([
                        {
                            id: suscripcionValida.id,
                            fields: {
                                [process.env.FIELD_ID_SUSCRIPCIONES_AVISOS_USADOS]: nuevosAvisosUsados
                            }
                        }
                    ]);
                    console.log(`Suscripción ${suscripcionValida.id} actualizada. Avisos usados: ${nuevosAvisosUsados}`);
                }
            } catch (suscripcionError) {
                console.error(`Error al actualizar la suscripción:`, suscripcionError);
            }
        }

        return res.status(201).json({ 
            message: 'Oferta creada exitosamente.', 
            data: nuevaOfertaCreada 
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

module.exports = { createJobPosting };
