import "dotenv/config";
import fs from "fs";
import path from "path";
import express from "express";
import {
    Client,
    Collection,
    GatewayIntentBits,
    ActivityType,
} from "discord.js";
import CommandsRegister from "./regist-commands.mjs";
import User from "./models/user.mjs";
import Attendance from "./models/attendance.mjs";
import Vocabulary from "./models/vocabulary.mjs";
import TestScore from "./models/testScores.mjs";
import sequelize, {
    disableForeignKeyConstraints,
    enableForeignKeyConstraints,
} from "./models/sequelize.mjs";
let postCount = 0;
const app = express();
app.listen(3000);
app.post("/", function (req, res) {
    console.log(`Received POST request.`);
    postCount++;
    if (postCount == 10) {
        trigger();
        postCount = 0;
    }
    res.send("POST response by glitch");
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

client.commands = new Collection();

const categoryFoldersPath = path.join(process.cwd(), "commands");
const commandFolders = fs.readdirSync(categoryFoldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(categoryFoldersPath, folder);
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".mjs"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        import(filePath).then((module) => {
            client.commands.set(module.data.name, module);
        });
    }
}

const handlers = new Map();

const handlersPath = path.join(process.cwd(), "handlers");
const handlerFiles = fs
    .readdirSync(handlersPath)
    .filter((file) => file.endsWith(".mjs"));

for (const file of handlerFiles) {
    const filePath = path.join(handlersPath, file);
    import(filePath).then((module) => {
        handlers.set(file.slice(0, -4), module);
    });
}

client.on("interactionCreate", async (interaction) => {
    await handlers.get("interactionCreate").default(interaction);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
    await handlers.get("voiceStateUpdate").default(oldState, newState);
});

client.on("messageCreate", async (message) => {
    if (message.author.id == client.user.id || message.author.bot) return;
    await handlers.get("messageCreate").default(message);
});

client.on("ready", async () => {
    await client.user.setActivity("📚", {
        type: ActivityType.Custom,
        state: "ただひたすらに集中📚",
    });
    console.log(`${client.user.tag} がログインしました！`);

    console.log("スラッシュコマンドを登録します...");

    // 新しいコマンドを登録
    await CommandsRegister();

    console.log("スラッシュコマンドの登録が完了しました。");
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");

        // 外部キー制約を無効にする
        await disableForeignKeyConstraints();

        // テーブルの同期
        await User.sync({ alter: true });
        await Attendance.sync({ alter: true });
        await TestScore.sync({ alter: true });
        await Vocabulary.sync({ alter: true });

        // 外部キー制約を再度有効にする
        await enableForeignKeyConstraints();

        console.log("All models were synchronized successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
        console.error(error);
    }
})();

client.login(process.env.TOKEN);
