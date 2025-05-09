const loadChatWidget = (config = {}) => {
  // Create container div if not provided
  const containerId = config.containerId || "chat-widget-container";
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }

  // Load required dependencies dynamically
  const loadDependency = (src, isModule = false) => {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }

      const script = document.createElement("script");
      script.src = src;
      if (isModule) script.type = "module";
      script.onload = resolve;
      document.head.appendChild(script);
    });
  };

  // Load React if not already loaded
  Promise.all([
    !window.React
      ? loadDependency("https://unpkg.com/react@18/umd/react.production.min.js")
      : Promise.resolve(),
    !window.ReactDOM
      ? loadDependency(
          "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
        )
      : Promise.resolve(),
    !window.io
      ? loadDependency("https://cdn.socket.io/4.7.2/socket.io.min.js")
      : Promise.resolve(),
  ]).then(() => {
    // Load the widget script
    const widgetScript = document.createElement("script");
    widgetScript.src =
      config.widgetUrl || "https://your-cdn.com/chat-widget.umd.js";
    widgetScript.onload = () => {
      // Initialize the widget with config
      window.ChatWidget.initialize({
        ...config,
        containerId,
      });
    };
    document.head.appendChild(widgetScript);
  });
};

// Auto-install if script is loaded directly
if (window.chatWidgetAutoLoad !== false) {
  window.addEventListener("DOMContentLoaded", () => {
    loadChatWidget(window.chatWidgetConfig || {});
  });
}

// Export for manual installation
window.loadChatWidget = loadChatWidget;
