import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import User from "../../models/user.mjs";

export const data = new SlashCommandBuilder()
    .setName("register")
    .setDescription("ユーザー名を登録はこちらから");

export async function execute(interaction) {
    const username = interaction.user.username;

    try {
        await User.create({ username });

        const embed = new EmbedBuilder()
            .setTitle("登録成功")
            .setColor(0x00ae86)
            .setDescription(`Hello ${username} !, 朝活へようこそ!!`);

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        let errorMessage = `ユーザー名 ${username} の登録中にエラーが発生しました。`;

        if (error.name === "SequelizeUniqueConstraintError") {
            errorMessage = `ユーザー名 ${username} は既に登録されています。`;
        }

        const embed = new EmbedBuilder()
            .setTitle("登録失敗")
            .setColor(0xff0000)
            .setDescription(errorMessage);

        await interaction.reply({ embeds: [embed] });
    }
}
