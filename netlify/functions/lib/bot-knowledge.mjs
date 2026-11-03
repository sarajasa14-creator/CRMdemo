/* Customer-service bot: what the bot is allowed to know.
   The company fills this in (the lines that start with [TÄYTÄ ...] are placeholders; the bot ignores them until they are replaced with real text).
   The bot answers ONLY from this text. If the answer is not here, it says so and offers a human. Keep it short and factual, one fact per line. */
export const CONTACT_URL = '';          // [TÄYTÄ] e.g. 'mailto:tuki@yritys.fi' or a contact page. Shown to the visitor when a human is needed.
export const KNOWLEDGE = `
# How the service works
[TÄYTÄ: one or two sentences about what the service is and how cashback is earned]
[TÄYTÄ: which partner casinos / conditions the cashback applies to]

# Cashback
[TÄYTÄ: cashback percentage(s) and what they are calculated from]
[TÄYTÄ: when cashback is credited (daily/weekly/monthly) and where the member sees it]
[TÄYTÄ: how and when cashback is paid out, minimum amounts, fees]
[TÄYTÄ: wagering requirements or other conditions, if any]

# Account and registration
[TÄYTÄ: how to register, what is needed, how to change email, how to delete the account]
Only persons aged 18 or older may use the service.

# Problems
[TÄYTÄ: what to check if cashback has not arrived (e.g. wait time, what info the member should send to support)]

# Responsible gambling (this part is real and should stay)
Gambling should be entertainment, never a way to earn money or to win back losses.
Players can set limits or exclude themselves from gambling at the casino where they play; the casino's own responsible-gambling settings are the place for this.
Free, confidential help in Finnish: Peluuri, https://www.peluuri.fi (helpline, chat and the OmaPeluuri self-help service). [TÄYTÄ: check the current phone number and opening hours on peluuri.fi before adding them here]
If someone says they are in immediate danger, they should call the emergency number 112.
`;

