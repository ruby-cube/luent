export default {
  name: 'ruescript-service', // used to identify the service in the logs and in Volar Labs
  create(context): ServicePluginInstance {
    return {
      provideHover(document, position, token) {
        // Implement hover support here
      },
      // More methods...
    };
  },
} satisfies ServicePlugin;