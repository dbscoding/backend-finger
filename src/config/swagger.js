// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistem Rekap Absensi Kampus API',
      version: '1.0.0',
      description: 'REST API untuk Sistem Rekap Absensi Kampus',
      contact: {
        name: 'Admin',
        email: 'admin@kampus.edu'
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Attendance: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID absensi'
            },
            cloud_id: {
              type: 'string',
              description: 'ID dari cloud'
            },
            device_id: {
              type: 'string',
              description: 'ID perangkat fingerprint'
            },
            user_id: {
              type: 'string',
              description: 'ID pengguna'
            },
            nama: {
              type: 'string',
              description: 'Nama pengguna'
            },
            nip: {
              type: 'string',
              description: 'NIP pengguna'
            },
            jabatan: {
              type: 'string',
              enum: ['DOSEN', 'KARYAWAN'],
              description: 'Jabatan pengguna'
            },
            tanggal_absensi: {
              type: 'string',
              format: 'date',
              description: 'Tanggal absensi (YYYY-MM-DD)'
            },
            waktu_absensi: {
              type: 'string',
              format: 'time',
              description: 'Waktu absensi (HH:mm:ss)'
            },
            tipe_absensi: {
              type: 'string',
              enum: ['MASUK', 'PULANG'],
              description: 'Tipe absensi'
            },
            verifikasi: {
              type: 'string',
              description: 'Metode verifikasi'
            },
            tanggal_upload: {
              type: 'string',
              format: 'date-time',
              description: 'Tanggal upload data'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username admin'
            },
            password: {
              type: 'string',
              description: 'Password admin'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer'
                    },
                    username: {
                      type: 'string'
                    },
                    role: {
                      type: 'string'
                    }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    access_token: {
                      type: 'string'
                    },
                    refresh_token: {
                      type: 'string'
                    },
                    token_type: {
                      type: 'string'
                    },
                    expires_in: {
                      type: 'integer'
                    }
                  }
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};