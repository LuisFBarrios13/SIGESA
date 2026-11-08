// src/middlewares/validar.middleware.js
// Validación de entrada con express-validator.
//
//   router.post('/', validar([v.id('id_cuenta'), v.dinero('monto_pago')]), controlador)
//
// Si algo no cumple, responde 400 con el primer mensaje como "message" y la
// lista completa en "errors". Los controladores reciben datos ya verificados.
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

const fuentes = { body, param, query };

export const validar = (reglas) => [
  ...reglas,
  (req, _res, next) => {
    const resultado = validationResult(req);
    if (resultado.isEmpty()) return next();
    const mensajes = resultado.array({ onlyFirstError: true }).map((e) => e.msg);
    next(new AppError(400, mensajes[0], mensajes));
  },
];

// Nota: en Express 5 req.query es de solo lectura, así que a los parámetros de
// query no se les aplican conversiones (toInt…); el controlador los convierte.
const conversion = (de, cadena) => (de === 'query' ? cadena : cadena.toInt());

/** Reglas reutilizables. `de` = 'body' | 'param' | 'query'. */
export const v = {
  /** Entero ≥ 1 (ids). */
  id: (campo, de = 'body') =>
    conversion(de, fuentes[de](campo).isInt({ min: 1 }).withMessage(`${campo} debe ser un identificador válido`)),

  year: (campo = 'year', de = 'body', { opcional = false } = {}) => {
    const c = fuentes[de](campo);
    if (opcional) c.optional({ values: 'falsy' });
    return conversion(de, c.isInt({ min: 2000, max: 2100 }).withMessage('El año no es válido'));
  },

  periodo: (campo = 'numero_periodo', de = 'body', { opcional = false } = {}) => {
    const c = fuentes[de](campo);
    if (opcional) c.optional({ values: 'falsy' });
    return conversion(de, c.isInt({ min: 1, max: 4 }).withMessage('El periodo debe estar entre 1 y 4'));
  },

  /** Texto obligatorio (se recorta). */
  texto: (campo, etiqueta, max, de = 'body') =>
    fuentes[de](campo)
      .isString().withMessage(`${etiqueta} es requerido`).bail()
      .trim()
      .notEmpty().withMessage(`${etiqueta} es requerido`).bail()
      .isLength({ max }).withMessage(`${etiqueta} admite máximo ${max} caracteres`),

  /** Texto opcional: puede faltar, ser null o vacío. */
  textoOpcional: (campo, etiqueta, max) =>
    body(campo)
      .optional({ values: 'null' })
      .isString().withMessage(`${etiqueta} debe ser texto`).bail()
      .isLength({ max }).withMessage(`${etiqueta} admite máximo ${max} caracteres`),

  /** Documento de identidad / cédula. */
  documento: (campo, etiqueta, de = 'body') =>
    fuentes[de](campo)
      .isString().withMessage(`${etiqueta} es requerido`).bail()
      .trim()
      .notEmpty().withMessage(`${etiqueta} es requerido`).bail()
      .matches(/^[A-Za-z0-9-]{3,20}$/).withMessage(`${etiqueta} solo admite letras, números y guiones (3 a 20)`),

  correo: (campo) =>
    body(campo).optional({ values: 'falsy' }).trim().isEmail().withMessage('El correo no es válido'),

  fecha: (campo, etiqueta, { opcional = false } = {}) => {
    const c = body(campo);
    if (opcional) c.optional({ values: 'falsy' });
    return c.isISO8601({ strict: true }).withMessage(`${etiqueta} no es una fecha válida`);
  },

  /** Valor en pesos ≥ 0 (o > 0 con positivo). */
  dinero: (campo, etiqueta, { positivo = false } = {}) =>
    body(campo)
      .isFloat(positivo ? { gt: 0 } : { min: 0 })
      .withMessage(`${etiqueta} debe ser un número ${positivo ? 'mayor a 0' : 'mayor o igual a 0'}`)
      .toFloat(),

  /** Valor dentro de una lista. */
  enLista: (campo, valores, etiqueta, { opcional = false, de = 'body' } = {}) => {
    const c = fuentes[de](campo);
    if (opcional) c.optional({ values: 'falsy' });
    return c.isIn(valores).withMessage(`${etiqueta} debe ser uno de: ${valores.join(', ')}`);
  },
};
