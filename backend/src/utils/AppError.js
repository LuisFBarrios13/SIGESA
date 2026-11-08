// src/utils/AppError.js
// Error "esperado" de la aplicación: lleva el código HTTP y un mensaje que sí
// se puede mostrar al usuario. El errorHandler lo convierte en la respuesta.
// Cualquier otro error se considera un fallo interno (500) y su detalle no
// se envía al cliente.
export class AppError extends Error {
  /**
   * @param {number} status  código HTTP (400, 403, 404, 409…)
   * @param {string} message mensaje para el usuario
   * @param {string[]} [errors] detalle opcional (p. ej. errores de validación)
   */
  constructor(status, message, errors) {
    super(message);
    this.name   = 'AppError';
    this.status = status;
    if (errors) this.errors = errors;
  }
}
