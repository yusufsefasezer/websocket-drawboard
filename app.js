"use strict";
var ws = null,
  SOCKET_URL = "ws://localhost:3000",
  CONNECT_STATUS = true;

function init() {
  var canvas = document.querySelector("#drawboard");
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  DrawBoard.init(canvas);
  window.addEventListener("mouseup", stopDraw);

  // Tool events
  document.querySelector("#color").addEventListener("change", function (event) {
    socketSendData("setColor", this.value);
  });
  document.querySelector("#size").addEventListener("change", function (event) {
    socketSendData("setSize", this.value);
  });
  document.querySelector("#clear").addEventListener("click", function (event) {
    socketSendData("clear", null);
  });
  document.querySelector("#save").addEventListener("click", function (event) {
    DrawBoard.download();
  });

  // WebSocket
  ws = new WebSocket(SOCKET_URL);
  ws.addEventListener("open", socketOpen);
  ws.addEventListener("message", socketMessage);
  ws.addEventListener("error", socketError);
  ws.addEventListener("close", socketClose);
};

// WebSocket events
function socketOpen(event) {
  CONNECT_STATUS = true;
  socketSendData("first", null);
};

function socketMessage(event) {

  var receivedData = JSON.parse(event.data);

  switch (receivedData.action) {
    case "draw":
      DrawBoard.draw(receivedData.data.X, receivedData.data.Y);
      break;
    case "stopDraw":
      DrawBoard.setStatus(false);
      DrawBoard.context.beginPath();
      break;
    case "setColor":
      DrawBoard.setColor(receivedData.data);
      break;
    case "setSize":
      DrawBoard.setSize(receivedData.data);
      break;
    case "clear":
      DrawBoard.clear();
      break;
    case "getData":
      socketSendData("setData", DrawBoard.getData());
      break;
    case "setData":
      DrawBoard.setData(receivedData.data);
      break;
    default:
      alert("WTF???");
      break;
  }
};

function socketError(event) {
  CONNECT_STATUS = false;
};

function socketClose(event) {
  CONNECT_STATUS = false;
};

function socketSendData(action, data) {
  if (!CONNECT_STATUS) return;
  ws.send(JSON.stringify({
    action: action,
    data: data
  }));
};

// Canvas events
function draw(event) {
  if (!DrawBoard.DRAWING) return;
  socketSendData("draw", {
    X: event.offsetX,
    Y: event.offsetY,
  });
};

function startDraw(event) {
  DrawBoard.setStatus(true);
};

function stopDraw(event) {
  socketSendData("stopDraw", null);
};

// DrawBoard
var DrawBoard = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 500,
  FILENAME: "draw.png",
  DRAWING: false,
  LINEWIDTH: 3,
  tools: {},
  init: function (element) {
    this.canvas = element;
    this.canvas.width = this.CANVAS_WIDTH;
    this.canvas.height = this.CANVAS_HEIGHT;
    this.context = this.canvas.getContext("2d");
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.lineWidth = this.LINEWIDTH * 2;
  },
  draw: function (x, y) {
    this.context.lineTo(x, y);
    this.context.stroke();
    this.context.beginPath();
    this.context.arc(x, y, this.LINEWIDTH, 0, Math.PI * 2, true);
    this.context.fill();
    this.context.beginPath();
    this.context.moveTo(x, y);
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  setStatus: function (newStatus) {
    this.DRAWING = newStatus;
  },
  setColor: function (newColor) {
    this.context.fillStyle = newColor;
    this.context.strokeStyle = newColor;
  },
  setSize: function (newSize) {
    this.context.lineWidth = newSize * 2;
    this.LINEWIDTH = newSize;
  },
  download: function () {
    this.canvas.toBlob(function (blob) {
      var link = document.createElement("a");
      link.download = DrawBoard.FILENAME;
      link.href = URL.createObjectURL(blob);
      link.dispatchEvent(new MouseEvent("click"))
    }, "image/png", 1);
  },
  getData: function () {
    return this.canvas.toDataURL();
  },
  setData: function (newData) {
    var that = this;
    var img = new Image();
    img.src = newData;
    img.onload = function () {
      that.context.drawImage(img, 0, 0);
    }
  }
};

document.addEventListener("DOMContentLoaded", init);