const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: "http://localhost:5173/",
});

const allUsers = {};

io.on("connection", (socket) => {
  allUsers[socket.id] = {
    socket: socket,
    online: true,
  };

  socket.on("request_to_play", (data) => {
    const currUser = allUsers[socket.id];
    currUser.playerName = data.playerName;

    let opponentPlayer;

    for (const key in allUsers) {
      const user = allUsers[key];
      if (user.online && !user.playing && socket.id !== key) {
        opponentPlayer = user;
        break;
      }
    }
    if (opponentPlayer) {
      currUser.socket.emit("OpponentFound", {
        opponent: opponentPlayer.playerName,
        Symbol: "circle"
      });

      opponentPlayer.socket.emit("OpponentFound", {
        opponent: currUser.playerName,
        Symbol: "cross"
      });

      currUser.socket.on("playerMoveFromClient", (data) => {
        opponentPlayer.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });
      opponentPlayer.socket.on("playerMoveFromClient", (data) => {
        currUser.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });
    } else {
      currUser.socket.emit("opponentNotFound");
    }
  });

  socket.on("disconnect", function () {
    const currUser = allUsers[socket.id];
    currUser.online = false;
  });
});

httpServer.listen(3000);
