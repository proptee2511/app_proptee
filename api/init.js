window.onload = () => {
  window.ui = SwaggerUIBundle({
    url: '/api/openapi.json', dom_id: '#swagger-ui', deepLinking: true,
    validatorUrl: null, persistAuthorization: false, withCredentials: true,
    supportedSubmitMethods: ['get', 'post'], displayRequestDuration: true,
    defaultModelsExpandDepth: -1,
  });
};
