const message = {
  type: "object",
  required: ["message"],
  properties: { message: { type: "string" } },
};
const email = { type: "string", format: "email", maxLength: 254 };
const password = {
  type: "string",
  format: "password",
  minLength: 8,
  maxLength: 128,
  pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s])\\S{8,128}$",
  description:
    "Uppercase, lowercase, number, symbol; no whitespace. Confirmation must match.",
};
const response = (description, schema = message) => ({
  description,
  content: { "application/json": { schema } },
});
const post = (operationId, summary, properties, code = "200", extra = {}) => ({
  tags: ["Account"],
  operationId,
  summary,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: Object.keys(properties),
          properties,
        },
      },
    },
  },
  responses: {
    [code]: response("Success"),
    400: response("Invalid fields or invalid/expired reset token"),
    403: response("Origin not allowed"),
    413: response("Body exceeds 16 KiB"),
    415: response("Use application/json"),
    429: response("Too many attempts; wait one minute"),
    500: response("Service error"),
    502: response("Identity service unavailable"),
    ...extra,
  },
});
module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Cashflow Proptee CRM API",
    version: "1.0.0",
    description:
      "Working account APIs backed by MongoDB. JSON uses UTF-8 (encoding, not encryption). Local HTTP is for development only; use HTTPS for encrypted transport. Register, then login, then GET /me: your browser sends the HttpOnly session cookie automatically. Try it out changes the connected database. Never enter real production credentials here. Local reset mode returns a reset link without email; normal mode requires a mail provider. Properties/leads business APIs are not implemented yet.",
  },
  servers: [{ url: "/", description: "Same origin as this documentation" }],
  tags: [
    {
      name: "Account",
      description: "Register, login, profile, logout and password recovery",
    },
    { name: "System" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "crm_session",
        description:
          "Set automatically by login. Do not paste cookies into Swagger; use login on this same origin.",
      },
    },
  },
  paths: {
    "/api/auth/health": {
      get: {
        tags: ["System"],
        operationId: "health",
        summary: "Check API and database connection",
        responses: {
          200: response("Connected", {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok"] },
              storage: { type: "string", example: "mongodb" },
            },
          }),
          503: response("Database unavailable"),
        },
      },
    },
    "/api/auth/register": {
      post: post(
        "register",
        "Create account — register page",
        {
          name: { type: "string", minLength: 2, maxLength: 100 },
          phone: { type: "string", pattern: "^[6-9][0-9]{9}$" },
          email,
          password,
          confirmPassword: password,
        },
        "201",
        { 409: response("Email already registered") },
      ),
    },
    "/api/auth/login": {
      post: post(
        "login",
        "Sign in — login page",
        {
          email,
          password: {
            type: "string",
            format: "password",
            minLength: 1,
            maxLength: 128,
          },
        },
        "200",
        { 401: response("Incorrect email or password") },
      ),
    },
    "/api/auth/me": {
      get: {
        tags: ["Account"],
        operationId: "profile",
        summary: "Read signed-in profile — dashboard",
        security: [{ sessionCookie: [] }],
        responses: {
          200: response("Safe profile; excludes hashes and tokens", {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  email,
                  phone: { type: "string" },
                },
              },
            },
          }),
          401: response("Sign in required"),
          500: response("Service error"),
        },
      },
    },
    "/api/auth/logout": {
      post: {
        ...post("logout", "Sign out — dashboard (send empty JSON object)", {}),
        security: [{ sessionCookie: [] }],
      },
    },
    "/api/auth/forgot-password": {
      post: post(
        "forgotPassword",
        "Request reset — forgot-password page",
        { email },
        "200",
        {
          200: response(
            "Generic response; resetUrl exists only in explicit local development mode",
            {
              ...message,
              properties: {
                ...message.properties,
                resetUrl: {
                  type: "string",
                  format: "uri",
                  description:
                    "LOCAL TEST ONLY: contains a single-use token in the URL fragment, expires in 15 minutes.",
                },
              },
            },
          ),
          503: response("Email delivery is not configured"),
        },
      ),
    },
    "/api/auth/reset-password": {
      post: post("resetPassword", "Change password — reset-password page", {
        token: {
          type: "string",
          pattern: "^[a-f0-9]{64}$",
          description:
            "Use the token from your reset link fragment. Single use, 15 minutes.",
        },
        password,
        confirmPassword: password,
      }),
    },
  },
};
