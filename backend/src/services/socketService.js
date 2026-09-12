const { Server } = require('socket.io');

let io = null;

function initSocket(server, clientOrigin) {
  io = new Server(server, {
    cors: {
      origin: clientOrigin || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function broadcastTelemetry(data) {
  if (io) {
    io.emit('telemetry', data);
  }
}

function broadcastAlert(alert) {
  if (io) {
    io.emit('alert', alert);
  }
}

function broadcastAlertAck(alert) {
  if (io) {
    io.emit('alert_ack', alert);
  }
}

module.exports = {
  initSocket,
  getIO,
  broadcastTelemetry,
  broadcastAlert,
  broadcastAlertAck
};
