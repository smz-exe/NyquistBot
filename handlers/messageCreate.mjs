import { ndnDice } from "../commands/utils/dice.mjs";

export default async (message) => {
  if (message.content.match(/High T|high T|HIGH T/)) {
    await message.reply("HIGH T");
  }
  
  if (message.content.match(/Low T|low T|LOW T/)) {
    await message.reply("LOW T");
  }

  if (message.content.match(/なるほどね|なるね|I got it|なるねぇ/)) {
    await message.reply("なるねぇ");
  }

  if (message.content.match(/さすがに|流石に/)) {
    await message.reply("がにさす、やるだけ");
  }
  
  if (message.content.match(/なーる|なーるね/)) {
    await message.reply("それは流石に派生しすぎやろ、原型無くなってもうてるやん");
  }

  if (message.content.match(/^\d+d\d+$/)) {
    await message.reply(ndnDice(message.content));
  }


  if (message.content.match(/やるだけ/)) {
    const responses = [
      "やるだけ",
      "Just Do It !",
      "やる、だけ",
      "やるだけやから",
      "単に、やるだけやから",
      "ただ、やるだけやから",
      "Personality is to a man what perfume is to a flower."
    ];
    const randomIndex = Math.floor(Math.random() * responses.length);
    const randomResponse = responses[randomIndex];
    await message.reply(randomResponse);
  }
};