import fs from "fs";
import path from "path";
import { REST, Routes } from "discord.js";

const commands = [];
const foldersPath = path.join(process.cwd(), "commands");

export default async () => {
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        if (fs.statSync(commandsPath).isDirectory()) {
            // ディレクトリかどうかを確認
            const commandFiles = fs
                .readdirSync(commandsPath)
                .filter((file) => file.endsWith(".mjs"));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                await import(filePath).then((module) => {
                    commands.push(module.data.toJSON());
                });
            }
        }
    }

    const rest = new REST().setToken(process.env.TOKEN);

    (async () => {
        try {
            console.log(
                `[INIT] ${commands.length}つのスラッシュコマンドを更新します。`
            );

            // アプリケーション全体のコマンドとして登録
            await rest.put(
                Routes.applicationCommands(process.env.APPLICATION_ID),
                { body: commands }
            );

            await rest.put(
                Routes.applicationCommands(
                    process.env.APPLICATION_ID,
                    process.env.GUILD_ID
                ),
                { body: commands }
            );

            console.log(
                `[INIT] ${commands.length}つのスラッシュコマンドをサーバー(${process.env.GUILD_ID})に更新しました。`
            );

            console.log(
                `[INIT] ${commands.length}つのスラッシュコマンドを更新しました。`
            );
        } catch (error) {
            console.error(
                "スラッシュコマンドの登録中にエラーが発生しました:",
                error
            );
        }
    })();
};
