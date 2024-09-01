import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import TestScore from "../../models/testScores.mjs";
import User from "../../models/user.mjs";
import QuickChart from "quickchart-js";
import { formatInTimeZone } from "date-fns-tz";
import { Op } from "sequelize";

export const data = new SlashCommandBuilder()
    .setName("test_score_graph")
    .setDescription("Displays the test scores over the past week.");

export async function execute(interaction) {
    const timeZone = "Asia/Tokyo";
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    try {
        // Fetch test score records from the past week
        const records = await TestScore.findAll({
            where: {
                date: {
                    [Op.between]: [
                        formatInTimeZone(oneWeekAgo, timeZone, "yyyy-MM-dd"),
                        formatInTimeZone(now, timeZone, "yyyy-MM-dd"),
                    ],
                },
            },
            include: [{ model: User }],
            order: [["date", "ASC"]],
            raw: true,
        });

        console.log("Fetched records:", records);

        if (records.length === 0) {
            await interaction.reply("No test scores found for the past week.");
            return;
        }

        // Organize data by user and date
        const userMap = records.reduce((acc, record) => {
            const username = record["User.username"];
            const date = record.date.split(" ")[0]; // Remove time part
            const score = record.normalizedScore;

            if (!acc[username]) {
                acc[username] = {};
            }

            acc[username][date] = score;

            return acc;
        }, {});

        console.log("User map:", userMap);

        // Generate labels for the x-axis (days)
        const labels = Array.from(
            new Set(records.map((record) => record.date.split(" ")[0]))
        ).sort();

        // Create datasets
        const datasets = Object.keys(userMap).map((username) => {
            const data = labels.map((date) => userMap[username][date] || null);

            return {
                label: username,
                data: data,
                borderColor: `rgba(${Math.floor(
                    Math.random() * 255
                )}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
                    Math.random() * 255
                )}, 1)`,
                fill: false,
                tension: 0.1,
            };
        });

        console.log("Datasets:", datasets);

        // QuickChart のインスタンスを作成
        const chart = new QuickChart();
        chart
            .setConfig({
                type: "line",
                data: {
                    labels: labels,
                    datasets: datasets,
                },
                options: {
                    scales: {
                        xAxes: [
                            {
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: "日付",
                                },
                            },
                        ],
                        yAxes: [
                            {
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: "得点",
                                },
                                ticks: {
                                    suggestedMin: 60,
                                    suggestedMax: 100,
                                },
                            },
                        ],
                    },
                },
            })
            .setWidth(800)
            .setHeight(600)
            .setBackgroundColor("white");

        // 画像URLを取得
        const imageUrl = chart.getUrl();

        // 画像をDiscordに送信
        const attachment = new AttachmentBuilder(imageUrl, {
            name: "test_score_graph.png",
        });
        await interaction.reply({ files: [attachment] });
    } catch (error) {
        console.error("Error generating graph:", error);
        await interaction.reply(
            "An error occurred while generating the graph."
        );
    }
}
