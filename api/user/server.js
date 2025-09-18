const os = require("os");

module.exports = {
  name: "Status",
  desc: "Cek status API, runtime, total request, dan fitur",
  category: "Utility",
  params: [],
  async run(req, res, app, stats) {
    try {
      const runtime = formatRuntime(Date.now() - stats.startTime);
      const totalFitur = countEndpoints(app);

      res.json({
        status: true,
        creator: "Hookrest-Team",
        result: {
          status: "Aktif",
          totalrequest: stats.totalRequest.toString(),
          totalfitur: totalFitur.toString(),
          runtime,
          domain: stats.domain,
        },
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        creator: "Hookrest-Team",
        error: err.message,
      });
    }
  },
};

// Helper functions
function formatRuntime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function countEndpoints(app) {
  return app._router.stack.filter((r) => r.route && r.route.path).length;
}
