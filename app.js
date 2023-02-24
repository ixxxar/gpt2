const express = require("express");
const mongoose = require("mongoose");
const timeout = require("connect-timeout");
const config = require("config");
const cors = require("cors");
const chalk = require("chalk");
const routes = require("./routes");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const { json } = require("express");
const { Agent, request } = require("undici");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
<<<<<<< HEAD
  apiKey: "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",
=======
  apiKey: "",
>>>>>>> dc991917d0abd9c5d5e33c1cb51fcc250cac6ac1
});
const openai = new OpenAIApi(configuration);

// const dispatcher = new Agent({
//   connect: { rejectUnauthorized: false, timeout: 60_000 },
// });

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const token = "6028362256:AAFgreHgLuqVPovpXZ1S_jVo__xV0BkRTkI";
app.use(timeout("600s"));
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

const users = {};

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  bot.sendChatAction(chatId, "typing");
  console.log("Req: ", msg.text);
  if (msg.text === "/start") {
    bot.sendMessage(
      chatId,
      "Добро Пожаловать. Я Eva, рада знакомству! Задайте мне вопрос."
    );
    return;
  }
  if (msg.text.trim().toLowerCase() === "как тебя зовут?") {
    bot.sendMessage(chatId, "Я Eva, задайте мне вопрос.");
    return;
  }
  let tokens = msg.text.length + 1;
  let history = "";
  if (Object.keys(users).includes(chatId)) {
    tokens += users.chatId.length;
    history = users.chatId;
  }

  // send a message to the chat acknowledging receipt of their message

  // console.log(history + " " + msg.text);
  try {
    const res = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "Question: " + msg.text,
      temperature: 0,
      max_tokens: 4096 - msg.text.length - 11,
    });

    // console.log(res.body);
    const { choices } = res.data;
    // console.log(choices[0].text);
    // users.chatId = choices[0].text;
    bot.sendMessage(chatId, choices[0].text.split("Answer:")[1]);
  } catch (e) {
    console.log(e);
    for (let i = 1; i <= 3; i++) {
      try {
        const res = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: msg.text,
          temperature: 0,
          max_tokens: 4096 - msg.text.length,
        });

        // console.log(res.body);
        const { choices } = res.data;
        // console.log(choices[0].text);
        // users.chatId = choices[0].text;
        bot.sendMessage(chatId, choices[0].text);
        break;
      } catch (e) {
        if (i === 3) {
          bot.sendMessage(
            chatId,
            "Произошла ошибка. Пожалуйста, попробуйте позже"
          );
          break;
        }
      }
    }
  }
});

io.on("connection", (socket) => {
  console.log(`Client with id ${socket.id} connected`);

  socket.on("message", (message) => {
    console.log("Message: ", message);
  });

  socket.on("disconnect", () => {
    console.log(`Client with id ${socket.id} disconnected`);
  });
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cors());
app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use("/api", routes);

const PORT = config.get("port") ?? 8080;

if (process.env.NODE_ENV === "production") {
  app.use("/", express.static(path.join(__dirname, "client")));

  const indexPath = path.join(__dirname, "client", "index.html");

  app.get("*", (req, res) => {
    res.sendFile(indexPath);
  });
}

async function start() {
  try {
    // await mongoose.connect(config.get("mongoUri"));
    // console.log(chalk.green(`MongoDB connected`));
    http.listen(PORT, () => {
      console.log(chalk.green(`Server has been started on port ${PORT}...`));
    });
  } catch (e) {
    console.log(chalk.red(e.message));
    process.exit(1);
  }
}
start();
