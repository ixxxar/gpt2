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
const fs = require("fs");
const configuration = new Configuration({
  apiKey: "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",
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
fs.open("./info.txt", "a+", () => console.log('opened'));
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

function levenshtein(s1, s2, costs) {
  if(!s1) return 20
  var i, j, l1, l2, flip, ch, chl, ii, ii2, cost, cutHalf;
  l1 = s1.length;
  l2 = s2.length;

  costs = costs || {};
  var cr = costs.replace || 1;
  var cri = costs.replaceCase || costs.replace || 1;
  var ci = costs.insert || 1;
  var cd = costs.remove || 1;

  cutHalf = flip = Math.max(l1, l2);

  var minCost = Math.min(cd, ci, cr);
  var minD = Math.max(minCost, (l1 - l2) * cd);
  var minI = Math.max(minCost, (l2 - l1) * ci);
  var buf = new Array(cutHalf * 2 - 1);

  for (i = 0; i <= l2; ++i) {
    buf[i] = i * minD;
  }

  for (i = 0; i < l1; ++i, flip = cutHalf - flip) {
    ch = s1[i];
    chl = ch.toLowerCase();

    buf[flip] = (i + 1) * minI;

    ii = flip;
    ii2 = cutHalf - flip;

    for (j = 0; j < l2; ++j, ++ii, ++ii2) {
      cost = ch === s2[j] ? 0 : chl === s2[j].toLowerCase() ? cri : cr;
      buf[ii + 1] = Math.min(buf[ii2 + 1] + cd, buf[ii] + ci, buf[ii2] + cost);
    }
  }
  return buf[l2 + cutHalf - flip];
}

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
	if(!msg.text) return false
  const chatId = msg.chat.id;
	bot.sendChatAction(chatId, "typing");
  const interval = setInterval(() => {
    bot.sendChatAction(chatId, "typing");
  }, 3000);

  console.log("Req: ", msg.text);
  if (msg.text === "/start") {
    bot.sendMessage(
chatId, "Привет, я рада нашему знакомству! Вы можете задать мне вопрос или попросить написать текст по какой-то теме, или код под вашу задачу. Кстати, умею создавать изображения. Например, напишите мне: " + "<i>Сгенерируй фото веселого плюшевого медведя в шапке на красной площади</i>", {parse_mode: 'HTML'}
    );
    clearInterval(interval);
	  return;
  }
  if (msg?.text?.trim()?.toLowerCase() === "как тебя зовут?") {
    bot.sendMessage(chatId, "Я Eva, задайте мне вопрос.");
  clearInterval(interval);    
return;
  }
  const toComp = msg?.text?.trim()?.toLowerCase()?.split(" ")?.slice(0, 2);
  if (
    levenshtein(toComp?.join(" "), "сгенерируй картинку") <= 9 ||
    levenshtein(toComp?.join(" "), "сгенерируй фото") <= 9 ||
	  levenshtein(toComp?.join(" "), "сгенерируй изображение") <= 9
  ) {
    if(msg.text.trim().split(" ").slice(2).length === 0) {
      bot.sendMessage(chatId, 'Опишите изображение, которое я должна сгенерировать.')
      clearInterval(interval)
      return
    }
    try {
      const response = await openai.createImage({
        prompt: msg.text.trim().split(" ").slice(2).join(" "),
        n: 1,
        size: "1024x1024",
      });
      const image_url = response.data.data[0].url;
      bot.sendPhoto(chatId, image_url);
	    clearInterval(interval);
	    return;
    } catch (e) {
      console.log(e);
      bot.sendMessage(
        chatId,
        "Это еще слишком сложно для меня. Я передала это моим создателям, они скоро это исправят. Но на всякий случай попробуйте позже"
      );
    }
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
      max_tokens: 3950 - msg.text.length - 11,
    });

    // console.log(res.body);
    const { choices } = res.data;
    clearInterval(interval);
    // console.log(choices[0].text);
    // users.chatId = choices[0].text;
    bot.sendMessage(
      chatId,
      choices[0].text.includes("Answer:")
        ? choices[0].text.split("Answer:")[1]
        : choices[0].text
    );
fs.appendFile(
      "./info.txt",
      `Вопрос:${msg.text};;;Ответ:${
        choices[0].text.includes("Answer:")
          ? choices[0].text.split("Answer:")[1]
          : choices[0].text
      };;;Пользователь:${msg.from.username};;;Дата:${new Date(Date.now()).toLocaleString('ru', 'Europe/Moscow')}\n`, () => console.log('written')
    );
  } catch (e) {
    console.log(e);
	  console.log(e.data)
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
        clearInterval(interval);
        // console.log(choices[0].text);
        // users.chatId = choices[0].text;
        bot.sendMessage(chatId, choices[0].text);
        break;
      } catch (e) {
        if (i === 3) {
          clearInterval(interval);
          bot.sendMessage(
            chatId,
            "Это еще слишком сложно для меня. Я передала это моим создателям, они скоро это исправят. Но на всякий случай попробуйте позжее"
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
