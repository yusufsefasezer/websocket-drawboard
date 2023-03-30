"use strict";
var ws = null,
  SOCKET_URL = "ws://localhost:3000",
  CONNECT_STATUS = true,
  canvas = null;

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
}

function onCanvasMouseDown() {
  DrawBoard.setStatus(true);
}

// Canvas events
function onCanvasMouseMove(e) {
  if (!DrawBoard.DRAWING) return;
  socketSendData("draw", {
    X: e.offsetX,
    Y: e.offsetY,
  });
}

function onCanvasMouseUp() {
  socketSendData("stopDraw", null);
}

// WebSocket events
function onSocketOpen() {
  CONNECT_STATUS = true;
  socketSendData("first", null);
}

function onSocketMessage(e) {
  var data = JSON.parse(e.data);
  switch (data.action) {
    case "draw":
      DrawBoard.draw(data.data.X, data.data.Y);
      break;
    case "stopDraw":
      DrawBoard.setStatus(false);
      DrawBoard.context.beginPath();
      break;
    case "setColor":
      DrawBoard.setColor(data.data);
      break;
    case "setSize":
      DrawBoard.setSize(data.data);
      break;
    case "clear":
      DrawBoard.clear();
      break;
    case "getData":
      socketSendData("setData", DrawBoard.getData());
      break;
    case "setData":
      DrawBoard.setData(data.data);
      break;
    default:
      alert("Grrr");
      break;
  }
}

function onSocketError() {
  CONNECT_STATUS = false;
}

function onSocketClose() {
  CONNECT_STATUS = false;
}

function socketSendData(action, data) {
  if (!CONNECT_STATUS) return;
  ws.send(JSON.stringify({
    action: action,
    data: data
  }));
}

function initElem() {
  canvas = document.querySelector("#drawboard");
  // WebSocket
  ws = new WebSocket(SOCKET_URL);
}

function initEvent() {
  canvas.addEventListener("mousedown", onCanvasMouseDown);
  canvas.addEventListener("mousemove", onCanvasMouseMove);
  window.addEventListener("mouseup", onCanvasMouseUp);
  ws.addEventListener("open", onSocketOpen);
  ws.addEventListener("message", onSocketMessage);
  ws.addEventListener("error", onSocketError);
  ws.addEventListener("close", onSocketClose);

  // Tool events
  document.querySelector("#color").addEventListener("change", function () {
    socketSendData("setColor", this.value);
  });
  document.querySelector("#size").addEventListener("change", function () {
    socketSendData("setSize", this.value);
  });
  document.querySelector("#clear").addEventListener("click", function () {
    socketSendData("clear", null);
  });
  document.querySelector("#save").addEventListener("click", function () {
    DrawBoard.download();
  });
}

function init() {
  initElem();
  initEvent();
  DrawBoard.init(canvas);
}

document.addEventListener("DOMContentLoaded", init);