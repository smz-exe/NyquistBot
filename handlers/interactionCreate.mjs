import modalSubmitHandler from './modalSubmit.mjs';

export default async(interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`「${interaction.commandName}」コマンドは見つかりませんでした。`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
      } else {
        await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
      }
    }
  } else if (interaction.isModalSubmit()) {
    try {
      await modalSubmitHandler(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'モーダル送信中にエラーが発生しました。', ephemeral: true });
      } else {
        await interaction.reply({ content: 'モーダル送信中にエラーが発生しました。', ephemeral: true });
      }
    }
  }
};